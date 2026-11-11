import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { fromSnapshot } from '../../../shared/services/firestoreUtils';
import { AppError } from '../../../shared/utils/errorMessages';
import {
  EVENT_TYPES,
  MEMBER_ROLE,
  MEMBER_STATUS,
  NOTIFICATION_TYPES,
  ORDER_MODE,
  TONTINE_STATUS,
} from '../../../shared/constants/domain';
import { tontineDetailPath } from '../../../app/routePaths';
import { generateInviteCode } from '../logic/inviteCode';
import { addEvent } from './eventService';
import { addNotifications } from '../../notifications/services/notificationService';
import { activeMembers } from '../../contributions/logic/contributions';
import {
  buildRounds,
  buildSlots,
  secureRandom,
  shuffle,
  sumShares,
} from '../../rounds/logic/schedule';
import { getStartBlockers } from '../../rounds/logic/order';

const tontinesCollection = collection(db, 'tontines');
const tontineRef = (tontineId) => doc(db, 'tontines', tontineId);

function settingsFromForm(values) {
  return {
    name: values.name.trim(),
    description: (values.description ?? '').trim(),
    amount: values.amount,
    frequency: values.frequency,
    startDate: values.startDate,
    totalShares: values.totalShares,
    graceDays: values.graceDays,
    penaltyAmount: values.penaltyAmount,
  };
}

function inviteData(tontineId, tontine, ownerId, ownerName) {
  return {
    tontineId,
    tontineName: tontine.name,
    ownerId,
    ownerName,
    amount: tontine.amount,
    frequency: tontine.frequency,
    totalShares: tontine.totalShares,
  };
}

/**
 * Crée la tontine, l'organisateur comme premier membre, le code d'invitation
 * et la première entrée du journal, en un seul lot.
 */
export async function createTontine(actor, profile, values) {
  const settings = settingsFromForm(values);
  const ownerShares = Math.min(values.ownerShares ?? 1, settings.totalShares);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const ref = doc(tontinesCollection);
    const inviteCode = generateInviteCode();
    const batch = writeBatch(db);

    batch.set(ref, {
      ...settings,
      status: TONTINE_STATUS.DRAFT,
      ownerId: actor.uid,
      ownerName: actor.name,
      inviteCode,
      memberIds: [actor.uid],
      coOrganizerIds: [],
      orderMode: values.orderMode,
      payoutOrder: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'tontines', ref.id, 'members', actor.uid), {
      userId: actor.uid,
      displayName: actor.name,
      phone: profile.phone ?? '',
      tontineName: settings.name,
      role: MEMBER_ROLE.ORGANIZER,
      shares: ownerShares,
      status: MEMBER_STATUS.ACTIVE,
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'invites', inviteCode), {
      ...inviteData(ref.id, settings, actor.uid, actor.name),
      createdAt: serverTimestamp(),
    });
    addEvent(batch, ref.id, actor, EVENT_TYPES.TONTINE_CREATED, {
      name: settings.name,
      amount: settings.amount,
      frequency: settings.frequency,
      totalShares: settings.totalShares,
    });

    try {
      await batch.commit();
      return ref.id;
    } catch (error) {
      // Code d'invitation déjà pris (très rare) : on réessaie avec un autre code.
      const inviteTaken = error.code === 'permission-denied' && (await inviteExists(inviteCode));
      if (!inviteTaken) throw error;
    }
  }
  throw new AppError('Impossible de générer un code d’invitation. Réessayez.');
}

async function inviteExists(code) {
  try {
    return (await getDoc(doc(db, 'invites', code))).exists();
  } catch {
    return false;
  }
}

export function subscribeMyTontines(uid, onData, onError) {
  const q = query(tontinesCollection, where('memberIds', 'array-contains', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const tontines = snapshot.docs.map(fromSnapshot);
      tontines.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onData(tontines);
    },
    onError,
  );
}

export function subscribeTontine(tontineId, onData, onError) {
  return onSnapshot(tontineRef(tontineId), (snapshot) => onData(fromSnapshot(snapshot)), onError);
}

/** Modifie les paramètres. Après le démarrage, seuls le nom et la description changent. */
export async function updateTontineSettings(actor, tontine, values) {
  const settings = settingsFromForm(values);
  const isDraft = tontine.status === TONTINE_STATUS.DRAFT;
  const changes = isDraft
    ? { ...settings, orderMode: tontine.drawAt ? tontine.orderMode : values.orderMode }
    : { name: settings.name, description: settings.description };

  // Changer le nombre de parts invalide l'ordre manuel déjà fixé.
  if (isDraft && !tontine.drawAt && settings.totalShares !== tontine.totalShares) {
    changes.payoutOrder = [];
  }

  const batch = writeBatch(db);
  batch.update(tontineRef(tontine.id), { ...changes, updatedAt: serverTimestamp() });
  batch.update(doc(db, 'invites', tontine.inviteCode), {
    ...inviteData(tontine.id, { ...tontine, ...changes }, tontine.ownerId, tontine.ownerName),
  });
  addEvent(batch, tontine.id, actor, EVENT_TYPES.TONTINE_UPDATED, { fields: Object.keys(changes) });
  await batch.commit();
}

/** Ordre de passage choisi par l'organisateur. */
export async function setManualOrder(actor, tontine, order) {
  if (tontine.drawAt) throw new AppError('L’ordre a été tiré au sort : il ne peut plus changer.');
  const batch = writeBatch(db);
  batch.update(tontineRef(tontine.id), {
    payoutOrder: order,
    orderMode: ORDER_MODE.MANUAL,
    updatedAt: serverTimestamp(),
  });
  addEvent(batch, tontine.id, actor, EVENT_TYPES.ORDER_SET, {
    order: order.map((slot) => slot.memberName),
  });
  await batch.commit();
}

/**
 * Tirage au sort : réalisé une seule fois, dans une transaction.
 * Le résultat et sa date sont enregistrés ; les règles empêchent de le relancer.
 */
export async function performDraw(actor, tontineId, members) {
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(tontineRef(tontineId));
    const tontine = fromSnapshot(snapshot);
    if (!tontine) throw new AppError('Tontine introuvable.');
    if (tontine.drawAt) throw new AppError('Le tirage au sort a déjà eu lieu.');
    if (tontine.status !== TONTINE_STATUS.DRAFT) {
      throw new AppError('Le tirage au sort se fait avant le démarrage de la tontine.');
    }
    const active = activeMembers(members);
    if (sumShares(active) !== tontine.totalShares) {
      throw new AppError('Toutes les parts doivent être attribuées avant le tirage au sort.');
    }

    const order = shuffle(buildSlots(active), secureRandom);
    transaction.update(tontineRef(tontineId), {
      payoutOrder: order,
      orderMode: ORDER_MODE.DRAW,
      drawAt: serverTimestamp(),
      drawBy: actor.uid,
      updatedAt: serverTimestamp(),
    });
    addEvent(transaction, tontineId, actor, EVENT_TYPES.DRAW_PERFORMED, {
      order: order.map((slot) => slot.memberName),
    });
    return order;
  });
}

/** Démarre la tontine : statut « en cours », création des tours, notification des membres. */
export async function startTontine(actor, tontine, members) {
  const blockers = getStartBlockers(tontine, members);
  if (blockers.length > 0) throw new AppError(blockers[0]);

  const rounds = buildRounds(tontine);
  const batch = writeBatch(db);
  batch.update(tontineRef(tontine.id), {
    status: TONTINE_STATUS.ACTIVE,
    activatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  for (const round of rounds) {
    batch.set(doc(db, 'tontines', tontine.id, 'rounds', String(round.index)), {
      ...round,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  addEvent(batch, tontine.id, actor, EVENT_TYPES.TONTINE_STARTED, {
    firstDueDate: rounds[0].dueDate,
    lastDueDate: rounds[rounds.length - 1].dueDate,
  });
  addNotifications(batch, actor, tontine.memberIds, {
    tontineId: tontine.id,
    type: NOTIFICATION_TYPES.TONTINE_STARTED,
    message: `La tontine « ${tontine.name} » a démarré. Première échéance : tour n° 1.`,
    link: tontineDetailPath(tontine.id),
  });
  await batch.commit();
}

export async function closeTontine(actor, tontine, status, reason = '') {
  const batch = writeBatch(db);
  batch.update(tontineRef(tontine.id), {
    status,
    closedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  addEvent(
    batch,
    tontine.id,
    actor,
    status === TONTINE_STATUS.COMPLETED
      ? EVENT_TYPES.TONTINE_COMPLETED
      : EVENT_TYPES.TONTINE_CANCELLED,
    reason ? { reason } : {},
  );
  await batch.commit();
}

import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';
import { fromSnapshot } from '../../../shared/services/firestoreUtils';
import { AppError } from '../../../shared/utils/errorMessages';
import { compressImage } from '../../../shared/utils/compressImage';
import { formatAmount } from '../../../shared/utils/formatAmount';
import {
  CONTRIBUTION_STATUS,
  EVENT_TYPES,
  LIMITS,
  NOTIFICATION_TYPES,
  PAYMENT_METHODS,
} from '../../../shared/constants/domain';
import { tontineTabPath } from '../../../app/routePaths';
import { addEvent } from '../../tontines/services/eventService';
import {
  addNotification,
  addNotifications,
} from '../../notifications/services/notificationService';
import { contributionId, depositIndexOf, expectedAmount } from '../logic/contributions';
import { depositLabel } from '../../rounds/logic/schedule';

const contributionRef = (tontineId, depositIndex, memberId) =>
  doc(db, 'tontines', tontineId, 'contributions', contributionId(depositIndex, memberId));

// `deposit` : un dépôt de buildDeposits() (avec un dépôt par tour, il a le numéro du tour).
const depositFields = (deposit) => ({
  roundIndex: deposit.roundIndex ?? deposit.index,
  depositIndex: deposit.index,
});

// Pour le journal : le tour, et la date du dépôt s'il y en a plusieurs par tour.
const depositPayload = (deposit) => ({
  roundIndex: deposit.roundIndex ?? deposit.index,
  ...((deposit.depositsInRound ?? 1) > 1 ? { depositDate: deposit.dueDate } : {}),
});

export function subscribeContributions(tontineId, onData, onError) {
  return onSnapshot(
    collection(db, 'tontines', tontineId, 'contributions'),
    (snapshot) => onData(snapshot.docs.map(fromSnapshot)),
    onError,
  );
}

/** Envoie la capture d'écran (compressée) et renvoie son chemin dans Storage. */
export async function uploadProof(tontineId, uid, file) {
  const blob = await compressImage(file);
  if (blob.size > LIMITS.maxProofSizeBytes) {
    throw new AppError('Image trop lourde, même compressée (2 Mo maximum).');
  }
  const path = `proofs/${tontineId}/${uid}/${Date.now()}.jpg`;
  await uploadBytes(ref(storage, path), blob, { contentType: 'image/jpeg' });
  return path;
}

export function getProofUrl(path) {
  return getDownloadURL(ref(storage, path));
}

const managersOf = (tontine) => [tontine.ownerId, ...(tontine.coOrganizerIds ?? [])];

/** Le membre déclare son paiement (statut « déclaré » en attente de confirmation). */
export async function declarePayment(
  actor,
  { tontine, member, round, existing, method, reference, proofFile },
) {
  const proofPath = proofFile ? await uploadProof(tontine.id, actor.uid, proofFile) : null;
  const amount = expectedAmount(tontine.amount, member.shares);
  const declaration = {
    status: CONTRIBUTION_STATUS.DECLARED,
    method,
    reference: reference.trim(),
    proofPath,
    declaredAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const batch = writeBatch(db);
  const contribution = contributionRef(tontine.id, round.index, actor.uid);
  if (existing) {
    batch.update(contribution, declaration);
  } else {
    batch.set(contribution, {
      ...declaration,
      ...depositFields(round),
      memberId: actor.uid,
      memberName: member.displayName,
      amount,
      penaltyAmount: 0,
    });
  }
  addEvent(batch, tontine.id, actor, EVENT_TYPES.PAYMENT_DECLARED, {
    ...depositPayload(round),
    amount,
    method,
  });
  addNotifications(batch, actor, managersOf(tontine), {
    tontineId: tontine.id,
    type: NOTIFICATION_TYPES.PAYMENT_TO_CONFIRM,
    message: `${actor.name} a déclaré ${formatAmount(amount)} (${PAYMENT_METHODS[method]}) pour le ${depositLabel(round)}. À confirmer.`,
    link: tontineTabPath(tontine.id, 'cotisations'),
  });
  await batch.commit();
}

async function reviewPayment(
  actor,
  { tontine, contribution, deposit: knownDeposit },
  changes,
  eventType,
  notification,
) {
  // Sans le dépôt (date inconnue), on se contente du numéro de tour.
  const deposit = knownDeposit ?? {
    index: depositIndexOf(contribution),
    roundIndex: contribution.roundIndex,
    depositsInRound: 1,
  };
  const ref = contributionRef(tontine.id, depositIndexOf(contribution), contribution.memberId);
  await runTransaction(db, async (transaction) => {
    const current = fromSnapshot(await transaction.get(ref));
    if (current?.status !== CONTRIBUTION_STATUS.DECLARED) {
      throw new AppError('Ce paiement a déjà été traité par quelqu’un d’autre.');
    }
    transaction.update(ref, { ...changes, updatedAt: serverTimestamp() });
    addEvent(transaction, tontine.id, actor, eventType, {
      ...depositPayload(deposit),
      memberId: contribution.memberId,
      memberName: contribution.memberName,
      amount: contribution.amount,
      ...(changes.rejectionReason ? { reason: changes.rejectionReason } : {}),
    });
    addNotification(transaction, actor, {
      userId: contribution.memberId,
      tontineId: tontine.id,
      link: tontineTabPath(tontine.id, 'cotisations'),
      ...notification,
    });
  });
}

const labelOf = (contribution, deposit) =>
  deposit ? depositLabel(deposit) : `tour n° ${contribution.roundIndex}`;

/** `deposit` (facultatif) : le dépôt concerné (buildDeposits), pour les messages et le journal. */
export function confirmPayment(actor, tontine, contribution, deposit) {
  return reviewPayment(
    actor,
    { tontine, contribution, deposit },
    {
      status: CONTRIBUTION_STATUS.CONFIRMED,
      confirmedAt: serverTimestamp(),
      confirmedBy: actor.uid,
    },
    EVENT_TYPES.PAYMENT_CONFIRMED,
    {
      type: NOTIFICATION_TYPES.PAYMENT_CONFIRMED,
      message: `Votre paiement du ${labelOf(contribution, deposit)} (${tontine.name}) est confirmé.`,
    },
  );
}

export function rejectPayment(actor, tontine, contribution, reason, deposit) {
  return reviewPayment(
    actor,
    { tontine, contribution, deposit },
    {
      status: CONTRIBUTION_STATUS.REJECTED,
      rejectionReason: reason.trim(),
      rejectedAt: serverTimestamp(),
      rejectedBy: actor.uid,
    },
    EVENT_TYPES.PAYMENT_REJECTED,
    {
      type: NOTIFICATION_TYPES.PAYMENT_REJECTED,
      message: `Votre paiement du ${labelOf(contribution, deposit)} (${tontine.name}) est rejeté : ${reason.trim()}`,
    },
  );
}

/** Paiement remis directement à l'organisateur (espèces…) : enregistré et confirmé d'un coup. */
export async function recordPayment(
  actor,
  { tontine, member, round, existing, method, reference, proofFile = null },
) {
  const amount = expectedAmount(tontine.amount, member.shares);
  // Photo du reçu (facultative) : rangée dans le dossier de l'organisateur qui l'envoie.
  const proofPath = proofFile ? await uploadProof(tontine.id, actor.uid, proofFile) : null;
  const confirmation = {
    ...(proofPath ? { proofPath } : {}),
    status: CONTRIBUTION_STATUS.CONFIRMED,
    method,
    reference: reference.trim(),
    declaredAt: serverTimestamp(),
    confirmedAt: serverTimestamp(),
    confirmedBy: actor.uid,
    updatedAt: serverTimestamp(),
  };
  const batch = writeBatch(db);
  const contribution = contributionRef(tontine.id, round.index, member.userId);
  if (existing) {
    batch.update(contribution, confirmation);
  } else {
    batch.set(contribution, {
      ...confirmation,
      ...depositFields(round),
      memberId: member.userId,
      memberName: member.displayName,
      amount,
      penaltyAmount: 0,
      proofPath,
    });
  }
  addEvent(batch, tontine.id, actor, EVENT_TYPES.PAYMENT_RECORDED, {
    ...depositPayload(round),
    memberId: member.userId,
    memberName: member.displayName,
    amount,
    method,
  });
  addNotification(batch, actor, {
    userId: member.userId,
    tontineId: tontine.id,
    type: NOTIFICATION_TYPES.PAYMENT_CONFIRMED,
    message: `${actor.name} a enregistré votre paiement du ${depositLabel(round)} (${PAYMENT_METHODS[method]}).`,
    link: tontineTabPath(tontine.id, 'cotisations'),
  });
  await batch.commit();
}

/** Applique la pénalité de retard prévue par la tontine (une seule fois par cotisation). */
export async function applyPenalty(actor, { tontine, member, round, existing }) {
  const batch = writeBatch(db);
  const contribution = contributionRef(tontine.id, round.index, member.userId);
  const penalty = {
    penaltyAmount: tontine.penaltyAmount,
    penaltyAppliedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (existing) {
    batch.update(contribution, penalty);
  } else {
    batch.set(contribution, {
      ...penalty,
      ...depositFields(round),
      memberId: member.userId,
      memberName: member.displayName,
      amount: expectedAmount(tontine.amount, member.shares),
      status: CONTRIBUTION_STATUS.LATE,
    });
  }
  addEvent(batch, tontine.id, actor, EVENT_TYPES.PENALTY_APPLIED, {
    ...depositPayload(round),
    memberId: member.userId,
    memberName: member.displayName,
    amount: tontine.penaltyAmount,
  });
  addNotification(batch, actor, {
    userId: member.userId,
    tontineId: tontine.id,
    type: NOTIFICATION_TYPES.PENALTY_APPLIED,
    message: `Pénalité de retard de ${formatAmount(tontine.penaltyAmount)} appliquée pour le ${depositLabel(round)} (${tontine.name}).`,
    link: tontineTabPath(tontine.id, 'cotisations'),
  });
  await batch.commit();
}

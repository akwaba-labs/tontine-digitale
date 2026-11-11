import {
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { fromSnapshot } from '../../../shared/services/firestoreUtils';
import { AppError } from '../../../shared/utils/errorMessages';
import {
  EVENT_TYPES,
  GUEST_ID_PREFIX,
  MEMBER_ROLE,
  MEMBER_STATUS,
  NOTIFICATION_TYPES,
} from '../../../shared/constants/domain';
import { tontineDetailPath, tontineTabPath } from '../../../app/routePaths';
import { addEvent } from '../../tontines/services/eventService';
import { addNotification } from '../../notifications/services/notificationService';
import { activeMembers } from '../../contributions/logic/contributions';
import { sumShares } from '../../rounds/logic/schedule';

const memberRef = (tontineId, userId) => doc(db, 'tontines', tontineId, 'members', userId);
const tontineRef = (tontineId) => doc(db, 'tontines', tontineId);

export async function findInvite(code) {
  const snapshot = await getDoc(doc(db, 'invites', code));
  if (!snapshot.exists())
    throw new AppError('Aucune tontine ne correspond à ce code. Vérifiez-le.');
  return { code: snapshot.id, ...snapshot.data() };
}

/** Mon adhésion à une tontine (ou null), lisible même avant d'être accepté. */
export async function getMyMembership(tontineId, uid) {
  return fromSnapshot(await getDoc(memberRef(tontineId, uid)));
}

/** Demande d'adhésion : l'organisateur l'accepte ou la refuse. */
export async function requestToJoin(actor, profile, invite, shares) {
  const existing = await getMyMembership(invite.tontineId, actor.uid);
  if (existing?.status === MEMBER_STATUS.ACTIVE) {
    throw new AppError('Vous êtes déjà membre de cette tontine.');
  }
  if (existing?.status === MEMBER_STATUS.PENDING) {
    throw new AppError('Votre demande est déjà envoyée : l’organisateur doit y répondre.');
  }

  const batch = writeBatch(db);
  const memberData = {
    displayName: actor.name,
    phone: profile.phone ?? '',
    shares,
    status: MEMBER_STATUS.PENDING,
    updatedAt: serverTimestamp(),
  };
  if (existing) {
    batch.update(memberRef(invite.tontineId, actor.uid), memberData);
  } else {
    batch.set(memberRef(invite.tontineId, actor.uid), {
      ...memberData,
      userId: actor.uid,
      tontineName: invite.tontineName,
      role: MEMBER_ROLE.MEMBER,
      joinedAt: serverTimestamp(),
    });
  }
  addNotification(batch, actor, {
    userId: invite.ownerId,
    tontineId: invite.tontineId,
    type: NOTIFICATION_TYPES.JOIN_REQUEST,
    message: `${actor.name} demande à rejoindre « ${invite.tontineName} » (${shares} part${shares > 1 ? 's' : ''}).`,
    link: tontineTabPath(invite.tontineId, 'membres'),
  });
  try {
    await batch.commit();
  } catch (error) {
    if (error.code === 'permission-denied') {
      throw new AppError(
        'Cette tontine n’accepte plus de nouveaux membres (elle a démarré ou l’ordre est déjà tiré).',
      );
    }
    throw error;
  }
}

export function subscribeMembers(tontineId, onData, onError) {
  return onSnapshot(
    collection(db, 'tontines', tontineId, 'members'),
    (snapshot) => onData(snapshot.docs.map(fromSnapshot)),
    onError,
  );
}

/** Mes adhésions dans toutes les tontines (pour afficher les demandes en attente). */
export function subscribeMyMemberships(uid, onData, onError) {
  return onSnapshot(
    query(collectionGroup(db, 'members'), where('userId', '==', uid)),
    (snapshot) =>
      onData(snapshot.docs.map((d) => ({ ...fromSnapshot(d), tontineId: d.ref.parent.parent.id }))),
    onError,
  );
}

export async function acceptMember(actor, tontine, members, member) {
  const used = sumShares(activeMembers(members));
  if (used + member.shares > tontine.totalShares) {
    throw new AppError(
      `Plus assez de parts libres : ${tontine.totalShares - used} restante(s), ${member.shares} demandée(s).`,
    );
  }
  const batch = writeBatch(db);
  batch.update(memberRef(tontine.id, member.userId), {
    status: MEMBER_STATUS.ACTIVE,
    updatedAt: serverTimestamp(),
  });
  batch.update(tontineRef(tontine.id), {
    memberIds: arrayUnion(member.userId),
    updatedAt: serverTimestamp(),
  });
  addEvent(batch, tontine.id, actor, EVENT_TYPES.MEMBER_ACCEPTED, {
    memberId: member.userId,
    memberName: member.displayName,
    shares: member.shares,
  });
  addNotification(batch, actor, {
    userId: member.userId,
    tontineId: tontine.id,
    type: NOTIFICATION_TYPES.JOIN_ACCEPTED,
    message: `Votre demande pour « ${tontine.name} » est acceptée. Bienvenue !`,
    link: tontineDetailPath(tontine.id),
  });
  await batch.commit();
}

const ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateGuestId(
  randomValues = (n) => globalThis.crypto.getRandomValues(new Uint32Array(n)),
) {
  const chars = Array.from(randomValues(20), (v) => ID_ALPHABET[v % ID_ALPHABET.length]);
  return `${GUEST_ID_PREFIX}${chars.join('')}`;
}

/**
 * L'organisateur ajoute une personne sans compte (pas de smartphone, pas d'e-mail…).
 * Il enregistre ensuite lui-même ses paiements. L'e-mail, facultatif, reste privé.
 */
export async function addGuestMember(
  actor,
  tontine,
  members,
  { displayName, phone, email, shares },
) {
  const used = sumShares(activeMembers(members));
  if (used + shares > tontine.totalShares) {
    throw new AppError(
      `Plus assez de parts libres : ${tontine.totalShares - used} restante(s), ${shares} demandée(s).`,
    );
  }
  const guestId = generateGuestId();
  const batch = writeBatch(db);
  batch.set(memberRef(tontine.id, guestId), {
    userId: guestId,
    displayName,
    phone: phone ?? '',
    tontineName: tontine.name,
    role: MEMBER_ROLE.MEMBER,
    shares,
    status: MEMBER_STATUS.ACTIVE,
    isGuest: true,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.update(tontineRef(tontine.id), {
    memberIds: arrayUnion(guestId),
    updatedAt: serverTimestamp(),
  });
  if (email) {
    batch.set(doc(db, 'tontines', tontine.id, 'guestContacts', guestId), {
      email,
      updatedAt: serverTimestamp(),
    });
  }
  addEvent(batch, tontine.id, actor, EVENT_TYPES.MEMBER_ADDED, {
    memberId: guestId,
    memberName: displayName,
    shares,
  });
  await batch.commit();
  return guestId;
}

export async function refuseMember(actor, tontine, member) {
  const batch = writeBatch(db);
  batch.update(memberRef(tontine.id, member.userId), {
    status: MEMBER_STATUS.REFUSED,
    updatedAt: serverTimestamp(),
  });
  addEvent(batch, tontine.id, actor, EVENT_TYPES.MEMBER_REFUSED, {
    memberId: member.userId,
    memberName: member.displayName,
  });
  addNotification(batch, actor, {
    userId: member.userId,
    tontineId: tontine.id,
    type: NOTIFICATION_TYPES.JOIN_REFUSED,
    message: `Votre demande pour « ${tontine.name} » n’a pas été acceptée.`,
    link: '',
  });
  await batch.commit();
}

/** Retire un membre (avant le démarrage). L'ordre manuel qui le contenait est effacé. */
export async function removeMember(actor, tontine, member) {
  const batch = writeBatch(db);
  batch.update(memberRef(tontine.id, member.userId), {
    status: MEMBER_STATUS.LEFT,
    role: MEMBER_ROLE.MEMBER,
    updatedAt: serverTimestamp(),
  });
  const orderContainsMember = (tontine.payoutOrder ?? []).some((s) => s.memberId === member.userId);
  batch.update(tontineRef(tontine.id), {
    memberIds: arrayRemove(member.userId),
    coOrganizerIds: arrayRemove(member.userId),
    ...(orderContainsMember ? { payoutOrder: [] } : {}),
    updatedAt: serverTimestamp(),
  });
  if (member.isGuest) {
    // Ses coordonnées privées ne servent plus à rien : on les efface.
    batch.delete(doc(db, 'tontines', tontine.id, 'guestContacts', member.userId));
  }
  addEvent(batch, tontine.id, actor, EVENT_TYPES.MEMBER_REMOVED, {
    memberId: member.userId,
    memberName: member.displayName,
  });
  await batch.commit();
}

/** Quitter une tontine (avant le démarrage) ou annuler sa demande. */
export async function leaveTontine(actor, tontine, membership) {
  const batch = writeBatch(db);
  batch.update(memberRef(tontine.id, actor.uid), {
    status: MEMBER_STATUS.LEFT,
    role: MEMBER_ROLE.MEMBER,
    updatedAt: serverTimestamp(),
  });
  if (membership.status === MEMBER_STATUS.ACTIVE) {
    batch.update(tontineRef(tontine.id), {
      memberIds: arrayRemove(actor.uid),
      coOrganizerIds: arrayRemove(actor.uid),
      updatedAt: serverTimestamp(),
    });
    addEvent(batch, tontine.id, actor, EVENT_TYPES.MEMBER_LEFT, {
      memberId: actor.uid,
      memberName: actor.name,
    });
  }
  await batch.commit();
}

/** Annule une demande en attente (sans accès à la tontine). */
export async function cancelJoinRequest(tontineId, uid) {
  const batch = writeBatch(db);
  batch.update(memberRef(tontineId, uid), {
    status: MEMBER_STATUS.LEFT,
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function setMemberShares(actor, tontine, members, member, shares) {
  const others = sumShares(activeMembers(members).filter((m) => m.userId !== member.userId));
  if (member.status === MEMBER_STATUS.ACTIVE && others + shares > tontine.totalShares) {
    throw new AppError(
      `Impossible : seulement ${tontine.totalShares - others} part(s) disponible(s).`,
    );
  }
  const batch = writeBatch(db);
  batch.update(memberRef(tontine.id, member.userId), { shares, updatedAt: serverTimestamp() });
  if ((tontine.payoutOrder ?? []).length > 0) {
    batch.update(tontineRef(tontine.id), { payoutOrder: [], updatedAt: serverTimestamp() });
  }
  addEvent(batch, tontine.id, actor, EVENT_TYPES.MEMBER_SHARES_CHANGED, {
    memberId: member.userId,
    memberName: member.displayName,
    shares,
  });
  await batch.commit();
}

export async function setCoOrganizer(actor, tontine, member, isCoOrganizer) {
  const batch = writeBatch(db);
  batch.update(memberRef(tontine.id, member.userId), {
    role: isCoOrganizer ? MEMBER_ROLE.CO_ORGANIZER : MEMBER_ROLE.MEMBER,
    updatedAt: serverTimestamp(),
  });
  batch.update(tontineRef(tontine.id), {
    coOrganizerIds: isCoOrganizer ? arrayUnion(member.userId) : arrayRemove(member.userId),
    updatedAt: serverTimestamp(),
  });
  addEvent(batch, tontine.id, actor, EVENT_TYPES.MEMBER_ROLE_CHANGED, {
    memberId: member.userId,
    memberName: member.displayName,
    role: isCoOrganizer ? MEMBER_ROLE.CO_ORGANIZER : MEMBER_ROLE.MEMBER,
  });
  await batch.commit();
}

import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { fromSnapshot } from '../../../shared/services/firestoreUtils';
import {
  EVENT_TYPES,
  NOTIFICATION_TYPES,
  PAYOUT_STATUS,
  TONTINE_STATUS,
  isGuestId,
} from '../../../shared/constants/domain';
import { closeTontine } from '../../tontines/services/tontineService';
import { formatAmount } from '../../../shared/utils/formatAmount';
import { tontineTabPath } from '../../../app/routePaths';
import { addEvent } from '../../tontines/services/eventService';
import { addNotification } from '../../notifications/services/notificationService';

const roundRef = (tontineId, index) => doc(db, 'tontines', tontineId, 'rounds', String(index));

export function subscribeRounds(tontineId, onData, onError) {
  return onSnapshot(
    collection(db, 'tontines', tontineId, 'rounds'),
    (snapshot) => onData(snapshot.docs.map(fromSnapshot).sort((a, b) => a.index - b.index)),
    onError,
  );
}

/** L'organisateur enregistre l'envoi du pot au bénéficiaire. */
export async function markPayoutSent(actor, tontine, round, { method, reference }) {
  const batch = writeBatch(db);
  batch.update(roundRef(tontine.id, round.index), {
    payoutStatus: PAYOUT_STATUS.SENT,
    payoutMethod: method,
    payoutReference: reference.trim(),
    payoutSentAt: serverTimestamp(),
    payoutSentBy: actor.uid,
    updatedAt: serverTimestamp(),
  });
  addEvent(batch, tontine.id, actor, EVENT_TYPES.PAYOUT_SENT, {
    roundIndex: round.index,
    beneficiaryId: round.beneficiaryId,
    beneficiaryName: round.beneficiaryName,
    amount: round.potAmount,
    method,
  });
  addNotification(batch, actor, {
    userId: round.beneficiaryId,
    tontineId: tontine.id,
    type: NOTIFICATION_TYPES.PAYOUT_SENT,
    message: `Le pot du tour n° ${round.index} (${formatAmount(round.potAmount)}) vous a été envoyé. Confirmez sa réception.`,
    link: tontineTabPath(tontine.id, 'tours'),
  });
  await batch.commit();
}

/**
 * Le bénéficiaire confirme avoir reçu le pot : la trace est complète dans les deux sens.
 * Pour un membre sans compte, l'organisateur confirme la remise à sa place.
 */
export async function confirmPayoutReceived(actor, tontine, round) {
  const batch = writeBatch(db);
  batch.update(roundRef(tontine.id, round.index), {
    payoutStatus: PAYOUT_STATUS.RECEIVED,
    payoutConfirmedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  addEvent(batch, tontine.id, actor, EVENT_TYPES.PAYOUT_RECEIVED, {
    roundIndex: round.index,
    amount: round.potAmount,
    ...(isGuestId(round.beneficiaryId) ? { onBehalfOf: round.beneficiaryName } : {}),
  });
  addNotification(batch, actor, {
    userId: tontine.ownerId,
    tontineId: tontine.id,
    type: NOTIFICATION_TYPES.PAYOUT_RECEIVED,
    message: `${actor.name} a confirmé la réception du pot du tour n° ${round.index}.`,
    link: tontineTabPath(tontine.id, 'tours'),
  });
  await batch.commit();
}

/**
 * Remise du pot en une seule fois, quand personne d'autre ne doit confirmer : l'organisateur
 * prend lui-même son pot, ou le remet en main propre à un membre sans compte.
 * Deux écritures successives (envoi, puis réception), chacune vérifiée par les règles.
 */
export async function handOverPayout(actor, tontine, round, payment) {
  if (round.payoutStatus === PAYOUT_STATUS.PENDING) {
    await markPayoutSent(actor, tontine, round, payment);
  }
  await confirmPayoutReceived(actor, tontine, { ...round, payoutStatus: PAYOUT_STATUS.SENT });
  // Dernier pot remis par l'organisateur : la tontine est terminée.
  if (actor.uid === tontine.ownerId && round.index === tontine.totalShares) {
    await closeTontine(actor, tontine, TONTINE_STATUS.COMPLETED);
  }
}

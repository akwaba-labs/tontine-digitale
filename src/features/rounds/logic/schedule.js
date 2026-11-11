import { addDays, addMonths } from '../../../shared/utils/dates';
import { FREQUENCY, PAYOUT_STATUS, ROUND_STATE } from '../../../shared/constants/domain';

/** Date d'échéance du tour n° `index` (1 = date de début). */
export function getDueDate(startDate, frequency, index) {
  if (!Number.isInteger(index) || index < 1) {
    throw new RangeError(`Numéro de tour invalide : ${index}`);
  }
  const steps = index - 1;
  switch (frequency) {
    case FREQUENCY.WEEKLY:
      return addDays(startDate, 7 * steps);
    case FREQUENCY.BIWEEKLY:
      return addDays(startDate, 14 * steps);
    case FREQUENCY.MONTHLY:
      // Toujours calculé depuis la date de début : le 31 reste le 31 quand le mois le permet.
      return addMonths(startDate, steps);
    default:
      throw new RangeError(`Fréquence inconnue : ${frequency}`);
  }
}

export function generateDueDates(startDate, frequency, count) {
  return Array.from({ length: count }, (_, i) => getDueDate(startDate, frequency, i + 1));
}

/** Pot d'un tour = cotisation × nombre total de parts. */
export function computePot(amount, totalShares) {
  if (!Number.isSafeInteger(amount) || !Number.isSafeInteger(totalShares)) {
    throw new RangeError('Le montant et le nombre de parts doivent être des entiers.');
  }
  return amount * totalShares;
}

/** Une entrée par part : un membre à 2 parts apparaît 2 fois et recevra 2 tours. */
export function buildSlots(members) {
  return members.flatMap((member) =>
    Array.from({ length: member.shares }, (_, i) => ({
      memberId: member.userId,
      memberName: member.displayName,
      shareNumber: i + 1,
    })),
  );
}

export function sumShares(members) {
  return members.reduce((total, member) => total + member.shares, 0);
}

/** Mélange de Fisher-Yates. `random` renvoie un nombre dans [0, 1). */
export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Nombre aléatoire cryptographique dans [0, 1). */
export function secureRandom() {
  const buffer = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buffer);
  return buffer[0] / 2 ** 32;
}

/** Construit les documents des tours à partir de l'ordre de passage. */
export function buildRounds(tontine) {
  const { startDate, frequency, amount, totalShares, payoutOrder } = tontine;
  if (payoutOrder.length !== totalShares) {
    throw new RangeError(
      `L'ordre de passage contient ${payoutOrder.length} parts au lieu de ${totalShares}.`,
    );
  }
  const potAmount = computePot(amount, totalShares);
  return payoutOrder.map((slot, i) => ({
    index: i + 1,
    dueDate: getDueDate(startDate, frequency, i + 1),
    beneficiaryId: slot.memberId,
    beneficiaryName: slot.memberName,
    shareNumber: slot.shareNumber,
    potAmount,
    payoutStatus: PAYOUT_STATUS.PENDING,
  }));
}

/**
 * Tour en cours : le premier dont l'échéance n'est pas encore passée.
 * Si toutes les échéances sont passées, le premier tour dont le pot n'a pas été reçu,
 * sinon le dernier tour.
 */
export function getCurrentRoundIndex(rounds, today) {
  if (rounds.length === 0) return null;
  const sorted = [...rounds].sort((a, b) => a.index - b.index);
  const upcoming = sorted.find((round) => round.dueDate >= today);
  if (upcoming) return upcoming.index;
  const unpaid = sorted.find((round) => round.payoutStatus !== PAYOUT_STATUS.RECEIVED);
  return (unpaid ?? sorted[sorted.length - 1]).index;
}

export function getRoundState(round, currentIndex) {
  if (round.payoutStatus === PAYOUT_STATUS.RECEIVED) return ROUND_STATE.COMPLETED;
  if (currentIndex === null) return ROUND_STATE.UPCOMING;
  if (round.index < currentIndex) return ROUND_STATE.AWAITING_PAYOUT;
  if (round.index === currentIndex) return ROUND_STATE.CURRENT;
  return ROUND_STATE.UPCOMING;
}

/** La tontine peut être clôturée quand tous les pots ont été reçus. */
export function areAllPayoutsReceived(rounds, totalShares) {
  return (
    rounds.length === totalShares &&
    rounds.every((round) => round.payoutStatus === PAYOUT_STATUS.RECEIVED)
  );
}

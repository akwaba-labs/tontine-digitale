import { addDays, addMonths } from '../../../shared/utils/dates';
import {
  DAYS_PER_DEPOSIT,
  MONTHS_PER_DEPOSIT,
  PAYOUT_STATUS,
  ROUND_STATE,
} from '../../../shared/constants/domain';
import { formatDate } from '../../../shared/utils/formatDate';

/** Date du dépôt n° `index` (1 = date de début), selon la fréquence des dépôts. */
export function getDueDate(startDate, frequency, index) {
  if (!Number.isInteger(index) || index < 1) {
    throw new RangeError(`Numéro de dépôt invalide : ${index}`);
  }
  const steps = index - 1;
  if (frequency in DAYS_PER_DEPOSIT) return addDays(startDate, DAYS_PER_DEPOSIT[frequency] * steps);
  if (frequency in MONTHS_PER_DEPOSIT) {
    // Toujours calculé depuis la date de début : le 31 reste le 31 quand le mois le permet.
    return addMonths(startDate, MONTHS_PER_DEPOSIT[frequency] * steps);
  }
  throw new RangeError(`Fréquence inconnue : ${frequency}`);
}

/** Nombre de dépôts avant chaque remise du pot (1 pour les tontines créées avant ce réglage). */
export function depositsPerRound(tontine) {
  return tontine.depositsPerRound ?? 1;
}

/** Dates des dépôts du tour n° `roundIndex`. */
export function getRoundDepositDates(tontine, roundIndex) {
  const n = depositsPerRound(tontine);
  return Array.from({ length: n }, (_, j) =>
    getDueDate(tontine.startDate, tontine.frequency, (roundIndex - 1) * n + j + 1),
  );
}

/** Date de remise du pot du tour n° `roundIndex` : le jour de son dernier dépôt. */
export function getRoundDueDate(tontine, roundIndex) {
  return getDueDate(tontine.startDate, tontine.frequency, roundIndex * depositsPerRound(tontine));
}

/** Pot d'un tour = cotisation × nombre total de parts × nombre de dépôts du tour. */
export function potAmountOf(tontine) {
  return computePot(tontine.amount, tontine.totalShares) * depositsPerRound(tontine);
}

/**
 * Tous les dépôts, à partir des tours enregistrés : l'unité sur laquelle on déclare, confirme
 * et pénalise une cotisation. Un tour sans `depositDates` (1 dépôt par tour) donne 1 dépôt.
 */
export function buildDeposits(rounds) {
  const sorted = [...rounds].sort((a, b) => a.index - b.index);
  const deposits = [];
  for (const round of sorted) {
    const dates = round.depositDates ?? [round.dueDate];
    dates.forEach((dueDate, j) => {
      deposits.push({
        index: (round.index - 1) * dates.length + j + 1,
        roundIndex: round.index,
        dueDate,
        numberInRound: j + 1,
        depositsInRound: dates.length,
        beneficiaryId: round.beneficiaryId,
        beneficiaryName: round.beneficiaryName,
      });
    });
  }
  return deposits;
}

/** Dépôt en cours : le premier dont la date n'est pas passée, sinon le dernier. */
export function getCurrentDepositIndex(deposits, today) {
  if (deposits.length === 0) return null;
  return (deposits.find((d) => d.dueDate >= today) ?? deposits[deposits.length - 1]).index;
}

/** « à chaque dépôt » ou « tous les 30 dépôts ». */
export function payoutRhythmLabel(tontine) {
  const n = depositsPerRound(tontine);
  return n === 1 ? 'à chaque dépôt' : `tous les ${n} dépôts`;
}

/** « tour n° 3 » ou, s'il y a plusieurs dépôts par tour, « dépôt du 5 janvier 2027 (tour n° 3) ». */
export function depositLabel(deposit) {
  if ((deposit.depositsInRound ?? 1) <= 1) return `tour n° ${deposit.roundIndex ?? deposit.index}`;
  return `dépôt du ${formatDate(deposit.dueDate)} (tour n° ${deposit.roundIndex})`;
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
  const { totalShares, payoutOrder } = tontine;
  if (payoutOrder.length !== totalShares) {
    throw new RangeError(
      `L'ordre de passage contient ${payoutOrder.length} parts au lieu de ${totalShares}.`,
    );
  }
  const potAmount = potAmountOf(tontine);
  const many = depositsPerRound(tontine) > 1;
  return payoutOrder.map((slot, i) => ({
    index: i + 1,
    dueDate: getRoundDueDate(tontine, i + 1),
    // Avec plusieurs dépôts par tour, leurs dates sont enregistrées avec le tour (figées).
    ...(many ? { depositDates: getRoundDepositDates(tontine, i + 1) } : {}),
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

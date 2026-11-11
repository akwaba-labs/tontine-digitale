import { addDays } from '../../../shared/utils/dates';
import {
  CONTRIBUTION_STATUS,
  MEMBER_STATUS,
  PAYOUT_STATUS,
} from '../../../shared/constants/domain';

/** Identifiant déterministe : une seule cotisation par membre et par tour. */
export function contributionId(roundIndex, memberId) {
  return `${roundIndex}_${memberId}`;
}

/** Montant attendu d'un membre pour un tour : cotisation × nombre de parts. */
export function expectedAmount(tontineAmount, shares) {
  return tontineAmount * shares;
}

/** Dernier jour pour payer sans être en retard (échéance + délai de grâce). */
export function graceDeadline(dueDate, graceDays) {
  return addDays(dueDate, graceDays);
}

export function isPastGrace(dueDate, graceDays, today) {
  return today > graceDeadline(dueDate, graceDays);
}

/**
 * Statut réel d'une cotisation, y compris quand aucun document n'existe encore.
 * - CONFIRMED et DECLARED sont gardés tels quels ;
 * - un paiement absent ou rejeté passe EN RETARD après l'échéance + le délai de grâce.
 */
export function getEffectiveStatus(contribution, round, graceDays, today) {
  const status = contribution?.status ?? CONTRIBUTION_STATUS.PENDING;
  if (status === CONTRIBUTION_STATUS.CONFIRMED || status === CONTRIBUTION_STATUS.DECLARED) {
    return status;
  }
  if (status === CONTRIBUTION_STATUS.LATE) return status;
  if (isPastGrace(round.dueDate, graceDays, today)) return CONTRIBUTION_STATUS.LATE;
  return status;
}

/** Montant total à verser (cotisation + pénalité appliquée). */
export function amountDue(contribution, tontineAmount, shares) {
  return expectedAmount(tontineAmount, shares) + (contribution?.penaltyAmount ?? 0);
}

/** Un membre peut déclarer (ou redéclarer) s'il n'a ni déclaré ni été confirmé. */
export function canDeclare(effectiveStatus) {
  return (
    effectiveStatus === CONTRIBUTION_STATUS.PENDING ||
    effectiveStatus === CONTRIBUTION_STATUS.REJECTED ||
    effectiveStatus === CONTRIBUTION_STATUS.LATE
  );
}

/** La pénalité ne peut être appliquée qu'une fois, après le délai de grâce, si elle est prévue. */
export function canApplyPenalty(contribution, round, tontine, today) {
  if (!tontine.penaltyAmount) return false;
  if (contribution?.status === CONTRIBUTION_STATUS.CONFIRMED) return false;
  if ((contribution?.penaltyAmount ?? 0) > 0) return false;
  return isPastGrace(round.dueDate, tontine.graceDays, today);
}

export function indexContributions(contributions) {
  return new Map(contributions.map((c) => [contributionId(c.roundIndex, c.memberId), c]));
}

export function activeMembers(members) {
  return members.filter((member) => member.status === MEMBER_STATUS.ACTIVE);
}

/**
 * Situation de chaque membre pour un tour donné, et totaux du tour.
 * `contributionsById` : Map produite par indexContributions().
 */
export function summarizeRound({ round, tontine, members, contributionsById, today }) {
  const lines = activeMembers(members).map((member) => {
    const contribution = contributionsById.get(contributionId(round.index, member.userId)) ?? null;
    const status = getEffectiveStatus(contribution, round, tontine.graceDays, today);
    return {
      member,
      contribution,
      status,
      expected: expectedAmount(tontine.amount, member.shares),
      due: amountDue(contribution, tontine.amount, member.shares),
    };
  });

  const expected = lines.reduce((total, line) => total + line.expected, 0);
  const confirmedLines = lines.filter((line) => line.status === CONTRIBUTION_STATUS.CONFIRMED);
  const collected = confirmedLines.reduce(
    (total, line) => total + line.expected + (line.contribution?.penaltyAmount ?? 0),
    0,
  );
  const collectedContributions = confirmedLines.reduce((total, line) => total + line.expected, 0);

  return {
    lines,
    expected,
    collected,
    collectedContributions,
    paymentRate: expected === 0 ? 0 : Math.round((collectedContributions / expected) * 100),
    confirmedCount: confirmedLines.length,
    declaredCount: lines.filter((line) => line.status === CONTRIBUTION_STATUS.DECLARED).length,
    lateLines: lines.filter((line) => line.status === CONTRIBUTION_STATUS.LATE),
    memberCount: lines.length,
  };
}

/**
 * Bilan d'un membre dans une tontine : total versé, total reçu, retards,
 * prochaine échéance et tours où il reçoit le pot.
 */
export function summarizeMember({
  userId,
  tontine,
  member,
  rounds,
  contributionsById,
  currentRoundIndex,
  today,
}) {
  const sorted = [...rounds].sort((a, b) => a.index - b.index);
  let totalPaid = 0;
  let totalPenalties = 0;
  let lateCount = 0;
  let nextDue = null;

  for (const round of sorted) {
    const contribution = contributionsById.get(contributionId(round.index, userId)) ?? null;
    const status = getEffectiveStatus(contribution, round, tontine.graceDays, today);
    const penalty = contribution?.penaltyAmount ?? 0;
    totalPenalties += penalty;

    if (status === CONTRIBUTION_STATUS.CONFIRMED) {
      totalPaid += expectedAmount(tontine.amount, member.shares) + penalty;
    } else if (status === CONTRIBUTION_STATUS.LATE) {
      lateCount += 1;
    }

    if (!nextDue && canDeclare(status)) {
      nextDue = {
        round,
        status,
        amount: amountDue(contribution, tontine.amount, member.shares),
      };
    }
  }

  // On ne propose pas une échéance trop lointaine comme « prochaine » si tout est à jour.
  if (nextDue && currentRoundIndex !== null && nextDue.round.index > currentRoundIndex + 1) {
    nextDue = null;
  }

  const myRounds = sorted.filter((round) => round.beneficiaryId === userId);
  const totalReceived = myRounds
    .filter((round) => round.payoutStatus === PAYOUT_STATUS.RECEIVED)
    .reduce((total, round) => total + round.potAmount, 0);
  const nextPayout =
    myRounds.find((round) => round.payoutStatus !== PAYOUT_STATUS.RECEIVED) ?? null;

  return { totalPaid, totalPenalties, totalReceived, lateCount, nextDue, myRounds, nextPayout };
}

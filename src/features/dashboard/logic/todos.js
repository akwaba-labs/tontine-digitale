import {
  CONTRIBUTION_STATUS,
  MEMBER_STATUS,
  PAYOUT_STATUS,
  TONTINE_STATUS,
} from '../../../shared/constants/domain';
import { diffInDays } from '../../../shared/utils/dates';
import { formatAmount } from '../../../shared/utils/formatAmount';
import { formatDate } from '../../../shared/utils/formatDate';
import { declarePaymentPath, tontineTabPath } from '../../../app/routePaths';
import { indexContributions, summarizeMember } from '../../contributions/logic/contributions';
import { getCurrentRoundIndex } from '../../rounds/logic/schedule';

export const DUE_SOON_DAYS = 2;

/**
 * Choses à faire pour l'utilisateur dans une tontine (calculées, non stockées) :
 * retards, échéance proche (J-2 et jour J), son tour, pot à confirmer,
 * et pour l'organisateur : paiements à confirmer, pots à verser, demandes d'adhésion.
 */
export function buildTodos({ uid, tontine, bundle, today }) {
  const todos = [];
  const members = bundle?.members ?? [];
  const isOwner = tontine.ownerId === uid;
  const isManager = isOwner || (tontine.coOrganizerIds ?? []).includes(uid);

  if (tontine.status === TONTINE_STATUS.DRAFT) {
    const pending = members.filter((m) => m.status === MEMBER_STATUS.PENDING).length;
    if (isOwner && pending > 0) {
      todos.push({
        key: `${tontine.id}-requests`,
        type: 'JOIN_REQUESTS',
        variant: 'warning',
        text: `${pending} demande${pending > 1 ? 's' : ''} d’adhésion à traiter`,
        link: tontineTabPath(tontine.id, 'membres'),
      });
    }
    return todos;
  }
  if (tontine.status !== TONTINE_STATUS.ACTIVE || !bundle?.rounds || !bundle?.contributions)
    return todos;

  const { rounds, contributions } = bundle;
  const contributionsById = indexContributions(contributions);
  const currentRoundIndex = getCurrentRoundIndex(rounds, today);
  const me = members.find((m) => m.userId === uid && m.status === MEMBER_STATUS.ACTIVE);

  if (me) {
    const summary = summarizeMember({
      userId: uid,
      tontine,
      member: me,
      rounds,
      contributionsById,
      currentRoundIndex,
      today,
    });
    const { nextDue } = summary;
    if (nextDue) {
      const days = diffInDays(today, nextDue.round.dueDate);
      const amount = formatAmount(nextDue.amount);
      const link = declarePaymentPath(tontine.id, nextDue.round.index);
      if (nextDue.status === CONTRIBUTION_STATUS.LATE) {
        todos.push({
          key: `${tontine.id}-late`,
          type: 'LATE',
          variant: 'danger',
          text: `Cotisation en retard : ${amount} (tour n° ${nextDue.round.index})`,
          link,
        });
      } else if (nextDue.status === CONTRIBUTION_STATUS.REJECTED) {
        todos.push({
          key: `${tontine.id}-rejected`,
          type: 'REJECTED',
          variant: 'danger',
          text: `Paiement rejeté : à déclarer de nouveau (${amount}, tour n° ${nextDue.round.index})`,
          link,
        });
      } else if (days <= DUE_SOON_DAYS) {
        todos.push({
          key: `${tontine.id}-due`,
          type: 'DUE_SOON',
          variant: 'warning',
          text:
            days <= 0
              ? `Cotisation à payer aujourd’hui : ${amount}`
              : `Cotisation de ${amount} à payer avant le ${formatDate(nextDue.round.dueDate)}`,
          link,
        });
      }
    }

    const currentRound = rounds.find((r) => r.index === currentRoundIndex);
    if (
      currentRound?.beneficiaryId === uid &&
      currentRound.payoutStatus === PAYOUT_STATUS.PENDING
    ) {
      todos.push({
        key: `${tontine.id}-turn`,
        type: 'YOUR_TURN',
        variant: 'success',
        text: `C’est votre tour ! Pot de ${formatAmount(currentRound.potAmount)} le ${formatDate(currentRound.dueDate)}`,
        link: tontineTabPath(tontine.id, 'tours'),
      });
    }
    for (const round of rounds) {
      if (round.beneficiaryId === uid && round.payoutStatus === PAYOUT_STATUS.SENT) {
        todos.push({
          key: `${tontine.id}-received-${round.index}`,
          type: 'CONFIRM_PAYOUT',
          variant: 'success',
          text: `Confirmez la réception du pot du tour n° ${round.index} (${formatAmount(round.potAmount)})`,
          link: tontineTabPath(tontine.id, 'tours'),
        });
      }
    }
  }

  if (isManager) {
    const toConfirm = contributions.filter((c) => c.status === CONTRIBUTION_STATUS.DECLARED).length;
    if (toConfirm > 0) {
      todos.push({
        key: `${tontine.id}-confirm`,
        type: 'TO_CONFIRM',
        variant: 'warning',
        text: `${toConfirm} paiement${toConfirm > 1 ? 's' : ''} à confirmer`,
        link: tontineTabPath(tontine.id, 'cotisations'),
      });
    }
  }
  if (isOwner) {
    for (const round of rounds) {
      if (round.payoutStatus === PAYOUT_STATUS.PENDING && round.dueDate <= today) {
        todos.push({
          key: `${tontine.id}-payout-${round.index}`,
          type: 'PAYOUT_TO_SEND',
          variant: 'info',
          text: `Pot du tour n° ${round.index} à verser à ${round.beneficiaryName}`,
          link: tontineTabPath(tontine.id, 'tours'),
        });
      }
    }
  }
  return todos.map((todo) => ({ ...todo, tontineId: tontine.id, tontineName: tontine.name }));
}

/** Totaux de l'utilisateur sur ses tontines (versé, reçu, retards). */
export function buildTotals({ uid, tontines, bundles, today }) {
  const totals = { paid: 0, received: 0, late: 0 };
  for (const tontine of tontines) {
    const bundle = bundles[tontine.id];
    if (!bundle?.rounds || !bundle?.contributions || !bundle?.members) continue;
    const me = bundle.members.find((m) => m.userId === uid && m.status === MEMBER_STATUS.ACTIVE);
    if (!me) continue;
    const summary = summarizeMember({
      userId: uid,
      tontine,
      member: me,
      rounds: bundle.rounds,
      contributionsById: indexContributions(bundle.contributions),
      currentRoundIndex: getCurrentRoundIndex(bundle.rounds, today),
      today,
    });
    totals.paid += summary.totalPaid;
    totals.received += summary.totalReceived;
    totals.late += summary.lateCount;
  }
  return totals;
}

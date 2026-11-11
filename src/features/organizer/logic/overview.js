import {
  CONTRIBUTION_STATUS,
  MEMBER_STATUS,
  PAYOUT_STATUS,
  TONTINE_STATUS,
} from '../../../shared/constants/domain';
import {
  depositIndexOf,
  indexContributions,
  summarizeRound,
} from '../../contributions/logic/contributions';
import { buildDeposits, getCurrentDepositIndex } from '../../rounds/logic/schedule';

/** L'utilisateur organise (ou co-organise) cette tontine. */
export function isManagerOf(tontine, uid) {
  return tontine.ownerId === uid || (tontine.coOrganizerIds ?? []).includes(uid);
}

/**
 * Ce que l'organisateur doit suivre dans une tontine : paiements à confirmer, demandes
 * d'adhésion, pots à verser, et la collecte du dépôt en cours.
 */
export function summarizeManagedTontine({ uid, tontine, bundle, today }) {
  const isOwner = tontine.ownerId === uid;
  const members = bundle?.members ?? [];
  const requests =
    tontine.status === TONTINE_STATUS.DRAFT && isOwner
      ? members.filter((m) => m.status === MEMBER_STATUS.PENDING)
      : [];
  const base = {
    tontine,
    isOwner,
    requests,
    toConfirm: [],
    payoutsDue: [],
    current: null,
    isLoading: !bundle?.members,
  };
  if (tontine.status !== TONTINE_STATUS.ACTIVE) return base;
  if (!bundle?.rounds || !bundle?.contributions) return { ...base, isLoading: true };

  const deposits = buildDeposits(bundle.rounds);
  const depositsByIndex = new Map(deposits.map((d) => [d.index, d]));
  const toConfirm = bundle.contributions
    .filter((c) => c.status === CONTRIBUTION_STATUS.DECLARED)
    .map((contribution) => ({
      contribution,
      deposit: depositsByIndex.get(depositIndexOf(contribution)) ?? null,
    }))
    .sort((a, b) => (a.deposit?.index ?? 0) - (b.deposit?.index ?? 0));

  const payoutsDue = isOwner
    ? bundle.rounds.filter((r) => r.payoutStatus === PAYOUT_STATUS.PENDING && r.dueDate <= today)
    : [];

  const currentIndex = getCurrentDepositIndex(deposits, today);
  const currentDeposit = depositsByIndex.get(currentIndex) ?? null;
  const current = currentDeposit
    ? {
        deposit: currentDeposit,
        ...summarizeRound({
          round: currentDeposit,
          tontine,
          members,
          contributionsById: indexContributions(bundle.contributions),
          today,
        }),
      }
    : null;

  return { ...base, toConfirm, payoutsDue, current, isLoading: false };
}

/** Vue d'ensemble de toutes les tontines gérées, et le nombre total d'actions en attente. */
export function buildOrganizerOverview({ uid, tontines, bundles, today }) {
  const managed = (tontines ?? [])
    .filter((t) => isManagerOf(t, uid))
    .filter((t) => [TONTINE_STATUS.ACTIVE, TONTINE_STATUS.DRAFT].includes(t.status))
    .map((tontine) =>
      summarizeManagedTontine({ uid, tontine, bundle: bundles[tontine.id], today }),
    );

  const totals = managed.reduce(
    (sum, item) => ({
      toConfirm: sum.toConfirm + item.toConfirm.length,
      requests: sum.requests + item.requests.length,
      payoutsDue: sum.payoutsDue + item.payoutsDue.length,
      late: sum.late + (item.current?.lateLines.length ?? 0),
    }),
    { toConfirm: 0, requests: 0, payoutsDue: 0, late: 0 },
  );
  return {
    managed,
    totals,
    pendingActions: totals.toConfirm + totals.requests + totals.payoutsDue,
  };
}

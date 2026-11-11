import { MEMBER_STATUS, TONTINE_STATUS } from '../../../shared/constants/domain';
import { indexContributions, summarizeMember } from '../../contributions/logic/contributions';
import { buildDeposits, getCurrentDepositIndex } from '../../rounds/logic/schedule';

/**
 * Situation de l'utilisateur dans chacune de ses tontines en cours, et prochaines échéances
 * (dépôts à faire et pots à recevoir), triées par date.
 */
export function buildMemberAgenda({ uid, tontines, bundles, today }) {
  const situations = [];
  for (const tontine of tontines) {
    if (tontine.status !== TONTINE_STATUS.ACTIVE) continue;
    const bundle = bundles[tontine.id];
    if (!bundle?.rounds || !bundle?.contributions || !bundle?.members) continue;
    const member = bundle.members.find(
      (m) => m.userId === uid && m.status === MEMBER_STATUS.ACTIVE,
    );
    if (!member) continue;
    const deposits = buildDeposits(bundle.rounds);
    const summary = summarizeMember({
      userId: uid,
      tontine,
      member,
      rounds: bundle.rounds,
      deposits,
      contributionsById: indexContributions(bundle.contributions),
      currentDepositIndex: getCurrentDepositIndex(deposits, today),
      today,
    });
    const completedRounds = bundle.rounds.filter((r) => r.payoutStatus === 'RECEIVED').length;
    situations.push({ tontine, summary, completedRounds, totalRounds: bundle.rounds.length });
  }

  const events = situations
    .flatMap(({ tontine, summary }) => [
      ...(summary.nextDue
        ? [
            {
              key: `${tontine.id}-due`,
              kind: 'deposit',
              date: summary.nextDue.round.dueDate,
              amount: summary.nextDue.amount,
              status: summary.nextDue.status,
              tontine,
              deposit: summary.nextDue.round,
            },
          ]
        : []),
      ...(summary.nextPayout
        ? [
            {
              key: `${tontine.id}-payout`,
              kind: 'payout',
              date: summary.nextPayout.dueDate,
              amount: summary.nextPayout.potAmount,
              tontine,
              round: summary.nextPayout,
            },
          ]
        : []),
    ])
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    situations,
    events,
    nextDeposit: events.find((e) => e.kind === 'deposit') ?? null,
    nextPayout: events.find((e) => e.kind === 'payout') ?? null,
  };
}

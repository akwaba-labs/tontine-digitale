import { describe, expect, it } from 'vitest';
import {
  amountDue,
  canApplyPenalty,
  canDeclare,
  contributionId,
  getEffectiveStatus,
  graceDeadline,
  indexContributions,
  isPastGrace,
  summarizeMember,
  summarizeRound,
} from './contributions';
import { buildDeposits } from '../../rounds/logic/schedule';

const tontine = { amount: 10000, graceDays: 3, penaltyAmount: 1000, totalShares: 3 };
const round1 = {
  index: 1,
  dueDate: '2026-11-01',
  potAmount: 30000,
  beneficiaryId: 'awa',
  payoutStatus: 'RECEIVED',
};
const round2 = {
  index: 2,
  dueDate: '2026-12-01',
  potAmount: 30000,
  beneficiaryId: 'koffi',
  payoutStatus: 'PENDING',
};
const round3 = {
  index: 3,
  dueDate: '2027-01-01',
  potAmount: 30000,
  beneficiaryId: 'awa',
  payoutStatus: 'PENDING',
};
const members = [
  { userId: 'awa', displayName: 'Awa', shares: 2, status: 'ACTIVE' },
  { userId: 'koffi', displayName: 'Koffi', shares: 1, status: 'ACTIVE' },
  { userId: 'parti', displayName: 'Parti', shares: 1, status: 'LEFT' },
];

describe('retards', () => {
  it('calcule la date limite avec le délai de grâce', () => {
    expect(graceDeadline('2026-01-30', 3)).toBe('2026-02-02');
  });

  it('n’est en retard qu’après le dernier jour de grâce', () => {
    expect(isPastGrace('2026-11-01', 3, '2026-11-04')).toBe(false);
    expect(isPastGrace('2026-11-01', 3, '2026-11-05')).toBe(true);
    expect(isPastGrace('2026-11-01', 0, '2026-11-02')).toBe(true);
  });
});

describe('getEffectiveStatus', () => {
  it('est « à payer » sans document avant la date limite', () => {
    expect(getEffectiveStatus(null, round1, 3, '2026-11-02')).toBe('PENDING');
  });

  it('passe en retard sans paiement après la date limite', () => {
    expect(getEffectiveStatus(null, round1, 3, '2026-11-05')).toBe('LATE');
  });

  it('passe en retard un paiement rejeté après la date limite', () => {
    expect(getEffectiveStatus({ status: 'REJECTED' }, round1, 3, '2026-11-02')).toBe('REJECTED');
    expect(getEffectiveStatus({ status: 'REJECTED' }, round1, 3, '2026-11-10')).toBe('LATE');
  });

  it('garde un paiement déclaré ou confirmé', () => {
    expect(getEffectiveStatus({ status: 'DECLARED' }, round1, 3, '2026-12-31')).toBe('DECLARED');
    expect(getEffectiveStatus({ status: 'CONFIRMED' }, round1, 3, '2026-12-31')).toBe('CONFIRMED');
  });
});

describe('montants et actions', () => {
  it('ajoute la pénalité appliquée au montant dû', () => {
    expect(amountDue(null, 10000, 2)).toBe(20000);
    expect(amountDue({ penaltyAmount: 1000 }, 10000, 2)).toBe(21000);
  });

  it('autorise la déclaration seulement si rien n’est déclaré ni confirmé', () => {
    expect(canDeclare('PENDING')).toBe(true);
    expect(canDeclare('LATE')).toBe(true);
    expect(canDeclare('REJECTED')).toBe(true);
    expect(canDeclare('DECLARED')).toBe(false);
    expect(canDeclare('CONFIRMED')).toBe(false);
  });

  it('autorise une seule pénalité, après la date limite', () => {
    expect(canApplyPenalty(null, round1, tontine, '2026-11-04')).toBe(false);
    expect(canApplyPenalty(null, round1, tontine, '2026-11-05')).toBe(true);
    expect(
      canApplyPenalty({ status: 'LATE', penaltyAmount: 1000 }, round1, tontine, '2026-11-05'),
    ).toBe(false);
    expect(
      canApplyPenalty({ status: 'CONFIRMED', penaltyAmount: 0 }, round1, tontine, '2026-11-05'),
    ).toBe(false);
    expect(canApplyPenalty(null, round1, { ...tontine, penaltyAmount: 0 }, '2026-11-05')).toBe(
      false,
    );
  });
});

describe('summarizeRound', () => {
  const contributions = [
    { roundIndex: 2, memberId: 'awa', status: 'CONFIRMED', penaltyAmount: 0 },
    { roundIndex: 2, memberId: 'koffi', status: 'DECLARED', penaltyAmount: 0 },
  ];

  it('calcule le pot attendu, le pot collecté et le taux de paiement', () => {
    const summary = summarizeRound({
      round: round2,
      tontine,
      members,
      contributionsById: indexContributions(contributions),
      today: '2026-11-20',
    });
    expect(summary.memberCount).toBe(2);
    expect(summary.expected).toBe(30000);
    expect(summary.collected).toBe(20000);
    expect(summary.paymentRate).toBe(67);
    expect(summary.declaredCount).toBe(1);
    expect(summary.lateLines).toHaveLength(0);
  });

  it('liste les retardataires', () => {
    const summary = summarizeRound({
      round: round2,
      tontine,
      members,
      contributionsById: indexContributions([]),
      today: '2026-12-10',
    });
    expect(summary.lateLines.map((line) => line.member.userId)).toEqual(['awa', 'koffi']);
  });
});

describe('summarizeMember', () => {
  const contributions = [
    { roundIndex: 1, memberId: 'awa', status: 'CONFIRMED', penaltyAmount: 1000 },
    { roundIndex: 2, memberId: 'awa', status: 'REJECTED', penaltyAmount: 0 },
  ];

  it('calcule le total versé, reçu, les retards et la prochaine échéance', () => {
    const summary = summarizeMember({
      userId: 'awa',
      tontine,
      member: members[0],
      rounds: [round3, round1, round2],
      deposits: buildDeposits([round3, round1, round2]),
      contributionsById: indexContributions(contributions),
      currentDepositIndex: 3,
      today: '2026-12-20',
    });
    expect(summary.totalPaid).toBe(21000);
    expect(summary.totalPenalties).toBe(1000);
    expect(summary.totalReceived).toBe(30000);
    expect(summary.lateCount).toBe(1);
    expect(summary.nextDue.round.index).toBe(2);
    expect(summary.nextDue.status).toBe('LATE');
    expect(summary.myRounds.map((r) => r.index)).toEqual([1, 3]);
    expect(summary.nextPayout.index).toBe(3);
  });

  it('a un identifiant de cotisation déterministe', () => {
    expect(contributionId(2, 'awa')).toBe('2_awa');
  });
});

import { describe, expect, it } from 'vitest';
import {
  areAllPayoutsReceived,
  buildRounds,
  buildSlots,
  computePot,
  generateDueDates,
  getCurrentRoundIndex,
  getDueDate,
  getRoundState,
  shuffle,
  sumShares,
} from './schedule';

describe('getDueDate', () => {
  it('calcule les échéances hebdomadaires', () => {
    expect(generateDueDates('2026-12-21', 'WEEKLY', 3)).toEqual([
      '2026-12-21',
      '2026-12-28',
      '2027-01-04',
    ]);
  });

  it('calcule les échéances toutes les deux semaines', () => {
    expect(generateDueDates('2026-02-14', 'BIWEEKLY', 3)).toEqual([
      '2026-02-14',
      '2026-02-28',
      '2026-03-14',
    ]);
  });

  it('calcule les échéances mensuelles sans dériver en fin de mois', () => {
    expect(generateDueDates('2026-01-31', 'MONTHLY', 5)).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
      '2026-05-31',
    ]);
  });

  it('gère les années bissextiles', () => {
    expect(getDueDate('2027-12-29', 'MONTHLY', 3)).toBe('2028-02-29');
  });

  it('refuse un tour ou une fréquence invalides', () => {
    expect(() => getDueDate('2026-01-01', 'WEEKLY', 0)).toThrow(RangeError);
    expect(() => getDueDate('2026-01-01', 'DAILY', 1)).toThrow(RangeError);
  });
});

describe('computePot', () => {
  it('multiplie la cotisation par le nombre de parts', () => {
    expect(computePot(25000, 10)).toBe(250000);
  });

  it('refuse les nombres à virgule', () => {
    expect(() => computePot(2500.5, 10)).toThrow(RangeError);
  });
});

const members = [
  { userId: 'awa', displayName: 'Awa', shares: 2 },
  { userId: 'koffi', displayName: 'Koffi', shares: 1 },
];

describe('buildSlots', () => {
  it('crée une entrée par part', () => {
    expect(buildSlots(members)).toEqual([
      { memberId: 'awa', memberName: 'Awa', shareNumber: 1 },
      { memberId: 'awa', memberName: 'Awa', shareNumber: 2 },
      { memberId: 'koffi', memberName: 'Koffi', shareNumber: 1 },
    ]);
    expect(sumShares(members)).toBe(3);
  });
});

describe('shuffle', () => {
  it('garde tous les éléments sans modifier l’original', () => {
    const items = [1, 2, 3, 4, 5];
    const result = shuffle(items, () => 0.42);
    expect(result).toHaveLength(5);
    expect([...result].sort()).toEqual(items);
    expect(items).toEqual([1, 2, 3, 4, 5]);
  });

  it('est déterministe avec le même générateur', () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const first = shuffle([1, 2, 3, 4, 5, 6], random);
    seed = 1;
    expect(shuffle([1, 2, 3, 4, 5, 6], random)).toEqual(first);
  });
});

describe('buildRounds', () => {
  const tontine = {
    startDate: '2026-12-01',
    frequency: 'MONTHLY',
    amount: 10000,
    totalShares: 3,
    payoutOrder: buildSlots(members),
  };

  it('crée un tour par part avec la date, le bénéficiaire et le pot', () => {
    const rounds = buildRounds(tontine);
    expect(rounds).toHaveLength(3);
    expect(rounds[2]).toEqual({
      index: 3,
      dueDate: '2027-02-01',
      beneficiaryId: 'koffi',
      beneficiaryName: 'Koffi',
      shareNumber: 1,
      potAmount: 30000,
      payoutStatus: 'PENDING',
    });
  });

  it('refuse un ordre incomplet', () => {
    expect(() => buildRounds({ ...tontine, totalShares: 4 })).toThrow(RangeError);
  });
});

describe('tour en cours', () => {
  const rounds = [
    { index: 1, dueDate: '2026-11-01', payoutStatus: 'RECEIVED' },
    { index: 2, dueDate: '2026-12-01', payoutStatus: 'PENDING' },
    { index: 3, dueDate: '2027-01-01', payoutStatus: 'PENDING' },
  ];

  it('est le premier tour dont l’échéance n’est pas passée', () => {
    expect(getCurrentRoundIndex(rounds, '2026-11-15')).toBe(2);
    expect(getCurrentRoundIndex(rounds, '2026-12-01')).toBe(2);
    expect(getCurrentRoundIndex(rounds, '2026-12-02')).toBe(3);
  });

  it('reste sur le premier pot non reçu quand tout est passé', () => {
    expect(getCurrentRoundIndex(rounds, '2027-06-01')).toBe(2);
    expect(getCurrentRoundIndex([], '2027-06-01')).toBeNull();
  });

  it('donne l’état de chaque tour', () => {
    expect(getRoundState(rounds[0], 3)).toBe('COMPLETED');
    expect(getRoundState(rounds[1], 3)).toBe('AWAITING_PAYOUT');
    expect(getRoundState(rounds[2], 3)).toBe('CURRENT');
    expect(getRoundState(rounds[2], 2)).toBe('UPCOMING');
  });

  it('sait quand tous les pots sont reçus', () => {
    expect(areAllPayoutsReceived(rounds, 3)).toBe(false);
    const done = rounds.map((r) => ({ ...r, payoutStatus: 'RECEIVED' }));
    expect(areAllPayoutsReceived(done, 3)).toBe(true);
    expect(areAllPayoutsReceived(done, 4)).toBe(false);
  });
});

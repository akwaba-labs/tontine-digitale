import { describe, expect, it } from 'vitest';
import {
  areAllPayoutsReceived,
  buildDeposits,
  depositLabel,
  getCurrentDepositIndex,
  payoutRhythmLabel,
  potAmountOf,
  buildRounds,
  buildSlots,
  computePot,
  generateDueDates,
  getCurrentRoundIndex,
  getDueDate,
  getRoundState,
  payableDeposits,
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

  it('espace les tours de 2, 3, 6 ou 9 mois', () => {
    expect(generateDueDates('2026-01-15', 'EVERY_2_MONTHS', 3)).toEqual([
      '2026-01-15',
      '2026-03-15',
      '2026-05-15',
    ]);
    expect(getDueDate('2026-01-15', 'QUARTERLY', 3)).toBe('2026-07-15');
    expect(getDueDate('2026-01-15', 'SEMIANNUAL', 3)).toBe('2027-01-15');
    expect(getDueDate('2026-01-15', 'EVERY_9_MONTHS', 2)).toBe('2026-10-15');
  });

  it('garde la fin de mois sur de longues périodes', () => {
    expect(getDueDate('2026-08-31', 'SEMIANNUAL', 2)).toBe('2027-02-28');
    expect(getDueDate('2026-08-31', 'SEMIANNUAL', 3)).toBe('2027-08-31');
  });

  it('refuse un tour ou une fréquence invalides', () => {
    expect(() => getDueDate('2026-01-01', 'WEEKLY', 0)).toThrow(RangeError);
    expect(() => getDueDate('2026-01-01', 'HOURLY', 1)).toThrow(RangeError);
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

  it('est le premier tour dont le pot n’a pas été pris, quelle que soit la date', () => {
    expect(getCurrentRoundIndex(rounds)).toBe(2);
    const taken = rounds.map((r, i) => (i === 1 ? { ...r, payoutStatus: 'RECEIVED' } : r));
    expect(getCurrentRoundIndex(taken)).toBe(3);
  });

  it('reste sur le dernier tour quand tous les pots sont pris', () => {
    const done = rounds.map((r) => ({ ...r, payoutStatus: 'RECEIVED' }));
    expect(getCurrentRoundIndex(done)).toBe(3);
    expect(getCurrentRoundIndex([])).toBeNull();
  });

  it('ne propose de payer que le tour en cours, les tours passés et les dates échues', () => {
    const deposits = buildDeposits(rounds);
    expect(payableDeposits(deposits, '2026-11-15').map((d) => d.index)).toEqual([1, 2]);
    // Le 1er janvier est arrivé : le tour 3 peut être payé, même si le pot 2 n'est pas pris.
    expect(payableDeposits(deposits, '2027-01-01').map((d) => d.index)).toEqual([1, 2, 3]);
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

describe('dépôts plusieurs fois par tour', () => {
  const tontine = {
    startDate: '2027-01-01',
    frequency: 'DAILY',
    depositsPerRound: 30,
    amount: 1000,
    totalShares: 3,
    payoutOrder: [
      { memberId: 'awa', memberName: 'Awa', shareNumber: 1 },
      { memberId: 'koffi', memberName: 'Koffi', shareNumber: 1 },
      { memberId: 'yao', memberName: 'Yao', shareNumber: 1 },
    ],
  };

  it('dépôts chaque jour, pot tous les 30 jours', () => {
    const rounds = buildRounds(tontine);
    expect(rounds[0].dueDate).toBe('2027-01-30');
    expect(rounds[0].depositDates).toHaveLength(30);
    expect(rounds[0].depositDates[0]).toBe('2027-01-01');
    expect(rounds[1].depositDates[0]).toBe('2027-01-31');
    expect(rounds[2].dueDate).toBe('2027-03-31');
    expect(rounds[0].potAmount).toBe(1000 * 3 * 30);
    expect(potAmountOf(tontine)).toBe(90000);
  });

  it('numérote les dépôts à la suite et retrouve le dépôt en cours', () => {
    const deposits = buildDeposits(buildRounds(tontine));
    expect(deposits).toHaveLength(90);
    expect(deposits[30]).toMatchObject({
      index: 31,
      roundIndex: 2,
      dueDate: '2027-01-31',
      numberInRound: 1,
      depositsInRound: 30,
      beneficiaryName: 'Koffi',
    });
    expect(getCurrentDepositIndex(deposits, '2027-01-15')).toBe(15);
    // Tant que le pot du tour 1 n'est pas pris, on reste sur le tour 1.
    expect(getCurrentDepositIndex(deposits, '2030-01-01')).toBe(30);
    const afterFirstPot = buildDeposits(
      buildRounds(tontine).map((r) => (r.index === 1 ? { ...r, payoutStatus: 'RECEIVED' } : r)),
    );
    expect(getCurrentDepositIndex(afterFirstPot, '2027-01-15')).toBe(31);
    expect(depositLabel(deposits[30])).toBe('dépôt du 31 janvier 2027 (tour n° 2)');
  });

  it('dépôts chaque mois, pot tous les 3 mois', () => {
    const quarterly = { ...tontine, frequency: 'MONTHLY', depositsPerRound: 3 };
    const rounds = buildRounds(quarterly);
    expect(rounds.map((r) => r.dueDate)).toEqual(['2027-03-01', '2027-06-01', '2027-09-01']);
    expect(payoutRhythmLabel(quarterly)).toBe('tous les 3 dépôts');
  });

  it('un dépôt par tour : rien ne change (pas de depositDates, mêmes numéros)', () => {
    const single = { ...tontine, frequency: 'WEEKLY', depositsPerRound: undefined };
    const rounds = buildRounds(single);
    expect(rounds[0]).not.toHaveProperty('depositDates');
    expect(rounds[1].dueDate).toBe('2027-01-08');
    const deposits = buildDeposits(rounds);
    expect(deposits.map((d) => d.index)).toEqual([1, 2, 3]);
    expect(depositLabel(deposits[1])).toBe('tour n° 2');
  });

  it('dépôts tous les 2 jours', () => {
    expect(getDueDate('2027-01-01', 'EVERY_2_DAYS', 3)).toBe('2027-01-05');
  });
});

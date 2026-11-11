import { describe, expect, it } from 'vitest';
import { getStartBlockers, moveSlot, validatePayoutOrder } from './order';
import { buildSlots } from './schedule';

const members = [
  { userId: 'awa', displayName: 'Awa', shares: 2, status: 'ACTIVE' },
  { userId: 'koffi', displayName: 'Koffi', shares: 1, status: 'ACTIVE' },
];

describe('validatePayoutOrder', () => {
  it('accepte un ordre complet et cohérent', () => {
    expect(validatePayoutOrder(buildSlots(members), members, 3)).toBeNull();
  });

  it('signale un ordre vide, incomplet ou périmé', () => {
    expect(validatePayoutOrder([], members, 3)).toMatch(/pas encore fixé/);
    expect(validatePayoutOrder(buildSlots(members).slice(0, 2), members, 3)).toMatch(/2 tour/);
    const stale = buildSlots([{ ...members[0], shares: 3 }]);
    expect(validatePayoutOrder(stale, members, 3)).toMatch(/ne correspond plus/);
  });
});

describe('getStartBlockers', () => {
  const tontine = { totalShares: 3, payoutOrder: buildSlots(members) };

  it('n’a aucun obstacle quand tout est prêt', () => {
    expect(getStartBlockers(tontine, members)).toEqual([]);
  });

  it('signale les parts manquantes et les demandes en attente', () => {
    const problems = getStartBlockers({ ...tontine, totalShares: 5 }, [
      ...members,
      { userId: 'yao', displayName: 'Yao', shares: 1, status: 'PENDING' },
    ]);
    expect(problems[0]).toMatch(/Il manque 2 part/);
    expect(problems[1]).toMatch(/demandes/);
  });

  it('signale trop de parts', () => {
    expect(getStartBlockers({ ...tontine, totalShares: 2 }, members)[0]).toMatch(/Trop de parts/);
  });
});

describe('moveSlot', () => {
  it('déplace un élément', () => {
    expect(moveSlot(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(moveSlot(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
  });
});

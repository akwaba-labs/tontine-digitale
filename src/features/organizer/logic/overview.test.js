import { describe, expect, it } from 'vitest';
import { buildOrganizerOverview, isManagerOf } from './overview';

const today = '2026-11-11';
const active = {
  id: 'a',
  name: 'Marché',
  status: 'ACTIVE',
  ownerId: 'awa',
  coOrganizerIds: ['koffi'],
  amount: 1000,
  graceDays: 0,
};
const draft = { id: 'd', name: 'Bureau', status: 'DRAFT', ownerId: 'awa', coOrganizerIds: [] };
const other = { id: 'o', name: 'Autre', status: 'ACTIVE', ownerId: 'yao', coOrganizerIds: [] };

const members = [
  { userId: 'awa', displayName: 'Awa', shares: 1, status: 'ACTIVE' },
  { userId: 'koffi', displayName: 'Koffi', shares: 1, status: 'ACTIVE' },
  { userId: 'yao', displayName: 'Yao', shares: 1, status: 'ACTIVE' },
];
const rounds = [
  { index: 1, dueDate: '2026-11-01', beneficiaryId: 'awa', payoutStatus: 'PENDING' },
  { index: 2, dueDate: '2026-12-01', beneficiaryId: 'koffi', payoutStatus: 'PENDING' },
];
const bundles = {
  a: {
    members,
    rounds,
    contributions: [
      { roundIndex: 2, memberId: 'koffi', status: 'DECLARED' },
      { roundIndex: 2, memberId: 'yao', status: 'CONFIRMED' },
    ],
  },
  d: {
    members: [
      { userId: 'awa', status: 'ACTIVE', shares: 1 },
      { userId: 'zoe', status: 'PENDING', shares: 1 },
    ],
  },
};

describe('espace organisateur', () => {
  it('reconnaît l’organisateur et le co-organisateur', () => {
    expect(isManagerOf(active, 'awa')).toBe(true);
    expect(isManagerOf(active, 'koffi')).toBe(true);
    expect(isManagerOf(active, 'yao')).toBe(false);
  });

  it('rassemble les actions en attente des tontines gérées', () => {
    const overview = buildOrganizerOverview({
      uid: 'awa',
      tontines: [active, draft, other],
      bundles,
      today,
    });
    expect(overview.managed.map((m) => m.tontine.id)).toEqual(['a', 'd']);
    expect(overview.totals).toEqual({ toConfirm: 1, requests: 1, payoutsDue: 1, late: 0 });
    expect(overview.pendingActions).toBe(3);
    const marche = overview.managed[0];
    expect(marche.toConfirm[0].deposit.index).toBe(2);
    expect(marche.current.deposit.index).toBe(2);
    expect(marche.current.confirmedCount).toBe(1);
  });

  it('le co-organisateur confirme les paiements mais ne verse pas les pots', () => {
    const overview = buildOrganizerOverview({ uid: 'koffi', tontines: [active], bundles, today });
    expect(overview.totals.toConfirm).toBe(1);
    expect(overview.totals.payoutsDue).toBe(0);
  });
});

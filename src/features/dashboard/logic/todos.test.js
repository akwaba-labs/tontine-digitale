import { describe, expect, it } from 'vitest';
import { buildTodos, buildTotals } from './todos';

const tontine = {
  id: 't1',
  name: 'Tontine',
  status: 'ACTIVE',
  ownerId: 'owner',
  coOrganizerIds: [],
  amount: 10000,
  graceDays: 2,
  penaltyAmount: 0,
  totalShares: 2,
};
const members = [
  { userId: 'owner', displayName: 'Olivier', shares: 1, status: 'ACTIVE' },
  { userId: 'awa', displayName: 'Awa', shares: 1, status: 'ACTIVE' },
];
const rounds = [
  {
    index: 1,
    dueDate: '2026-11-01',
    beneficiaryId: 'awa',
    beneficiaryName: 'Awa',
    potAmount: 20000,
    payoutStatus: 'PENDING',
  },
  {
    index: 2,
    dueDate: '2026-12-01',
    beneficiaryId: 'owner',
    beneficiaryName: 'Olivier',
    potAmount: 20000,
    payoutStatus: 'PENDING',
  },
];

const types = (todos) => todos.map((todo) => todo.type);

describe('buildTodos', () => {
  it('signale un retard au membre et un pot à verser à l’organisateur', () => {
    const bundle = { members, rounds, contributions: [] };
    // Le pot du tour 1 n'est pas pris : on reste sur le tour 1, celui d'Awa.
    expect(types(buildTodos({ uid: 'awa', tontine, bundle, today: '2026-11-10' }))).toEqual([
      'LATE',
      'YOUR_TURN',
    ]);
    expect(types(buildTodos({ uid: 'owner', tontine, bundle, today: '2026-11-10' }))).toEqual([
      'LATE',
      'PAYOUT_TO_SEND',
    ]);
  });

  it('prévient à J-2 et annonce le tour du bénéficiaire', () => {
    const bundle = { members, rounds, contributions: [] };
    expect(types(buildTodos({ uid: 'awa', tontine, bundle, today: '2026-10-30' }))).toEqual([
      'DUE_SOON',
      'YOUR_TURN',
    ]);
    expect(types(buildTodos({ uid: 'awa', tontine, bundle, today: '2026-10-20' }))).toEqual([
      'YOUR_TURN',
    ]);
  });

  it('liste les paiements à confirmer et la réception à confirmer', () => {
    const bundle = {
      members,
      rounds: [{ ...rounds[0], payoutStatus: 'SENT' }, rounds[1]],
      contributions: [
        { roundIndex: 1, memberId: 'awa', status: 'DECLARED' },
        { roundIndex: 1, memberId: 'owner', status: 'CONFIRMED' },
      ],
    };
    expect(types(buildTodos({ uid: 'owner', tontine, bundle, today: '2026-10-25' }))).toEqual([
      'TO_CONFIRM',
    ]);
    expect(types(buildTodos({ uid: 'awa', tontine, bundle, today: '2026-10-25' }))).toEqual([
      'CONFIRM_PAYOUT',
    ]);
  });

  it('signale les demandes d’adhésion d’une tontine en préparation', () => {
    const draft = { ...tontine, status: 'DRAFT' };
    const bundle = { members: [...members, { userId: 'yao', status: 'PENDING', shares: 1 }] };
    expect(buildTodos({ uid: 'owner', tontine: draft, bundle, today: '2026-10-25' })[0].text).toBe(
      '1 demande d’adhésion à traiter',
    );
  });
});

describe('buildTotals', () => {
  it('additionne versé, reçu et retards', () => {
    const bundles = {
      t1: {
        members,
        rounds: [{ ...rounds[0], payoutStatus: 'RECEIVED' }, rounds[1]],
        contributions: [{ roundIndex: 1, memberId: 'awa', status: 'CONFIRMED', penaltyAmount: 0 }],
      },
    };
    expect(buildTotals({ uid: 'awa', tontines: [tontine], bundles, today: '2026-12-10' })).toEqual({
      paid: 10000,
      received: 20000,
      late: 1,
    });
  });
});

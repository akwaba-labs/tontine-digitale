import { readFileSync } from 'node:fs';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

export const PROJECT_ID = 'demo-tontine-rules';

export async function createTestEnv() {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8180,
    },
    storage: {
      rules: readFileSync('storage.rules', 'utf8'),
      host: '127.0.0.1',
      port: 9590,
    },
  });
}

const past = Timestamp.fromDate(new Date('2020-01-01T00:00:00Z'));

export const ACTIVE_ID = 't-active';
export const DRAFT_ID = 't-draft';

// Tontine en cours : owner (1 part), alice (2 parts), co (co-organisateur, 1 part) = 4 parts.
export const activeTontine = {
  name: 'Tontine du quartier',
  description: '',
  amount: 10000,
  frequency: 'MONTHLY',
  startDate: '2020-01-01',
  totalShares: 4,
  graceDays: 3,
  penaltyAmount: 500,
  status: 'ACTIVE',
  ownerId: 'owner',
  ownerName: 'Olivier Organisateur',
  inviteCode: 'ACTV23',
  memberIds: ['owner', 'alice', 'co'],
  coOrganizerIds: ['co'],
  orderMode: 'DRAW',
  payoutOrder: [
    { memberId: 'owner', memberName: 'Olivier', shareNumber: 1 },
    { memberId: 'alice', memberName: 'Alice', shareNumber: 1 },
    { memberId: 'co', memberName: 'Coralie', shareNumber: 1 },
    { memberId: 'alice', memberName: 'Alice', shareNumber: 2 },
  ],
  drawAt: past,
  drawBy: 'owner',
  activatedAt: past,
  createdAt: past,
  updatedAt: past,
};

export const draftTontine = {
  ...activeTontine,
  name: 'Tontine en préparation',
  status: 'DRAFT',
  totalShares: 3,
  inviteCode: 'DRFT23',
  memberIds: ['owner'],
  coOrganizerIds: [],
  orderMode: 'MANUAL',
  payoutOrder: [],
};
delete draftTontine.drawAt;
delete draftTontine.drawBy;
delete draftTontine.activatedAt;

export function member(userId, overrides = {}) {
  return {
    userId,
    displayName: userId,
    phone: '+2250707070707',
    role: 'MEMBER',
    shares: 1,
    status: 'ACTIVE',
    joinedAt: past,
    updatedAt: past,
    ...overrides,
  };
}

export function round(index, beneficiaryId, dueDate, overrides = {}) {
  return {
    index,
    dueDate,
    beneficiaryId,
    beneficiaryName: beneficiaryId,
    shareNumber: 1,
    potAmount: 40000,
    payoutStatus: 'PENDING',
    createdAt: past,
    updatedAt: past,
    ...overrides,
  };
}

/** Données de départ, écrites sans règles. */
export async function seed(env) {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, `tontines/${ACTIVE_ID}`), activeTontine);
    await setDoc(
      doc(db, `tontines/${ACTIVE_ID}/members/owner`),
      member('owner', { role: 'ORGANIZER' }),
    );
    await setDoc(doc(db, `tontines/${ACTIVE_ID}/members/alice`), member('alice', { shares: 2 }));
    await setDoc(
      doc(db, `tontines/${ACTIVE_ID}/members/co`),
      member('co', { role: 'CO_ORGANIZER' }),
    );
    await setDoc(doc(db, `tontines/${ACTIVE_ID}/rounds/1`), round(1, 'owner', '2020-01-01'));
    await setDoc(
      doc(db, `tontines/${ACTIVE_ID}/rounds/2`),
      round(2, 'alice', '2020-02-01', { payoutStatus: 'SENT' }),
    );
    await setDoc(doc(db, `tontines/${ACTIVE_ID}/rounds/3`), round(3, 'co', '2020-03-01'));
    await setDoc(doc(db, `tontines/${ACTIVE_ID}/rounds/4`), round(4, 'alice', '2099-01-01'));
    await setDoc(doc(db, `tontines/${ACTIVE_ID}/contributions/1_alice`), {
      roundIndex: 1,
      memberId: 'alice',
      memberName: 'Alice',
      amount: 20000,
      penaltyAmount: 0,
      method: 'WAVE',
      reference: 'TX-1',
      proofPath: null,
      status: 'DECLARED',
      declaredAt: past,
      updatedAt: past,
    });
    await setDoc(doc(db, `tontines/${ACTIVE_ID}/events/e1`), {
      type: 'TONTINE_CREATED',
      actorId: 'owner',
      actorName: 'Olivier',
      payload: {},
      createdAt: past,
    });
    await setDoc(doc(db, `tontines/${DRAFT_ID}`), draftTontine);
    await setDoc(
      doc(db, `tontines/${DRAFT_ID}/members/owner`),
      member('owner', { role: 'ORGANIZER' }),
    );
    await setDoc(doc(db, `tontines/${DRAFT_ID}/members/bob`), member('bob', { status: 'PENDING' }));
    await setDoc(doc(db, 'invites/DRFT23'), {
      tontineId: DRAFT_ID,
      tontineName: draftTontine.name,
      ownerName: draftTontine.ownerName,
      amount: 10000,
      frequency: 'MONTHLY',
      totalShares: 3,
      createdAt: past,
    });
    await setDoc(doc(db, 'users/alice'), {
      firstName: 'Alice',
      lastName: 'Kouassi',
      email: 'alice@example.com',
      phone: '+2250707070707',
      createdAt: past,
      updatedAt: past,
    });
    await setDoc(doc(db, 'notifications/n-alice'), {
      userId: 'alice',
      tontineId: ACTIVE_ID,
      type: 'PAYMENT_CONFIRMED',
      message: 'Paiement confirmé',
      link: '',
      actorId: 'owner',
      read: false,
      createdAt: past,
    });
  });
}

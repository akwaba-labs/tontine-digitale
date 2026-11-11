import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { ACTIVE_ID, DRAFT_ID, createTestEnv, draftTontine, seed } from './setup';

let env;

beforeAll(async () => {
  env = await createTestEnv();
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed(env);
});

const dbAs = (uid) => env.authenticatedContext(uid).firestore();
const anonymousDb = () => env.unauthenticatedContext().firestore();
const now = serverTimestamp;

describe('users', () => {
  const profile = () => ({
    firstName: 'Bob',
    lastName: 'Yao',
    email: 'bob@example.com',
    phone: '+2250505050505',
    createdAt: now(),
    updatedAt: now(),
  });

  it('un utilisateur crée et lit son propre profil', async () => {
    const db = dbAs('bob');
    await assertSucceeds(setDoc(doc(db, 'users/bob'), profile()));
    await assertSucceeds(getDoc(doc(db, 'users/bob')));
  });

  it('refuse de créer le profil de quelqu’un d’autre', async () => {
    await assertFails(setDoc(doc(dbAs('bob'), 'users/alice2'), profile()));
  });

  it('refuse un téléphone qui n’est pas ivoirien', async () => {
    await assertFails(
      setDoc(doc(dbAs('bob'), 'users/bob'), { ...profile(), phone: '+33612345678' }),
    );
  });

  it('refuse de lire le profil d’un autre', async () => {
    await assertFails(getDoc(doc(dbAs('bob'), 'users/alice')));
  });

  it('un utilisateur supprime son propre profil, pas celui d’un autre', async () => {
    await assertFails(deleteDoc(doc(dbAs('bob'), 'users/alice')));
    await assertSucceeds(deleteDoc(doc(dbAs('alice'), 'users/alice')));
  });
});

describe('invites', () => {
  it('un utilisateur connecté lit une invitation par son code', async () => {
    await assertSucceeds(getDoc(doc(dbAs('zoe'), 'invites/DRFT23')));
  });

  it('refuse de lister les invitations ou de les lire sans connexion', async () => {
    await assertFails(getDocs(collection(dbAs('zoe'), 'invites')));
    await assertFails(getDoc(doc(anonymousDb(), 'invites/DRFT23')));
  });
});

describe('tontines — création', () => {
  const newTontine = (overrides = {}) => ({
    name: 'Nouvelle tontine',
    description: 'Entre collègues',
    amount: 25000,
    frequency: 'WEEKLY',
    startDate: '2027-01-04',
    totalShares: 5,
    graceDays: 2,
    penaltyAmount: 1000,
    status: 'DRAFT',
    ownerId: 'zoe',
    ownerName: 'Zoé',
    inviteCode: 'NEWC23',
    memberIds: ['zoe'],
    coOrganizerIds: [],
    orderMode: 'MANUAL',
    payoutOrder: [],
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  });

  it('crée la tontine, l’organisateur, l’invitation et le journal en un lot', async () => {
    const db = dbAs('zoe');
    const batch = writeBatch(db);
    batch.set(doc(db, 'tontines/t-new'), newTontine());
    batch.set(doc(db, 'tontines/t-new/members/zoe'), {
      userId: 'zoe',
      displayName: 'Zoé',
      phone: '+2250101010101',
      role: 'ORGANIZER',
      shares: 1,
      status: 'ACTIVE',
      joinedAt: now(),
      updatedAt: now(),
    });
    batch.set(doc(db, 'invites/NEWC23'), {
      tontineId: 't-new',
      tontineName: 'Nouvelle tontine',
      ownerName: 'Zoé',
      amount: 25000,
      frequency: 'WEEKLY',
      totalShares: 5,
      createdAt: now(),
    });
    batch.set(doc(db, 'tontines/t-new/events/e1'), {
      type: 'TONTINE_CREATED',
      actorId: 'zoe',
      actorName: 'Zoé',
      payload: {},
      createdAt: now(),
    });
    await assertSucceeds(batch.commit());
  });

  it('refuse une tontine créée directement « en cours »', async () => {
    await assertFails(setDoc(doc(dbAs('zoe'), 'tontines/t-new'), newTontine({ status: 'ACTIVE' })));
  });

  it('refuse une tontine au nom de quelqu’un d’autre', async () => {
    await assertFails(
      setDoc(
        doc(dbAs('zoe'), 'tontines/t-new'),
        newTontine({ ownerId: 'alice', memberIds: ['alice'] }),
      ),
    );
  });

  it('refuse un montant à virgule', async () => {
    await assertFails(setDoc(doc(dbAs('zoe'), 'tontines/t-new'), newTontine({ amount: 25000.5 })));
  });

  it('refuse une invitation qui ne correspond pas à la tontine', async () => {
    await assertFails(
      setDoc(doc(dbAs('zoe'), 'invites/ZZZZ23'), {
        tontineId: DRAFT_ID,
        tontineName: 'Piratage',
        ownerName: 'Zoé',
        amount: 1,
        frequency: 'WEEKLY',
        totalShares: 2,
        createdAt: now(),
      }),
    );
  });
});

describe('tontines — lecture', () => {
  it('un membre lit la tontine et la retrouve dans « mes tontines »', async () => {
    const db = dbAs('alice');
    await assertSucceeds(getDoc(doc(db, `tontines/${ACTIVE_ID}`)));
    await assertSucceeds(
      getDocs(query(collection(db, 'tontines'), where('memberIds', 'array-contains', 'alice'))),
    );
  });

  it('un non-membre ne peut pas la lire', async () => {
    await assertFails(getDoc(doc(dbAs('zoe'), `tontines/${ACTIVE_ID}`)));
    await assertFails(getDocs(collection(dbAs('zoe'), 'tontines')));
  });
});

describe('tontines — modification', () => {
  it('l’organisateur renomme une tontine en cours', async () => {
    await assertSucceeds(
      updateDoc(doc(dbAs('owner'), `tontines/${ACTIVE_ID}`), {
        name: 'Nouveau nom',
        updatedAt: now(),
      }),
    );
  });

  it('le montant ne change plus une fois la tontine en cours', async () => {
    await assertFails(
      updateDoc(doc(dbAs('owner'), `tontines/${ACTIVE_ID}`), { amount: 5000, updatedAt: now() }),
    );
    await assertFails(
      updateDoc(doc(dbAs('owner'), `tontines/${ACTIVE_ID}`), {
        frequency: 'WEEKLY',
        updatedAt: now(),
      }),
    );
  });

  it('le montant peut changer en préparation', async () => {
    await assertSucceeds(
      updateDoc(doc(dbAs('owner'), `tontines/${DRAFT_ID}`), { amount: 5000, updatedAt: now() }),
    );
  });

  it('un membre ou un co-organisateur ne modifie pas les paramètres', async () => {
    await assertFails(
      updateDoc(doc(dbAs('alice'), `tontines/${ACTIVE_ID}`), { name: 'Piraté', updatedAt: now() }),
    );
    await assertFails(
      updateDoc(doc(dbAs('co'), `tontines/${ACTIVE_ID}`), { name: 'Piraté', updatedAt: now() }),
    );
  });

  it('le tirage au sort est enregistré une fois, puis ne peut plus être relancé', async () => {
    const order = [
      { memberId: 'owner', memberName: 'Olivier', shareNumber: 1 },
      { memberId: 'bob', memberName: 'Bob', shareNumber: 1 },
      { memberId: 'carl', memberName: 'Carl', shareNumber: 1 },
    ];
    const db = dbAs('owner');
    const ref = doc(db, `tontines/${DRAFT_ID}`);
    await assertSucceeds(
      updateDoc(ref, {
        payoutOrder: order,
        orderMode: 'DRAW',
        drawAt: now(),
        drawBy: 'owner',
        updatedAt: now(),
      }),
    );
    await assertFails(updateDoc(ref, { payoutOrder: [...order].reverse(), updatedAt: now() }));
    await assertFails(updateDoc(ref, { drawAt: now(), updatedAt: now() }));
  });

  it('refuse de démarrer une tontine dont l’ordre de passage est incomplet', async () => {
    await assertFails(
      updateDoc(doc(dbAs('owner'), `tontines/${DRAFT_ID}`), {
        status: 'ACTIVE',
        activatedAt: now(),
        updatedAt: now(),
      }),
    );
  });

  it('démarre une tontine en créant les tours dans le même lot', async () => {
    const order = draftTontine.payoutOrder.length
      ? draftTontine.payoutOrder
      : [
          { memberId: 'owner', memberName: 'Olivier', shareNumber: 1 },
          { memberId: 'owner', memberName: 'Olivier', shareNumber: 2 },
          { memberId: 'owner', memberName: 'Olivier', shareNumber: 3 },
        ];
    const db = dbAs('owner');
    const batch = writeBatch(db);
    batch.update(doc(db, `tontines/${DRAFT_ID}`), {
      payoutOrder: order,
      status: 'ACTIVE',
      activatedAt: now(),
      updatedAt: now(),
    });
    order.forEach((slot, i) => {
      batch.set(doc(db, `tontines/${DRAFT_ID}/rounds/${i + 1}`), {
        index: i + 1,
        dueDate: '2027-01-0' + (i + 1),
        beneficiaryId: slot.memberId,
        beneficiaryName: slot.memberName,
        shareNumber: slot.shareNumber,
        potAmount: 30000,
        payoutStatus: 'PENDING',
        createdAt: now(),
        updatedAt: now(),
      });
    });
    await assertSucceeds(batch.commit());
  });

  it('une tontine ne peut pas être supprimée', async () => {
    await assertFails(deleteDoc(doc(dbAs('owner'), `tontines/${ACTIVE_ID}`)));
  });
});

describe('members', () => {
  const request = (uid, overrides = {}) => ({
    userId: uid,
    displayName: uid,
    phone: '+2250707070707',
    role: 'MEMBER',
    shares: 1,
    status: 'PENDING',
    joinedAt: now(),
    updatedAt: now(),
    ...overrides,
  });

  it('un utilisateur demande à rejoindre une tontine en préparation', async () => {
    await assertSucceeds(
      setDoc(doc(dbAs('zoe'), `tontines/${DRAFT_ID}/members/zoe`), request('zoe')),
    );
  });

  it('refuse une demande pour une tontine déjà en cours', async () => {
    await assertFails(
      setDoc(doc(dbAs('zoe'), `tontines/${ACTIVE_ID}/members/zoe`), request('zoe')),
    );
  });

  it('refuse une demande au nom de quelqu’un d’autre ou déjà acceptée', async () => {
    await assertFails(setDoc(doc(dbAs('zoe'), `tontines/${DRAFT_ID}/members/yan`), request('yan')));
    await assertFails(
      setDoc(
        doc(dbAs('zoe'), `tontines/${DRAFT_ID}/members/zoe`),
        request('zoe', { status: 'ACTIVE' }),
      ),
    );
  });

  it('l’organisateur accepte une demande ; le demandeur ne peut pas s’accepter lui-même', async () => {
    await assertFails(
      updateDoc(doc(dbAs('bob'), `tontines/${DRAFT_ID}/members/bob`), {
        status: 'ACTIVE',
        updatedAt: now(),
      }),
    );
    const db = dbAs('owner');
    const batch = writeBatch(db);
    batch.update(doc(db, `tontines/${DRAFT_ID}/members/bob`), {
      status: 'ACTIVE',
      updatedAt: now(),
    });
    batch.update(doc(db, `tontines/${DRAFT_ID}`), {
      memberIds: ['owner', 'bob'],
      updatedAt: now(),
    });
    await assertSucceeds(batch.commit());
  });

  it('un membre peut annuler sa demande', async () => {
    await assertSucceeds(
      updateDoc(doc(dbAs('bob'), `tontines/${DRAFT_ID}/members/bob`), {
        status: 'LEFT',
        updatedAt: now(),
      }),
    );
  });

  it('les membres ne changent plus une fois la tontine en cours', async () => {
    await assertFails(
      updateDoc(doc(dbAs('owner'), `tontines/${ACTIVE_ID}/members/alice`), {
        status: 'LEFT',
        updatedAt: now(),
      }),
    );
    await assertFails(
      updateDoc(doc(dbAs('alice'), `tontines/${ACTIVE_ID}/members/alice`), {
        status: 'LEFT',
        updatedAt: now(),
      }),
    );
  });

  it('l’organisateur nomme un co-organisateur ; un membre ne peut pas se promouvoir', async () => {
    await assertFails(
      updateDoc(doc(dbAs('alice'), `tontines/${ACTIVE_ID}/members/alice`), {
        role: 'CO_ORGANIZER',
        updatedAt: now(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(dbAs('owner'), `tontines/${ACTIVE_ID}/members/alice`), {
        role: 'CO_ORGANIZER',
        updatedAt: now(),
      }),
    );
  });

  it('un membre voit la liste ; un demandeur ne voit que sa propre demande', async () => {
    await assertSucceeds(getDocs(collection(dbAs('alice'), `tontines/${ACTIVE_ID}/members`)));
    await assertSucceeds(getDoc(doc(dbAs('bob'), `tontines/${DRAFT_ID}/members/bob`)));
    await assertFails(getDocs(collection(dbAs('bob'), `tontines/${DRAFT_ID}/members`)));
  });
});

describe('rounds', () => {
  it('l’organisateur enregistre l’envoi du pot ; un membre ne peut pas', async () => {
    const payout = {
      payoutStatus: 'SENT',
      payoutMethod: 'WAVE',
      payoutReference: 'TX-99',
      payoutSentAt: now(),
      payoutSentBy: 'owner',
      updatedAt: now(),
    };
    await assertFails(updateDoc(doc(dbAs('alice'), `tontines/${ACTIVE_ID}/rounds/1`), payout));
    await assertSucceeds(updateDoc(doc(dbAs('owner'), `tontines/${ACTIVE_ID}/rounds/1`), payout));
  });

  it('seul le bénéficiaire confirme la réception du pot', async () => {
    const received = { payoutStatus: 'RECEIVED', payoutConfirmedAt: now(), updatedAt: now() };
    await assertFails(updateDoc(doc(dbAs('owner'), `tontines/${ACTIVE_ID}/rounds/2`), received));
    await assertSucceeds(updateDoc(doc(dbAs('alice'), `tontines/${ACTIVE_ID}/rounds/2`), received));
  });

  it('les tours se lisent par les membres et ne se suppriment pas', async () => {
    await assertSucceeds(getDocs(collection(dbAs('alice'), `tontines/${ACTIVE_ID}/rounds`)));
    await assertFails(getDocs(collection(dbAs('zoe'), `tontines/${ACTIVE_ID}/rounds`)));
    await assertFails(deleteDoc(doc(dbAs('owner'), `tontines/${ACTIVE_ID}/rounds/1`)));
  });
});

describe('contributions', () => {
  const declaration = (overrides = {}) => ({
    roundIndex: 3,
    memberId: 'alice',
    memberName: 'Alice',
    amount: 20000,
    penaltyAmount: 0,
    method: 'ORANGE_MONEY',
    reference: 'OM-123',
    proofPath: null,
    status: 'DECLARED',
    declaredAt: now(),
    updatedAt: now(),
    ...overrides,
  });
  const path = `tontines/${ACTIVE_ID}/contributions`;

  it('un membre déclare son paiement', async () => {
    await assertSucceeds(setDoc(doc(dbAs('alice'), `${path}/3_alice`), declaration()));
  });

  it('refuse un montant différent de cotisation × parts', async () => {
    await assertFails(
      setDoc(doc(dbAs('alice'), `${path}/3_alice`), declaration({ amount: 10000 })),
    );
  });

  it('refuse de déclarer pour quelqu’un d’autre', async () => {
    await assertFails(
      setDoc(
        doc(dbAs('alice'), `${path}/3_co`),
        declaration({ memberId: 'co', memberName: 'Coralie', amount: 10000 }),
      ),
    );
  });

  it('un membre ne peut pas se mettre lui-même « confirmé »', async () => {
    await assertFails(
      setDoc(doc(dbAs('alice'), `${path}/3_alice`), declaration({ status: 'CONFIRMED' })),
    );
    await assertFails(
      setDoc(
        doc(dbAs('alice'), `${path}/3_alice`),
        declaration({ status: 'CONFIRMED', confirmedAt: now(), confirmedBy: 'alice' }),
      ),
    );
    await assertFails(
      updateDoc(doc(dbAs('alice'), `${path}/1_alice`), {
        status: 'CONFIRMED',
        confirmedAt: now(),
        confirmedBy: 'alice',
        updatedAt: now(),
      }),
    );
  });

  it('le co-organisateur confirme un paiement déclaré', async () => {
    await assertSucceeds(
      updateDoc(doc(dbAs('co'), `${path}/1_alice`), {
        status: 'CONFIRMED',
        confirmedAt: now(),
        confirmedBy: 'co',
        updatedAt: now(),
      }),
    );
  });

  it('un rejet exige un motif', async () => {
    const reject = (reason) => ({
      status: 'REJECTED',
      rejectionReason: reason,
      rejectedAt: now(),
      rejectedBy: 'owner',
      updatedAt: now(),
    });
    await assertFails(updateDoc(doc(dbAs('owner'), `${path}/1_alice`), reject('')));
    await assertSucceeds(
      updateDoc(doc(dbAs('owner'), `${path}/1_alice`), reject('Référence introuvable')),
    );
  });

  it('un membre redéclare après un rejet', async () => {
    await env.withSecurityRulesDisabled((context) =>
      updateDoc(doc(context.firestore(), `${path}/1_alice`), { status: 'REJECTED' }),
    );
    await assertSucceeds(
      updateDoc(doc(dbAs('alice'), `${path}/1_alice`), {
        status: 'DECLARED',
        method: 'WAVE',
        reference: 'TX-2',
        proofPath: null,
        declaredAt: now(),
        updatedAt: now(),
      }),
    );
  });

  it('l’organisateur enregistre un paiement en espèces ; un membre ne peut pas', async () => {
    const cash = {
      roundIndex: 3,
      memberId: 'co',
      memberName: 'Coralie',
      amount: 10000,
      penaltyAmount: 0,
      method: 'CASH',
      reference: '',
      proofPath: null,
      status: 'CONFIRMED',
      declaredAt: now(),
      confirmedAt: now(),
      updatedAt: now(),
    };
    await assertFails(
      setDoc(doc(dbAs('alice'), `${path}/3_co`), { ...cash, confirmedBy: 'alice' }),
    );
    await assertSucceeds(
      setDoc(doc(dbAs('owner'), `${path}/3_co`), { ...cash, confirmedBy: 'owner' }),
    );
  });

  it('la pénalité s’applique après le délai de grâce, pas avant', async () => {
    const penalty = (roundIndex) => ({
      roundIndex,
      memberId: 'co',
      memberName: 'Coralie',
      amount: 10000,
      penaltyAmount: 500,
      status: 'LATE',
      penaltyAppliedAt: now(),
      updatedAt: now(),
    });
    await assertFails(setDoc(doc(dbAs('owner'), `${path}/4_co`), penalty(4)));
    await assertFails(setDoc(doc(dbAs('co'), `${path}/3_co`), penalty(3)));
    await assertSucceeds(setDoc(doc(dbAs('owner'), `${path}/3_co`), penalty(3)));
  });

  it('une cotisation ne peut pas être supprimée ni lue par un non-membre', async () => {
    await assertFails(deleteDoc(doc(dbAs('owner'), `${path}/1_alice`)));
    await assertFails(getDoc(doc(dbAs('zoe'), `${path}/1_alice`)));
    await assertSucceeds(getDoc(doc(dbAs('co'), `${path}/1_alice`)));
  });
});

describe('events (journal en ajout uniquement)', () => {
  const event = (actorId) => ({
    type: 'PAYMENT_DECLARED',
    actorId,
    actorName: actorId,
    payload: { roundIndex: 1 },
    createdAt: now(),
  });
  const path = `tontines/${ACTIVE_ID}/events`;

  it('un membre ajoute une entrée à son nom', async () => {
    await assertSucceeds(setDoc(doc(dbAs('alice'), `${path}/e2`), event('alice')));
  });

  it('refuse une entrée au nom d’un autre ou par un non-membre', async () => {
    await assertFails(setDoc(doc(dbAs('alice'), `${path}/e2`), event('owner')));
    await assertFails(setDoc(doc(dbAs('zoe'), `${path}/e2`), event('zoe')));
  });

  it('personne, même l’organisateur, ne modifie ou ne supprime une entrée', async () => {
    await assertFails(updateDoc(doc(dbAs('owner'), `${path}/e1`), { type: 'AUTRE' }));
    await assertFails(deleteDoc(doc(dbAs('owner'), `${path}/e1`)));
  });

  it('les membres lisent le journal', async () => {
    await assertSucceeds(getDocs(collection(dbAs('alice'), path)));
    await assertFails(getDocs(collection(dbAs('zoe'), path)));
  });
});

describe('notifications', () => {
  const notification = (userId, actorId) => ({
    userId,
    tontineId: ACTIVE_ID,
    type: 'PAYMENT_TO_CONFIRM',
    message: 'Paiement à confirmer',
    link: `/tontines/${ACTIVE_ID}`,
    actorId,
    read: false,
    createdAt: now(),
  });

  it('un membre notifie un autre membre de la tontine', async () => {
    await assertSucceeds(
      setDoc(doc(dbAs('alice'), 'notifications/n1'), notification('owner', 'alice')),
    );
  });

  it('un non-membre ne peut pas envoyer de notification', async () => {
    await assertFails(setDoc(doc(dbAs('zoe'), 'notifications/n1'), notification('alice', 'zoe')));
  });

  it('un demandeur notifie l’organisateur de sa demande', async () => {
    const db = dbAs('bob');
    await assertSucceeds(
      setDoc(doc(db, 'notifications/n2'), {
        ...notification('owner', 'bob'),
        tontineId: DRAFT_ID,
        type: 'JOIN_REQUEST',
      }),
    );
  });

  it('chacun lit et marque comme lues ses notifications uniquement', async () => {
    await assertSucceeds(getDoc(doc(dbAs('alice'), 'notifications/n-alice')));
    await assertSucceeds(
      getDocs(query(collection(dbAs('alice'), 'notifications'), where('userId', '==', 'alice'))),
    );
    await assertFails(getDoc(doc(dbAs('owner'), 'notifications/n-alice')));
    await assertSucceeds(
      updateDoc(doc(dbAs('alice'), 'notifications/n-alice'), { read: true, readAt: now() }),
    );
    await assertFails(
      updateDoc(doc(dbAs('alice'), 'notifications/n-alice'), { message: 'Modifié' }),
    );
  });
});

describe('collectionGroup members', () => {
  it('un utilisateur retrouve ses demandes en attente', async () => {
    const { collectionGroup } = await import('firebase/firestore');
    await assertSucceeds(
      getDocs(query(collectionGroup(dbAs('bob'), 'members'), where('userId', '==', 'bob'))),
    );
    await assertFails(getDocs(collectionGroup(dbAs('bob'), 'members')));
  });
});

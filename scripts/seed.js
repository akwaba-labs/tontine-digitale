// Données de démonstration pour les émulateurs Firebase (jamais pour un vrai projet).
// 3 utilisateurs, 2 tontines (une en cours, une en préparation), paiements à différents statuts.
//
// Utilisation : émulateurs lancés (npm start ou npm run emulators), puis « npm run seed ».
// Ou en une commande : « npm run start:demo ».
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-tontine-digitale';
if (!PROJECT_ID.startsWith('demo-')) {
  console.error('Refus : ce script ne fonctionne qu’avec un projet de démonstration (demo-…).');
  process.exit(1);
}
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
// Pas de serveur de métadonnées Google Cloud en local : évite une attente et un avertissement.
process.env.METADATA_SERVER_DETECTION ??= 'none';

initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

const PASSWORD = 'demo1234';
const DAY = 24 * 60 * 60 * 1000;

// --- Dates (Abidjan = UTC+0) -------------------------------------------------------------
const pad = (n) => String(n).padStart(2, '0');
const iso = (date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const today = new Date(
  Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()),
);
function addMonths(date, months) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(date.getUTCDate(), lastDay)));
}
const ts = (date) => Timestamp.fromDate(date);
const daysAgo = (n) => ts(new Date(Date.now() - n * DAY));

// --- Utilisateurs -------------------------------------------------------------------------
const people = {
  aminata: {
    firstName: 'Aminata',
    lastName: 'Traoré',
    phone: '+2250707070701',
    email: 'aminata@demo.ci',
  },
  bakary: {
    firstName: 'Bakary',
    lastName: 'Koné',
    phone: '+2250505050502',
    email: 'bakary@demo.ci',
  },
  chantal: {
    firstName: 'Chantal',
    lastName: 'Kouassi',
    phone: '+2250101010103',
    email: 'chantal@demo.ci',
  },
  admin: {
    firstName: 'Admin',
    lastName: 'Plateforme',
    phone: '+2250707070700',
    email: 'admin@demo.ci',
  },
};
const name = (key) => `${people[key].firstName} ${people[key].lastName}`;

async function createUsers() {
  const uids = {};
  for (const [key, person] of Object.entries(people)) {
    let user;
    try {
      user = await auth.getUserByEmail(person.email);
    } catch {
      user = await auth.createUser({
        email: person.email,
        password: PASSWORD,
        displayName: `${person.firstName} ${person.lastName}`,
      });
    }
    uids[key] = user.uid;
    await db.doc(`users/${user.uid}`).set({
      ...person,
      photoURL: null,
      createdAt: daysAgo(90),
      updatedAt: daysAgo(90),
    });
  }
  return uids;
}

function member(uid, key, role, shares, status, tontineName) {
  return {
    userId: uid,
    displayName: name(key),
    phone: people[key].phone,
    tontineName,
    role,
    shares,
    status,
    joinedAt: daysAgo(80),
    updatedAt: daysAgo(80),
  };
}

// --- Tontine 1 : en cours -----------------------------------------------------------------
async function seedActiveTontine(uids) {
  const id = 'demo-commercantes';
  const tontineName = 'Tontine des commerçantes';
  const start = addMonths(today, -2);
  const dueDates = [0, 1, 2, 3].map((i) => iso(addMonths(start, i)));
  const order = [
    { memberId: uids.chantal, memberName: name('chantal'), shareNumber: 1 },
    { memberId: uids.bakary, memberName: name('bakary'), shareNumber: 1 },
    { memberId: uids.aminata, memberName: name('aminata'), shareNumber: 1 },
    { memberId: uids.chantal, memberName: name('chantal'), shareNumber: 2 },
  ];
  const amount = 25000;
  const tontine = {
    name: tontineName,
    description: 'Tontine mensuelle des commerçantes du marché de Treichville.',
    amount,
    frequency: 'MONTHLY',
    startDate: dueDates[0],
    totalShares: 4,
    graceDays: 3,
    penaltyAmount: 2000,
    status: 'ACTIVE',
    ownerId: uids.aminata,
    ownerName: name('aminata'),
    inviteCode: 'DEMO24',
    memberIds: [uids.aminata, uids.bakary, uids.chantal],
    coOrganizerIds: [uids.bakary],
    orderMode: 'DRAW',
    payoutOrder: order,
    drawAt: daysAgo(70),
    drawBy: uids.aminata,
    activatedAt: daysAgo(69),
    createdAt: daysAgo(80),
    updatedAt: daysAgo(1),
  };
  const batch = db.batch();
  batch.set(db.doc(`tontines/${id}`), tontine);
  batch.set(db.doc('invites/DEMO24'), {
    tontineId: id,
    tontineName,
    ownerId: uids.aminata,
    ownerName: name('aminata'),
    amount,
    frequency: 'MONTHLY',
    totalShares: 4,
    createdAt: daysAgo(80),
  });
  batch.set(
    db.doc(`tontines/${id}/members/${uids.aminata}`),
    member(uids.aminata, 'aminata', 'ORGANIZER', 1, 'ACTIVE', tontineName),
  );
  batch.set(
    db.doc(`tontines/${id}/members/${uids.bakary}`),
    member(uids.bakary, 'bakary', 'CO_ORGANIZER', 1, 'ACTIVE', tontineName),
  );
  batch.set(
    db.doc(`tontines/${id}/members/${uids.chantal}`),
    member(uids.chantal, 'chantal', 'MEMBER', 2, 'ACTIVE', tontineName),
  );

  order.forEach((slot, i) => {
    batch.set(db.doc(`tontines/${id}/rounds/${i + 1}`), {
      index: i + 1,
      dueDate: dueDates[i],
      beneficiaryId: slot.memberId,
      beneficiaryName: slot.memberName,
      shareNumber: slot.shareNumber,
      potAmount: amount * 4,
      payoutStatus: i === 0 ? 'RECEIVED' : 'PENDING',
      ...(i === 0
        ? {
            payoutMethod: 'WAVE',
            payoutReference: 'WV-POT-001',
            payoutSentAt: daysAgo(58),
            payoutSentBy: uids.aminata,
            payoutConfirmedAt: daysAgo(57),
          }
        : {}),
      createdAt: daysAgo(69),
      updatedAt: daysAgo(57),
    });
  });

  const shares = { aminata: 1, bakary: 1, chantal: 2 };
  const contribution = (round, key, fields) => {
    batch.set(db.doc(`tontines/${id}/contributions/${round}_${uids[key]}`), {
      roundIndex: round,
      memberId: uids[key],
      memberName: name(key),
      amount: amount * shares[key],
      penaltyAmount: 0,
      proofPath: null,
      updatedAt: daysAgo(1),
      ...fields,
    });
  };
  const confirmed = (method, reference, by) => ({
    status: 'CONFIRMED',
    method,
    reference,
    declaredAt: daysAgo(60),
    confirmedAt: daysAgo(59),
    confirmedBy: uids[by],
  });
  // Tour 1 : tout le monde a payé.
  contribution(1, 'aminata', confirmed('CASH', '', 'aminata'));
  contribution(1, 'bakary', confirmed('ORANGE_MONEY', 'OM-58123', 'aminata'));
  contribution(1, 'chantal', confirmed('WAVE', 'WV-77421', 'bakary'));
  // Tour 2 : confirmé, déclaré (à confirmer), rejeté puis pénalité de retard.
  contribution(2, 'aminata', confirmed('CASH', '', 'aminata'));
  contribution(2, 'bakary', {
    status: 'DECLARED',
    method: 'MTN_MOMO',
    reference: 'MTN-99812',
    declaredAt: daysAgo(2),
  });
  contribution(2, 'chantal', {
    status: 'REJECTED',
    method: 'WAVE',
    reference: 'WV-00000',
    declaredAt: daysAgo(25),
    rejectedAt: daysAgo(24),
    rejectedBy: uids.aminata,
    rejectionReason: 'Paiement non reçu sur le compte Wave',
    penaltyAmount: 2000,
    penaltyAppliedAt: daysAgo(20),
  });
  // Tour 3 (en cours) : Chantal a déjà déclaré.
  contribution(3, 'chantal', {
    status: 'DECLARED',
    method: 'WAVE',
    reference: 'WV-12345',
    declaredAt: daysAgo(1),
  });

  const events = [
    [
      80,
      'aminata',
      'TONTINE_CREATED',
      { name: tontineName, amount, frequency: 'MONTHLY', totalShares: 4 },
    ],
    [
      75,
      'aminata',
      'MEMBER_ACCEPTED',
      { memberId: uids.bakary, memberName: name('bakary'), shares: 1 },
    ],
    [
      74,
      'aminata',
      'MEMBER_ACCEPTED',
      { memberId: uids.chantal, memberName: name('chantal'), shares: 2 },
    ],
    [
      72,
      'aminata',
      'MEMBER_ROLE_CHANGED',
      { memberId: uids.bakary, memberName: name('bakary'), role: 'CO_ORGANIZER' },
    ],
    [70, 'aminata', 'DRAW_PERFORMED', { order: order.map((s) => s.memberName) }],
    [69, 'aminata', 'TONTINE_STARTED', { firstDueDate: dueDates[0], lastDueDate: dueDates[3] }],
    [60, 'chantal', 'PAYMENT_DECLARED', { roundIndex: 1, amount: 50000, method: 'WAVE' }],
    [
      59,
      'bakary',
      'PAYMENT_CONFIRMED',
      { roundIndex: 1, memberId: uids.chantal, memberName: name('chantal'), amount: 50000 },
    ],
    [
      58,
      'aminata',
      'PAYOUT_SENT',
      {
        roundIndex: 1,
        beneficiaryId: uids.chantal,
        beneficiaryName: name('chantal'),
        amount: 100000,
        method: 'WAVE',
      },
    ],
    [57, 'chantal', 'PAYOUT_RECEIVED', { roundIndex: 1, amount: 100000 }],
    [
      24,
      'aminata',
      'PAYMENT_REJECTED',
      {
        roundIndex: 2,
        memberId: uids.chantal,
        memberName: name('chantal'),
        amount: 50000,
        reason: 'Paiement non reçu sur le compte Wave',
      },
    ],
    [
      20,
      'aminata',
      'PENALTY_APPLIED',
      { roundIndex: 2, memberId: uids.chantal, memberName: name('chantal'), amount: 2000 },
    ],
    [2, 'bakary', 'PAYMENT_DECLARED', { roundIndex: 2, amount: 25000, method: 'MTN_MOMO' }],
    [1, 'chantal', 'PAYMENT_DECLARED', { roundIndex: 3, amount: 50000, method: 'WAVE' }],
  ];
  events.forEach(([ago, key, type, payload], i) => {
    batch.set(db.doc(`tontines/${id}/events/seed-${String(i).padStart(2, '0')}`), {
      type,
      actorId: uids[key],
      actorName: name(key),
      payload,
      createdAt: daysAgo(ago),
    });
  });

  const notify = (key, actor, type, message, ago, tab) =>
    batch.set(db.collection('notifications').doc(), {
      userId: uids[key],
      tontineId: id,
      type,
      message,
      link: `/tontines/${id}?onglet=${tab}`,
      actorId: uids[actor],
      read: false,
      createdAt: daysAgo(ago),
    });
  notify(
    'aminata',
    'bakary',
    'PAYMENT_TO_CONFIRM',
    `${name('bakary')} a déclaré 25 000 FCFA (MTN MoMo) pour le tour n° 2. À confirmer.`,
    2,
    'cotisations',
  );
  notify(
    'aminata',
    'chantal',
    'PAYMENT_TO_CONFIRM',
    `${name('chantal')} a déclaré 50 000 FCFA (Wave) pour le tour n° 3. À confirmer.`,
    1,
    'cotisations',
  );
  notify(
    'chantal',
    'aminata',
    'PAYMENT_REJECTED',
    'Votre paiement du tour n° 2 (Tontine des commerçantes) est rejeté : Paiement non reçu sur le compte Wave',
    24,
    'cotisations',
  );
  notify(
    'chantal',
    'aminata',
    'PENALTY_APPLIED',
    'Pénalité de retard de 2 000 FCFA appliquée pour le tour n° 2 (Tontine des commerçantes).',
    20,
    'cotisations',
  );
  await batch.commit();
}

// --- Tontine 2 : en préparation -----------------------------------------------------------
async function seedDraftTontine(uids) {
  const id = 'demo-bureau';
  const tontineName = 'Tontine du bureau';
  const batch = db.batch();
  batch.set(db.doc(`tontines/${id}`), {
    name: tontineName,
    description: 'Entre collègues, chaque vendredi.',
    amount: 10000,
    frequency: 'WEEKLY',
    startDate: iso(new Date(today.getTime() + 10 * DAY)),
    totalShares: 5,
    graceDays: 1,
    penaltyAmount: 0,
    status: 'DRAFT',
    ownerId: uids.bakary,
    ownerName: name('bakary'),
    inviteCode: 'BURO25',
    memberIds: [uids.bakary, uids.aminata],
    coOrganizerIds: [],
    orderMode: 'MANUAL',
    payoutOrder: [],
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1),
  });
  batch.set(db.doc('invites/BURO25'), {
    tontineId: id,
    tontineName,
    ownerId: uids.bakary,
    ownerName: name('bakary'),
    amount: 10000,
    frequency: 'WEEKLY',
    totalShares: 5,
    createdAt: daysAgo(3),
  });
  batch.set(
    db.doc(`tontines/${id}/members/${uids.bakary}`),
    member(uids.bakary, 'bakary', 'ORGANIZER', 2, 'ACTIVE', tontineName),
  );
  batch.set(
    db.doc(`tontines/${id}/members/${uids.aminata}`),
    member(uids.aminata, 'aminata', 'MEMBER', 1, 'ACTIVE', tontineName),
  );
  batch.set(
    db.doc(`tontines/${id}/members/${uids.chantal}`),
    member(uids.chantal, 'chantal', 'MEMBER', 2, 'PENDING', tontineName),
  );
  batch.set(db.doc(`tontines/${id}/events/seed-00`), {
    type: 'TONTINE_CREATED',
    actorId: uids.bakary,
    actorName: name('bakary'),
    payload: { name: tontineName, amount: 10000, frequency: 'WEEKLY', totalShares: 5 },
    createdAt: daysAgo(3),
  });
  batch.set(db.doc(`tontines/${id}/events/seed-01`), {
    type: 'MEMBER_ACCEPTED',
    actorId: uids.bakary,
    actorName: name('bakary'),
    payload: { memberId: uids.aminata, memberName: name('aminata'), shares: 1 },
    createdAt: daysAgo(2),
  });
  batch.set(db.collection('notifications').doc(), {
    userId: uids.bakary,
    tontineId: id,
    type: 'JOIN_REQUEST',
    message: `${name('chantal')} demande à rejoindre « ${tontineName} » (2 parts).`,
    link: `/tontines/${id}?onglet=membres`,
    actorId: uids.chantal,
    read: false,
    createdAt: daysAgo(1),
  });
  await batch.commit();
}

const uids = await createUsers();
await seedActiveTontine(uids);
await seedDraftTontine(uids);
// Accès au back-office (/admin) pour le compte administrateur de démonstration.
await db.doc(`admins/${uids.admin}`).set({ email: people.admin.email, grantedAt: Timestamp.now() });

console.log('\nDonnées de démonstration créées.');
console.log(`Mot de passe pour tous les comptes : ${PASSWORD}`);
for (const [key, person] of Object.entries(people)) {
  console.log(`  ${person.email.padEnd(20)} ${name(key)}`);
}
console.log(
  '  → Aminata organise « Tontine des commerçantes » (en cours), Bakary « Tontine du bureau » (en préparation).\n' +
    '  → admin@demo.ci a accès au back-office : http://localhost:8081/admin\n',
);

// Parcours complet, de l'inscription à la clôture, avec les vrais services de l'application,
// contre les émulateurs (Auth + Firestore) et les vraies règles de sécurité.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebase';
import { login, logout, register } from '../../src/features/auth/services/authService';
import {
  closeTontine,
  createTontine,
  performDraw,
  startTontine,
} from '../../src/features/tontines/services/tontineService';
import {
  acceptMember,
  findInvite,
  requestToJoin,
  setCoOrganizer,
} from '../../src/features/members/services/memberService';
import {
  applyPenalty,
  confirmPayment,
  declarePayment,
  recordPayment,
  rejectPayment,
} from '../../src/features/contributions/services/contributionService';
import {
  confirmPayoutReceived,
  markPayoutSent,
} from '../../src/features/rounds/services/roundService';
import { fetchEventsPage } from '../../src/features/tontines/services/eventService';

const PROJECT = 'demo-tontine-rules';
const PASSWORD = 'motdepasse123';

const people = {
  owner: {
    firstName: 'Olivier',
    lastName: 'Kouadio',
    phone: '0707070707',
    email: 'olivier@test.ci',
  },
  awa: { firstName: 'Awa', lastName: 'Koné', phone: '0505050505', email: 'awa@test.ci' },
  koffi: { firstName: 'Koffi', lastName: 'Yao', phone: '0101010101', email: 'koffi@test.ci' },
};
const uids = {};
const actorOf = (key) => ({
  uid: uids[key],
  name: `${people[key].firstName} ${people[key].lastName}`,
});
const profileOf = (key) => ({ phone: `+225${people[key].phone}` });

async function signInAs(key) {
  await logout();
  await login({ email: people[key].email, password: PASSWORD });
}

const read = async (path) => {
  const snapshot = await getDoc(doc(db, path));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
};
const readAll = async (path) =>
  (await getDocs(collection(db, path))).docs.map((d) => ({ id: d.id, ...d.data() }));

let tontineId;
let tontine;
let members;

async function refresh() {
  tontine = await read(`tontines/${tontineId}`);
  members = await readAll(`tontines/${tontineId}/members`);
}

beforeAll(async () => {
  await fetch(
    `http://127.0.0.1:8180/emulator/v1/projects/${PROJECT}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  await fetch(`http://127.0.0.1:9399/emulator/v1/projects/${PROJECT}/accounts`, {
    method: 'DELETE',
  });
  for (const [key, person] of Object.entries(people)) {
    const user = await register({ ...person, password: PASSWORD });
    uids[key] = user.uid;
  }
});

afterAll(async () => {
  await logout();
});

describe('parcours complet d’une tontine', () => {
  it('l’inscription crée le profil', async () => {
    expect(auth.currentUser.uid).toBe(uids.koffi);
    const profile = await read(`users/${uids.koffi}`);
    expect(profile).toMatchObject({ firstName: 'Koffi', phone: '+2250101010101' });
  });

  it('l’organisateur crée la tontine avec son code d’invitation', async () => {
    await signInAs('owner');
    tontineId = await createTontine(actorOf('owner'), profileOf('owner'), {
      name: 'Tontine du quartier',
      description: 'Test',
      amount: 10000,
      frequency: 'MONTHLY',
      startDate: '2026-09-01',
      totalShares: 4,
      ownerShares: 1,
      graceDays: 3,
      penaltyAmount: 500,
      orderMode: 'DRAW',
    });
    await refresh();
    expect(tontine).toMatchObject({ status: 'DRAFT', memberIds: [uids.owner] });
    expect(tontine.inviteCode).toMatch(/^[A-Z2-9]{6}$/);
  });

  it('deux personnes demandent à rejoindre avec le code', async () => {
    for (const [key, shares] of [
      ['awa', 2],
      ['koffi', 1],
    ]) {
      await signInAs(key);
      const invite = await findInvite(tontine.inviteCode);
      expect(invite.tontineName).toBe('Tontine du quartier');
      await requestToJoin(actorOf(key), profileOf(key), invite, shares);
    }
    await expect(findInvite('ZZZZZZ')).rejects.toThrow('Aucune tontine');
  });

  it('un demandeur ne peut pas lire la tontine avant d’être accepté', async () => {
    await expect(getDoc(doc(db, `tontines/${tontineId}`))).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });

  it('l’organisateur accepte, tire au sort et démarre', async () => {
    await signInAs('owner');
    const requests = await getDocs(
      query(collection(db, 'notifications'), where('userId', '==', uids.owner)),
    );
    expect(requests.docs.map((d) => d.data().type)).toEqual(['JOIN_REQUEST', 'JOIN_REQUEST']);

    await refresh();
    for (const key of ['awa', 'koffi']) {
      await acceptMember(
        actorOf('owner'),
        tontine,
        members,
        members.find((m) => m.userId === uids[key]),
      );
      await refresh();
    }
    expect(tontine.memberIds).toHaveLength(3);

    const order = await performDraw(actorOf('owner'), tontineId, members);
    expect(order).toHaveLength(4);
    await expect(performDraw(actorOf('owner'), tontineId, members)).rejects.toThrow('déjà eu lieu');

    await refresh();
    await setCoOrganizer(
      actorOf('owner'),
      tontine,
      members.find((m) => m.userId === uids.awa),
      true,
    );
    await refresh();
    await startTontine(actorOf('owner'), tontine, members);
    await refresh();
    expect(tontine.status).toBe('ACTIVE');
    const rounds = await readAll(`tontines/${tontineId}/rounds`);
    expect(rounds.map((r) => r.dueDate).sort()).toEqual([
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
      '2026-12-01',
    ]);
    expect(rounds.every((r) => r.potAmount === 40000)).toBe(true);
  });

  it('cycle de paiement : déclarer, confirmer, rejeter, redéclarer, enregistrer, pénalité', async () => {
    const round = (index) => ({ index });
    const me = (key) => members.find((m) => m.userId === uids[key]);

    await signInAs('awa');
    await declarePayment(actorOf('awa'), {
      tontine,
      member: me('awa'),
      round: round(1),
      existing: null,
      method: 'WAVE',
      reference: 'WAVE-123',
      proofFile: null,
    });
    const declared = await read(`tontines/${tontineId}/contributions/1_${uids.awa}`);
    expect(declared).toMatchObject({ status: 'DECLARED', amount: 20000 });

    await signInAs('koffi');
    await declarePayment(actorOf('koffi'), {
      tontine,
      member: me('koffi'),
      round: round(1),
      existing: null,
      method: 'ORANGE_MONEY',
      reference: 'OM-1',
      proofFile: null,
    });
    // Un membre ne peut pas confirmer son propre paiement.
    await expect(
      confirmPayment(
        actorOf('koffi'),
        tontine,
        await read(`tontines/${tontineId}/contributions/1_${uids.koffi}`),
      ),
    ).rejects.toMatchObject({ code: 'permission-denied' });

    await signInAs('owner');
    await confirmPayment(actorOf('owner'), tontine, declared);
    await expect(confirmPayment(actorOf('owner'), tontine, declared)).rejects.toThrow(
      'déjà été traité',
    );
    const koffiContribution = await read(`tontines/${tontineId}/contributions/1_${uids.koffi}`);
    await rejectPayment(actorOf('owner'), tontine, koffiContribution, 'Référence introuvable');

    await signInAs('koffi');
    const rejected = await read(`tontines/${tontineId}/contributions/1_${uids.koffi}`);
    expect(rejected).toMatchObject({
      status: 'REJECTED',
      rejectionReason: 'Référence introuvable',
    });
    await declarePayment(actorOf('koffi'), {
      tontine,
      member: me('koffi'),
      round: round(1),
      existing: rejected,
      method: 'ORANGE_MONEY',
      reference: 'OM-2',
      proofFile: null,
    });

    // Awa est co-organisatrice : elle confirme le paiement de Koffi.
    await signInAs('awa');
    await confirmPayment(
      actorOf('awa'),
      tontine,
      await read(`tontines/${tontineId}/contributions/1_${uids.koffi}`),
    );

    await signInAs('owner');
    await recordPayment(actorOf('owner'), {
      tontine,
      member: me('owner'),
      round: round(1),
      existing: null,
      method: 'CASH',
      reference: '',
    });
    await applyPenalty(actorOf('owner'), {
      tontine,
      member: me('koffi'),
      round: round(2),
      existing: null,
    });
    const penalty = await read(`tontines/${tontineId}/contributions/2_${uids.koffi}`);
    expect(penalty).toMatchObject({ status: 'LATE', penaltyAmount: 500 });
    // Pas deux fois.
    await expect(
      applyPenalty(actorOf('owner'), {
        tontine,
        member: me('koffi'),
        round: round(2),
        existing: penalty,
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('le pot est versé puis confirmé par le bénéficiaire', async () => {
    await signInAs('owner');
    const round1 = await read(`tontines/${tontineId}/rounds/1`);
    await markPayoutSent(actorOf('owner'), tontine, round1, { method: 'WAVE', reference: 'POT-1' });
    const beneficiary = Object.keys(uids).find((key) => uids[key] === round1.beneficiaryId);
    await signInAs(beneficiary);
    await confirmPayoutReceived(
      actorOf(beneficiary),
      tontine,
      await read(`tontines/${tontineId}/rounds/1`),
    );
    expect(await read(`tontines/${tontineId}/rounds/1`)).toMatchObject({
      payoutStatus: 'RECEIVED',
    });
  });

  it('le journal a tout enregistré et les notifications sont arrivées', async () => {
    await signInAs('awa');
    const page = await fetchEventsPage(tontineId);
    const types = page.events.map((event) => event.type);
    for (const type of [
      'TONTINE_CREATED',
      'MEMBER_ACCEPTED',
      'DRAW_PERFORMED',
      'TONTINE_STARTED',
      'PAYMENT_DECLARED',
      'PAYMENT_CONFIRMED',
      'PAYMENT_REJECTED',
      'PAYMENT_RECORDED',
      'PENALTY_APPLIED',
      'PAYOUT_SENT',
      'PAYOUT_RECEIVED',
    ]) {
      expect(types).toContain(type);
    }
    const notifications = await getDocs(
      query(collection(db, 'notifications'), where('userId', '==', uids.awa)),
    );
    const received = notifications.docs.map((d) => d.data().type);
    expect(received).toEqual(
      expect.arrayContaining(['JOIN_ACCEPTED', 'TONTINE_STARTED', 'PAYMENT_CONFIRMED']),
    );
  });

  it('l’organisateur peut annuler la tontine ; plus personne ne peut déclarer ensuite', async () => {
    await signInAs('owner');
    await refresh();
    await closeTontine(actorOf('owner'), tontine, 'CANCELLED', 'Test terminé');
    await refresh();
    expect(tontine.status).toBe('CANCELLED');
    await signInAs('awa');
    await expect(
      declarePayment(actorOf('awa'), {
        tontine,
        member: members.find((m) => m.userId === uids.awa),
        round: { index: 3 },
        existing: null,
        method: 'WAVE',
        reference: 'X',
        proofFile: null,
      }),
    ).rejects.toMatchObject({ code: 'permission-denied' });
  });
});

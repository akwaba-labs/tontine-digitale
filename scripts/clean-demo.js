// Supprime les données de démonstration des émulateurs (comptes @demo.ci et leurs tontines),
// sans toucher aux autres comptes ni à leurs tontines.
//
//   npm run clean:demo
//
// Refuse de tourner sur un vrai projet.
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'demo-tontine-digitale';
if (!PROJECT_ID.startsWith('demo-')) {
  console.error('Refus : ce script ne fonctionne qu’avec les émulateurs (projet demo-…).');
  process.exit(1);
}
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.METADATA_SERVER_DETECTION ??= 'none';

initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();
const db = getFirestore();

const isDemoEmail = (email) => /@demo\.ci$/i.test(email ?? '');

const demoUsers = (await auth.listUsers()).users.filter((u) => isDemoEmail(u.email));
const demoUids = new Set(demoUsers.map((u) => u.uid));

// Tontines organisées par un compte de démonstration (avec toutes leurs sous-collections).
const tontines = await db.collection('tontines').get();
const demoTontines = tontines.docs.filter((t) => demoUids.has(t.get('ownerId')));
const demoTontineIds = new Set(demoTontines.map((t) => t.id));
for (const tontine of demoTontines) {
  await db.recursiveDelete(tontine.ref);
  console.log(`Tontine supprimée : ${tontine.get('name')}`);
}

// Un compte de démo membre d'une vraie tontine : on le signale sans y toucher.
for (const tontine of tontines.docs) {
  if (demoTontineIds.has(tontine.id)) continue;
  const intruders = (tontine.get('memberIds') ?? []).filter((id) => demoUids.has(id));
  if (intruders.length > 0) {
    console.warn(
      `Attention : « ${tontine.get('name')} » contient un compte de démo, laissé tel quel.`,
    );
  }
}

const deleteWhere = async (collection, predicate) => {
  const snapshot = await db.collection(collection).get();
  const docs = snapshot.docs.filter(predicate);
  for (let i = 0; i < docs.length; i += 400) {
    const batch = db.batch();
    docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
  return docs.length;
};

const invites = await deleteWhere('invites', (d) => demoTontineIds.has(d.get('tontineId')));
const notifications = await deleteWhere(
  'notifications',
  (d) => demoUids.has(d.get('userId')) || demoTontineIds.has(d.get('tontineId')),
);
const mails = await deleteWhere(
  'mailLog',
  (d) =>
    isDemoEmail(d.get('to')) ||
    (d.get('tontineIds') ?? [d.get('tontineId')]).some((id) => demoTontineIds.has(id)),
);
const admins = await deleteWhere('admins', (d) => demoUids.has(d.id));
const profiles = await deleteWhere('users', (d) => demoUids.has(d.id));
if (demoUsers.length > 0) await auth.deleteUsers([...demoUids]);

console.log(
  `\nDonnées de démonstration supprimées : ${demoUsers.length} compte(s), ${demoTontines.length} tontine(s), ` +
    `${invites} invitation(s), ${notifications} notification(s), ${mails} e-mail(s), ${admins} accès admin, ${profiles} profil(s).`,
);

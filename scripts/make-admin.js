// Donne (ou retire) l'accès au back-office à un utilisateur existant.
//
//   npm run make-admin -- aminata@demo.ci            → administrateur
//   npm run make-admin -- aminata@demo.ci --retirer  → retire l'accès
//
// Par défaut : émulateurs (projet demo-…). Pour un vrai projet :
//   GCLOUD_PROJECT=<id> GOOGLE_APPLICATION_CREDENTIALS=<clé de compte de service> npm run make-admin -- …
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error('Usage : npm run make-admin -- <e-mail> [--retirer]');
  process.exit(1);
}

const projectId = process.env.GCLOUD_PROJECT || 'demo-tontine-digitale';
if (projectId.startsWith('demo-')) {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
  process.env.METADATA_SERVER_DETECTION ??= 'none';
}

initializeApp({ projectId });
const user = await getAuth()
  .getUserByEmail(email)
  .catch(() => null);
if (!user) {
  console.error(`Aucun compte avec l’e-mail ${email}. La personne doit d’abord s’inscrire.`);
  process.exit(1);
}

const ref = getFirestore().doc(`admins/${user.uid}`);
if (flag === '--retirer') {
  await ref.delete();
  console.log(`${email} n’a plus accès au back-office.`);
} else {
  await ref.set({ email, grantedAt: FieldValue.serverTimestamp() });
  console.log(`${email} a maintenant accès au back-office (/admin).`);
}

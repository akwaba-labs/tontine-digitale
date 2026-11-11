// « npm run digest » : envoie tout de suite le résumé des dernières 24 h, contre les émulateurs.
// Les fonctions planifiées ne se déclenchent pas seules dans les émulateurs : ce script permet
// de voir le résultat (collection mailLog, http://127.0.0.1:4000). Jamais sur un vrai projet.
import { initializeApp } from 'firebase-admin/app';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { runDigest } from './digest.js';

const projectId = process.env.GCLOUD_PROJECT || 'demo-tontine-digitale';
if (!projectId.startsWith('demo-')) {
  console.error('Refus : ce script ne fonctionne qu’avec un projet de démonstration (demo-…).');
  process.exit(1);
}
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
process.env.METADATA_SERVER_DETECTION ??= 'none';

initializeApp({ projectId });
const until = new Date();
const stats = await runDigest({
  db: getFirestore(),
  since: Timestamp.fromDate(new Date(until.getTime() - 24 * 60 * 60 * 1000)),
  until: Timestamp.fromDate(until),
  runKey: until.toISOString().replace(/[:.]/g, '-'),
  appUrl: 'http://localhost:8081',
  deliver: null,
});
console.log('Résumé simulé :', stats);
console.log('Contenu des e-mails : http://127.0.0.1:4000/firestore → collection mailLog');

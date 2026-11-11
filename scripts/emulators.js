// Lance les émulateurs Firebase en gardant les données d'une fois sur l'autre :
// elles sont rechargées depuis emulator-data/ (si une sauvegarde existe) et sauvegardées à l'arrêt.
//
//   node scripts/emulators.js                       → émulateurs seuls (npm run emulators)
//   node scripts/emulators.js "vite --mode emulators" → émulateurs + commande (npm start)
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const DATA_DIR = './emulator-data';
const command = process.argv[2];
const hasBackup = existsSync(`${DATA_DIR}/firebase-export-metadata.json`);

const args = [
  command ? 'emulators:exec' : 'emulators:start',
  '--project',
  'demo-tontine-digitale',
  ...(hasBackup ? ['--import', DATA_DIR] : []),
  '--export-on-exit',
  DATA_DIR,
  ...(command ? ['--ui', command] : []),
];

console.log(
  hasBackup
    ? `Données rechargées depuis ${DATA_DIR}/ ; elles y seront sauvegardées à l’arrêt (Ctrl+C).`
    : `Première utilisation : les données seront sauvegardées dans ${DATA_DIR}/ à l’arrêt (Ctrl+C).`,
);

const child = spawn('firebase', args, { stdio: 'inherit' });
// Ctrl+C est reçu aussi par Firebase, qui sauvegarde puis s'arrête : on attend sa fin.
process.on('SIGINT', () => {});
process.on('SIGTERM', () => child.kill('SIGTERM'));
child.on('exit', (code) => process.exit(code ?? 0));

import { defineConfig } from 'rolldown';

// Assemble les fonctions en un seul fichier : le code partagé avec l'application (src/…)
// est inclus, les paquets npm restent des dépendances (installées par Firebase au déploiement).
export default defineConfig({
  input: 'functions/src/index.js',
  platform: 'node',
  external: [/^firebase-functions/, /^firebase-admin/, 'nodemailer'],
  output: { file: 'functions/lib/index.js', format: 'esm' },
});

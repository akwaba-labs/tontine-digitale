import { defineConfig } from 'rolldown';

// Assemble les fonctions : le code partagé avec l'application (src/…) est inclus,
// les paquets npm restent des dépendances (installées par Firebase au déploiement).
export default defineConfig({
  input: {
    index: 'functions/src/index.js',
    'run-digest': 'functions/src/runDigestLocal.js',
  },
  platform: 'node',
  external: [/^firebase-functions/, /^firebase-admin/, 'nodemailer'],
  output: { dir: 'functions/lib', format: 'esm', entryFileNames: '[name].js' },
});

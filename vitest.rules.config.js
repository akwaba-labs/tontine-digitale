import { defineConfig } from 'vitest/config';

// Tests avec les émulateurs (npm run test:rules) : règles de sécurité et parcours complet.
// Ports distincts de firebase.json (voir firebase.rules-test.json) pour tourner pendant « npm start ».
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      VITE_USE_EMULATORS: 'true',
      VITE_FIREBASE_PROJECT_ID: 'demo-tontine-rules',
      VITE_AUTH_EMULATOR_PORT: '9399',
      VITE_FIRESTORE_EMULATOR_PORT: '8180',
      VITE_STORAGE_EMULATOR_PORT: '9299',
    },
  },
});

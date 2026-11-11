import { defineConfig } from 'vitest/config';

// Tests des règles de sécurité : à lancer avec les émulateurs (npm run test:rules).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/rules/**/*.test.js'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});

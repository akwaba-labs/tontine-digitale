import { describe, expect, it } from 'vitest';
import { DEMO_PROJECT_ID, readFirebaseConfig } from './firebaseConfig';

const fullEnv = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'mon-projet.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'mon-projet',
  VITE_FIREBASE_STORAGE_BUCKET: 'mon-projet.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '123',
  VITE_FIREBASE_APP_ID: '1:123:web:abc',
};

describe('readFirebaseConfig', () => {
  it('lit une configuration complète', () => {
    const result = readFirebaseConfig(fullEnv);
    expect(result.useEmulators).toBe(false);
    expect(result.firebaseConfig).toEqual({
      apiKey: 'key',
      authDomain: 'mon-projet.firebaseapp.com',
      projectId: 'mon-projet',
      storageBucket: 'mon-projet.appspot.com',
      messagingSenderId: '123',
      appId: '1:123:web:abc',
    });
  });

  it('refuse une configuration incomplète sans émulateurs, en listant les variables manquantes', () => {
    expect(() => readFirebaseConfig({ VITE_FIREBASE_API_KEY: 'key' })).toThrow(
      /VITE_FIREBASE_PROJECT_ID/,
    );
  });

  it('utilise un projet de démonstration avec les émulateurs', () => {
    const result = readFirebaseConfig({ VITE_USE_EMULATORS: 'true' });
    expect(result.useEmulators).toBe(true);
    expect(result.emulatorHost).toBe('127.0.0.1');
    expect(result.firebaseConfig.projectId).toBe(DEMO_PROJECT_ID);
    expect(result.firebaseConfig.storageBucket).toBe(`${DEMO_PROJECT_ID}.appspot.com`);
  });

  it('garde les valeurs fournies avec les émulateurs', () => {
    const result = readFirebaseConfig({
      VITE_USE_EMULATORS: 'true',
      VITE_EMULATOR_HOST: 'localhost',
      VITE_FIREBASE_PROJECT_ID: 'demo-autre',
    });
    expect(result.emulatorHost).toBe('localhost');
    expect(result.firebaseConfig.projectId).toBe('demo-autre');
    expect(result.firebaseConfig.authDomain).toBe('demo-autre.firebaseapp.com');
  });
});

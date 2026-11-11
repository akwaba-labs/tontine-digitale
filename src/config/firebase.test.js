import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

describe('initialisation Firebase en mode émulateurs', () => {
  beforeAll(() => {
    vi.stubEnv('VITE_USE_EMULATORS', 'true');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('crée Auth, Firestore et Storage sur le projet de démonstration', async () => {
    const { firebaseApp, auth, db, storage, isUsingEmulators } = await import('./firebase');
    expect(isUsingEmulators).toBe(true);
    expect(firebaseApp.options.projectId).toBe('demo-tontine-digitale');
    expect(auth.languageCode).toBe('fr');
    expect(auth.emulatorConfig).toMatchObject({ host: '127.0.0.1', port: 9099 });
    expect(db).toBeDefined();
    expect(storage).toBeDefined();
  });
});

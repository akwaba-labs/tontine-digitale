export const DEMO_PROJECT_ID = 'demo-tontine-digitale';
export const DEFAULT_EMULATOR_HOST = '127.0.0.1';

export const EMULATOR_PORTS = Object.freeze({
  auth: 9099,
  firestore: 8080,
  storage: 9199,
});

const REQUIRED_KEYS = Object.freeze({
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
});

function readValue(env, name) {
  const value = env[name];
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Lit la configuration Firebase à partir des variables d'environnement Vite.
 * Fonction pure : elle reçoit l'objet `env` pour pouvoir être testée.
 *
 * - Avec les émulateurs (VITE_USE_EMULATORS=true), des valeurs fictives sont utilisées
 *   pour les clés manquantes : aucun projet Firebase réel n'est nécessaire.
 * - Sans émulateurs, toutes les clés sont obligatoires.
 */
export function readFirebaseConfig(env) {
  const useEmulators = readValue(env, 'VITE_USE_EMULATORS') === 'true';
  const emulatorHost = readValue(env, 'VITE_EMULATOR_HOST') || DEFAULT_EMULATOR_HOST;

  const firebaseConfig = {};
  const missing = [];

  for (const [key, envName] of Object.entries(REQUIRED_KEYS)) {
    const value = readValue(env, envName);
    if (value) {
      firebaseConfig[key] = value;
    } else {
      missing.push(envName);
    }
  }

  if (useEmulators) {
    const projectId = firebaseConfig.projectId || DEMO_PROJECT_ID;
    return {
      useEmulators,
      emulatorHost,
      firebaseConfig: {
        apiKey: 'demo-api-key',
        authDomain: `${projectId}.firebaseapp.com`,
        storageBucket: `${projectId}.appspot.com`,
        messagingSenderId: '000000000000',
        appId: '1:000000000000:web:0000000000000000',
        ...firebaseConfig,
        projectId,
      },
    };
  }

  if (missing.length > 0) {
    throw new Error(
      `Configuration Firebase incomplète. Variables manquantes dans .env : ${missing.join(', ')}. ` +
        'Copiez .env.example en .env, ou lancez « npm run dev:emulators » pour travailler en local.',
    );
  }

  return { useEmulators, emulatorHost, firebaseConfig };
}

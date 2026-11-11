import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { readFirebaseConfig } from './firebaseConfig';

const env = import.meta.env;
const { firebaseConfig, useEmulators, emulatorHost, emulatorPorts } = readFirebaseConfig(env);

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const isUsingEmulators = useEmulators;

// App Check : protège la base contre les appels qui ne viennent pas de l'application.
// Activé en production quand la clé reCAPTCHA Enterprise est fournie (voir README).
const appCheckSiteKey = env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
if (!useEmulators && appCheckSiteKey && typeof window !== 'undefined') {
  // En développement : jeton de débogage fourni, ou `true` pour en générer un (affiché dans la
  // console du navigateur, à enregistrer dans la console Firebase).
  if (env.DEV || env.VITE_APPCHECK_DEBUG_TOKEN) {
    globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN = env.VITE_APPCHECK_DEBUG_TOKEN || true;
  }
  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

// Clé de session : le cache local s'est bloqué, on s'en passe jusqu'à la fermeture de l'onglet.
export const NO_PERSISTENCE_KEY = 'firestore-no-persistence';

function persistenceDisabledForSession() {
  try {
    return sessionStorage.getItem(NO_PERSISTENCE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Cache local persistant (IndexedDB) dans le navigateur : les données déjà vues restent
 * consultables hors ligne et s'affichent instantanément sur les connexions lentes.
 */
function createFirestore() {
  const canPersist =
    typeof window !== 'undefined' &&
    'indexedDB' in window &&
    env.MODE !== 'test' &&
    !persistenceDisabledForSession();
  if (!canPersist) return getFirestore(firebaseApp);
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    // Déjà initialisé (rechargement à chaud) : on réutilise l'instance existante.
    return getFirestore(firebaseApp);
  }
}

export const auth = getAuth(firebaseApp);
export const db = createFirestore();
export const storage = getStorage(firebaseApp);

auth.languageCode = 'fr';

// Évite de reconnecter les émulateurs lors d'un rechargement à chaud (HMR).
const EMULATOR_FLAG = '__tontineEmulatorsConnected';

if (useEmulators && !globalThis[EMULATOR_FLAG]) {
  connectAuthEmulator(auth, `http://${emulatorHost}:${emulatorPorts.auth}`, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(db, emulatorHost, emulatorPorts.firestore);
  connectStorageEmulator(storage, emulatorHost, emulatorPorts.storage);
  globalThis[EMULATOR_FLAG] = true;
}

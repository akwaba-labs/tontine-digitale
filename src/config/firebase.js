import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { readFirebaseConfig } from './firebaseConfig';

const { firebaseConfig, useEmulators, emulatorHost, emulatorPorts } = readFirebaseConfig(
  import.meta.env,
);

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const isUsingEmulators = useEmulators;

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

import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { createUserProfile, deleteUserProfile } from './userService';

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function register({ firstName, lastName, phone, email, password }) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const { user } = credential;
  await createUserProfile(user.uid, { firstName, lastName, phone, email: user.email });
  await updateProfile(user, { displayName: `${firstName} ${lastName}`.trim() });
  return user;
}

export function login({ email, password }) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export function logout() {
  return signOut(auth);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email.trim());
}

async function reauthenticate(password) {
  const user = auth.currentUser;
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
  return user;
}

export async function changePassword({ currentPassword, newPassword }) {
  const user = await reauthenticate(currentPassword);
  await updatePassword(user, newPassword);
}

/**
 * Supprime le compte et le profil personnel.
 * L'historique des tontines (cotisations, journal) est conservé pour les autres membres,
 * comme pour un cahier de tontine : seul le profil privé est effacé.
 */
export async function deleteAccount(password) {
  const user = await reauthenticate(password);
  await deleteUserProfile(user.uid);
  await deleteUser(user);
}

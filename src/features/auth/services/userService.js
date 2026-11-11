import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../config/firebase';
import { normalizePhone } from '../../../shared/utils/formatPhone';
import { compressImage } from '../../../shared/utils/compressImage';
import { fromSnapshot } from '../../../shared/services/firestoreUtils';

const userRef = (uid) => doc(db, 'users', uid);

export function createUserProfile(uid, { firstName, lastName, phone, email }) {
  return setDoc(userRef(uid), {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: normalizePhone(phone),
    email,
    photoURL: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateUserProfile(uid, { firstName, lastName, phone }) {
  return updateDoc(userRef(uid), {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: normalizePhone(phone),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeUserProfile(uid, onData, onError) {
  return onSnapshot(
    userRef(uid),
    { includeMetadataChanges: true },
    (snapshot) => {
      // Hors ligne ou connexion lente : « absent du cache » ne veut pas dire « inexistant ».
      // On attend la réponse du serveur avant de conclure qu'il faut compléter le profil.
      if (!snapshot.exists() && snapshot.metadata.fromCache) return;
      onData(fromSnapshot(snapshot));
    },
    onError,
  );
}

export async function uploadAvatar(uid, file) {
  const blob = await compressImage(file, 512);
  const avatarRef = ref(storage, `avatars/${uid}/photo.jpg`);
  await uploadBytes(avatarRef, blob, { contentType: 'image/jpeg' });
  const photoURL = await getDownloadURL(avatarRef);
  await updateDoc(userRef(uid), { photoURL, updatedAt: serverTimestamp() });
  return photoURL;
}

export async function removeAvatar(uid) {
  try {
    await deleteObject(ref(storage, `avatars/${uid}/photo.jpg`));
  } catch (error) {
    if (error.code !== 'storage/object-not-found') throw error;
  }
  await updateDoc(userRef(uid), { photoURL: null, updatedAt: serverTimestamp() });
}

export async function deleteUserProfile(uid) {
  try {
    await deleteObject(ref(storage, `avatars/${uid}/photo.jpg`));
  } catch (error) {
    if (error.code !== 'storage/object-not-found') throw error;
  }
  await deleteDoc(userRef(uid));
}

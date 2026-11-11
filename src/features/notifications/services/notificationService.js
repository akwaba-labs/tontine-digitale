import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { fromSnapshot } from '../../../shared/services/firestoreUtils';
import { isGuestId } from '../../../shared/constants/domain';

const notificationsCollection = collection(db, 'notifications');

/**
 * Ajoute une notification dans un lot d'écritures existant.
 * L'auteur ne se notifie jamais lui-même ; un membre sans compte ne peut pas les lire.
 */
export function addNotification(writer, actor, { userId, tontineId, type, message, link = '' }) {
  if (!userId || userId === actor.uid || isGuestId(userId)) return;
  writer.set(doc(notificationsCollection), {
    userId,
    tontineId,
    type,
    message: message.slice(0, 300),
    link,
    actorId: actor.uid,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export function addNotifications(writer, actor, userIds, notification) {
  for (const userId of new Set(userIds)) {
    addNotification(writer, actor, { ...notification, userId });
  }
}

export const NOTIFICATIONS_LIMIT = 50;

export function subscribeMyNotifications(uid, onData, onError) {
  const q = query(
    notificationsCollection,
    where('userId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(NOTIFICATIONS_LIMIT),
  );
  return onSnapshot(q, (snapshot) => onData(snapshot.docs.map(fromSnapshot)), onError);
}

export function markAsRead(notificationId) {
  return updateDoc(doc(notificationsCollection, notificationId), {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markAllAsRead(notifications) {
  const unread = notifications.filter((notification) => !notification.read);
  for (let i = 0; i < unread.length; i += 400) {
    const batch = writeBatch(db);
    for (const notification of unread.slice(i, i + 400)) {
      batch.update(doc(notificationsCollection, notification.id), {
        read: true,
        readAt: serverTimestamp(),
      });
    }
    await batch.commit();
  }
}

export function deleteNotification(notificationId) {
  return deleteDoc(doc(notificationsCollection, notificationId));
}

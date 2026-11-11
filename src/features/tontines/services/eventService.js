import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { fromSnapshot } from '../../../shared/services/firestoreUtils';

const eventsCollection = (tontineId) => collection(db, 'tontines', tontineId, 'events');

/**
 * Ajoute une entrée au journal dans le même lot (batch ou transaction) que l'action décrite.
 * Le journal est en ajout uniquement : les règles interdisent de le modifier.
 */
export function addEvent(writer, tontineId, actor, type, payload = {}) {
  writer.set(doc(eventsCollection(tontineId)), {
    type,
    actorId: actor.uid,
    actorName: actor.name,
    payload,
    createdAt: serverTimestamp(),
  });
}

export const EVENTS_PAGE_SIZE = 20;

/** Page d'historique (du plus récent au plus ancien). `cursor` = dernier document reçu. */
export async function fetchEventsPage(tontineId, cursor = null) {
  const constraints = [orderBy('createdAt', 'desc'), limit(EVENTS_PAGE_SIZE)];
  if (cursor) constraints.splice(1, 0, startAfter(cursor));
  const snapshot = await getDocs(query(eventsCollection(tontineId), ...constraints));
  return {
    events: snapshot.docs.map(fromSnapshot),
    cursor: snapshot.docs[snapshot.docs.length - 1] ?? null,
    hasMore: snapshot.docs.length === EVENTS_PAGE_SIZE,
  };
}

/** Tous les événements (export PDF/CSV). */
export async function fetchAllEvents(tontineId) {
  const snapshot = await getDocs(query(eventsCollection(tontineId), orderBy('createdAt', 'asc')));
  return snapshot.docs.map(fromSnapshot);
}

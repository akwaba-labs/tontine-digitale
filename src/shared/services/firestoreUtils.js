// Outils communs aux services Firestore.

/** Convertit un document en objet { id, ...données } (horodatages en attente estimés). */
export function fromSnapshot(snapshot) {
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data({ serverTimestamps: 'estimate' }) };
}

export function fromQuerySnapshot(querySnapshot) {
  return querySnapshot.docs.map((snapshot) => fromSnapshot(snapshot));
}

/** Auteur d'une action, tel qu'enregistré dans le journal et les notifications. */
export function makeActor(user, displayName) {
  return { uid: user.uid, name: displayName };
}

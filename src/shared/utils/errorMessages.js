// Traduction des erreurs Firebase en messages compréhensibles.
const MESSAGES = {
  // Authentification
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/user-not-found': 'Aucun compte ne correspond à cet e-mail.',
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail. Connectez-vous.',
  'auth/weak-password': 'Mot de passe trop faible : 8 caractères minimum.',
  'auth/too-many-requests': 'Trop de tentatives. Patientez quelques minutes puis réessayez.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/requires-recent-login': 'Par sécurité, confirmez votre mot de passe puis réessayez.',
  'auth/network-request-failed': 'Pas de connexion internet. Vérifiez votre réseau et réessayez.',
  'auth/missing-password': 'Saisissez votre mot de passe.',
  // Firestore / Storage
  'permission-denied': 'Vous n’avez pas le droit de faire cette action.',
  'storage/unauthorized': 'Vous n’avez pas le droit d’envoyer ce fichier.',
  'storage/canceled': 'Envoi du fichier annulé.',
  'storage/retry-limit-exceeded': 'L’envoi du fichier a échoué. Vérifiez votre connexion.',
  unavailable: 'Service momentanément indisponible. Vérifiez votre connexion et réessayez.',
  'deadline-exceeded': 'La connexion est trop lente. Réessayez dans un instant.',
  'not-found': 'Élément introuvable. Il a peut-être été supprimé.',
  'already-exists': 'Cet élément existe déjà.',
  'failed-precondition': 'Action impossible dans l’état actuel. Rechargez la page.',
  aborted: 'Une autre modification est en cours. Réessayez.',
};

const DEFAULT_MESSAGE = 'Une erreur est survenue. Réessayez.';

/** Erreur métier avec un message déjà rédigé en français pour l'utilisateur. */
export class AppError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppError';
  }
}

export function getErrorMessage(error) {
  if (!error) return DEFAULT_MESSAGE;
  if (error instanceof AppError) return error.message;
  const code = typeof error.code === 'string' ? error.code.replace(/^firestore\//, '') : '';
  return MESSAGES[code] ?? DEFAULT_MESSAGE;
}

// Chemins des pages (URL en français, identifiants en anglais).
export const ROUTES = Object.freeze({
  home: '/',
  login: '/connexion',
  register: '/inscription',
  forgotPassword: '/mot-de-passe-oublie',
  join: '/rejoindre',
  joinWithCode: '/rejoindre/:inviteCode',
  dashboard: '/tableau-de-bord',
  organizer: '/organisateur',
  admin: '/admin',
  adminUsers: '/admin/utilisateurs',
  adminTontines: '/admin/tontines',
  adminTontineDetail: '/admin/tontines/:tontineId',
  adminMails: '/admin/e-mails',
  tontines: '/tontines',
  createTontine: '/tontines/nouvelle',
  tontineDetail: '/tontines/:tontineId',
  editTontine: '/tontines/:tontineId/modifier',
  declarePayment: '/tontines/:tontineId/declarer',
  notifications: '/notifications',
  profile: '/profil',
  settings: '/parametres',
});

export function tontineDetailPath(tontineId) {
  return `/tontines/${encodeURIComponent(tontineId)}`;
}

export function declarePaymentPath(tontineId, roundIndex) {
  const base = `${tontineDetailPath(tontineId)}/declarer`;
  return roundIndex ? `${base}?tour=${roundIndex}` : base;
}

export function editTontinePath(tontineId) {
  return `${tontineDetailPath(tontineId)}/modifier`;
}

export function tontineTabPath(tontineId, tab) {
  return `${tontineDetailPath(tontineId)}?onglet=${tab}`;
}

export function joinPath(inviteCode) {
  return `/rejoindre/${encodeURIComponent(inviteCode)}`;
}

/** N'accepte que des chemins internes (évite les redirections vers un autre site). */
export function safeRedirect(path) {
  if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')) return path;
  return ROUTES.dashboard;
}

export function adminTontinePath(tontineId) {
  return `/admin/tontines/${encodeURIComponent(tontineId)}`;
}

/** Enregistrer le paiement d'un membre (organisateur), membre présélectionné. */
export function recordPaymentPath(tontineId, memberId) {
  return `${tontineDetailPath(tontineId)}/declarer?membre=${encodeURIComponent(memberId)}`;
}

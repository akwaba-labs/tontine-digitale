// Chemins des pages (URL en français, identifiants en anglais).
export const ROUTES = Object.freeze({
  home: '/',
  login: '/connexion',
  register: '/inscription',
  forgotPassword: '/mot-de-passe-oublie',
  join: '/rejoindre',
  joinWithCode: '/rejoindre/:inviteCode',
  dashboard: '/tableau-de-bord',
  tontines: '/tontines',
  createTontine: '/tontines/nouvelle',
  tontineDetail: '/tontines/:tontineId',
  declarePayment: '/tontines/:tontineId/declarer',
  notifications: '/notifications',
  profile: '/profil',
  settings: '/parametres',
});

export function tontineDetailPath(tontineId) {
  return `/tontines/${encodeURIComponent(tontineId)}`;
}

export function declarePaymentPath(tontineId) {
  return `${tontineDetailPath(tontineId)}/declarer`;
}

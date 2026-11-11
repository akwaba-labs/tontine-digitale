import { PHONE_COUNTRY_CODE } from '../../config/app';

// Numéros ivoiriens à 10 chiffres (depuis 2021) :
// 01 Moov, 05 MTN, 07 Orange ; 21, 25, 27 pour les fixes.
const LOCAL_NUMBER_PATTERN = /^(01|05|07|21|25|27)\d{8}$/;
const COUNTRY_DIGITS = PHONE_COUNTRY_CODE.replace('+', '');

/** Extrait les 10 chiffres du numéro local, ou null si le numéro n'est pas ivoirien valide. */
function extractLocalNumber(input) {
  if (typeof input !== 'string') return null;
  let digits = input.replace(/[^\d+]/g, '');

  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.length === 10) {
    digits = `${COUNTRY_DIGITS}${digits}`;
  }

  if (digits.includes('+') || !digits.startsWith(COUNTRY_DIGITS)) return null;

  const local = digits.slice(COUNTRY_DIGITS.length);
  return LOCAL_NUMBER_PATTERN.test(local) ? local : null;
}

export function isValidPhone(input) {
  return extractLocalNumber(input) !== null;
}

/** Format international sans espace, utilisé pour le stockage et Firebase Auth : « +2250707070707 ». */
export function normalizePhone(input) {
  const local = extractLocalNumber(input);
  return local ? `${PHONE_COUNTRY_CODE}${local}` : null;
}

/** Format d'affichage : « +225 07 07 07 07 07 ». Un numéro non reconnu est renvoyé tel quel. */
export function formatPhone(input) {
  const local = extractLocalNumber(input);
  if (!local) return typeof input === 'string' ? input.trim() : '';
  return `${PHONE_COUNTRY_CODE} ${local.match(/\d{2}/g).join(' ')}`;
}

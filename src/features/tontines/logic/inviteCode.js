// Code d'invitation : 6 caractères sans lettres ambiguës (pas de O/0, I/1).
export const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 6;

export function generateInviteCode(
  randomValues = (n) => globalThis.crypto.getRandomValues(new Uint32Array(n)),
) {
  const values = randomValues(INVITE_CODE_LENGTH);
  return Array.from(values, (value) => INVITE_ALPHABET[value % INVITE_ALPHABET.length]).join('');
}

export function normalizeInviteCode(input) {
  return String(input ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function isValidInviteCode(code) {
  return new RegExp(`^[${INVITE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`).test(code);
}

import { CURRENCY_LABEL } from '../../config/app';

// Espace insécable : « 25 000 FCFA » ne sera jamais coupé en fin de ligne.
const NBSP = '\u00A0';

/**
 * Formate un montant en FCFA avec un séparateur de milliers : 25000 → « 25 000 FCFA ».
 * Les montants sont toujours des entiers (le franc CFA n'a pas de centimes) :
 * un nombre à virgule signale une erreur de calcul et lève une exception.
 */
export function formatAmount(amount, { withCurrency = true } = {}) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new TypeError(`Montant invalide : ${String(amount)}`);
  }
  if (!Number.isSafeInteger(amount)) {
    throw new RangeError(`Le montant doit être un nombre entier : ${amount}`);
  }

  const sign = amount < 0 ? '-' : '';
  const digits = String(Math.abs(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  const formatted = `${sign}${digits}`;

  return withCurrency ? `${formatted}${NBSP}${CURRENCY_LABEL}` : formatted;
}

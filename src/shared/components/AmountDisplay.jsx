import { formatAmount } from '../utils/formatAmount';

/** Affiche un montant en FCFA (entier), avec chiffres alignés. */
export default function AmountDisplay({ amount, withCurrency = true, className = '' }) {
  return (
    <span className={`amount ${className}`.trim()}>{formatAmount(amount, { withCurrency })}</span>
  );
}

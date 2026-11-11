import * as yup from 'yup';
import { FREQUENCY, LIMITS, ORDER_MODE } from '../../../shared/constants/domain';
import { isIsoDate } from '../../../shared/utils/dates';

const integer = (label) =>
  yup
    .number()
    .transform((value, original) => (original === '' || original === null ? undefined : value))
    .typeError(`${label} : saisissez un nombre.`)
    .integer(`${label} : nombre entier sans virgule.`);

export const tontineSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Donnez un nom à la tontine.')
    .min(2, '2 caractères minimum.')
    .max(80, '80 caractères maximum.'),
  description: yup.string().trim().max(500, '500 caractères maximum.'),
  amount: integer('Cotisation')
    .required('Indiquez le montant de la cotisation.')
    .min(LIMITS.minAmount, `Minimum ${LIMITS.minAmount} FCFA.`)
    .max(LIMITS.maxAmount, 'Montant trop élevé.'),
  frequency: yup
    .string()
    .oneOf(Object.values(FREQUENCY), 'Choisissez la fréquence des dépôts.')
    .required('Choisissez la fréquence des dépôts.'),
  depositsPerRound: integer('Dépôts par tour')
    .required('Indiquez après combien de dépôts le pot est remis.')
    .min(1, 'Au moins 1 dépôt.')
    .max(LIMITS.maxDepositsPerRound, `Au plus ${LIMITS.maxDepositsPerRound} dépôts.`),
  startDate: yup
    .string()
    .required('Choisissez la date du premier dépôt.')
    .test('iso-date', 'Date invalide.', (value) => isIsoDate(value)),
  totalShares: integer('Nombre de parts')
    .required('Indiquez le nombre de parts.')
    .min(LIMITS.minShares, `Au moins ${LIMITS.minShares} parts.`)
    .max(LIMITS.maxShares, `Au plus ${LIMITS.maxShares} parts.`),
  ownerShares: integer('Vos parts')
    .min(1, 'Au moins 1 part.')
    .max(LIMITS.maxSharesPerMember, `Au plus ${LIMITS.maxSharesPerMember} parts.`)
    .test('fits', 'Plus que le nombre total de parts.', function fits(value) {
      return value === undefined || value <= (this.parent.totalShares ?? Infinity);
    }),
  graceDays: integer('Délai de grâce')
    .required('Indiquez le délai de grâce (0 si aucun).')
    .min(0, 'Pas de valeur négative.')
    .max(LIMITS.maxGraceDays, `Au plus ${LIMITS.maxGraceDays} jours.`),
  penaltyAmount: integer('Pénalité')
    .required('Indiquez la pénalité (0 si aucune).')
    .min(0, 'Pas de valeur négative.')
    .max(LIMITS.maxAmount, 'Montant trop élevé.'),
  orderMode: yup.string().oneOf(Object.values(ORDER_MODE)).required(),
});

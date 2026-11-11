import * as yup from 'yup';
import { isValidPhone } from '../../../shared/utils/formatPhone';

/** Membre sans compte : seul le nom est obligatoire. */
export const guestSchema = (maxShares) =>
  yup.object({
    displayName: yup
      .string()
      .trim()
      .required('Saisissez le nom de la personne.')
      .min(2, 'Au moins 2 caractères.')
      .max(130, '130 caractères maximum.'),
    phone: yup
      .string()
      .trim()
      .test(
        'phone-ci',
        'Numéro ivoirien invalide (ex. 07 07 07 07 07).',
        (value) => !value || isValidPhone(value),
      ),
    email: yup.string().trim().email('Adresse e-mail invalide.').max(200),
    shares: yup
      .number()
      .typeError('Choisissez le nombre de parts.')
      .integer()
      .min(1)
      .max(maxShares, `${maxShares} part(s) disponible(s) au maximum.`),
  });

import * as yup from 'yup';
import { isValidPhone } from '../../../shared/utils/formatPhone';

const email = yup
  .string()
  .trim()
  .required('Saisissez votre e-mail.')
  .email('Adresse e-mail invalide.');

const newPassword = yup
  .string()
  .required('Choisissez un mot de passe.')
  .min(8, 'Au moins 8 caractères.');

const name = (label) =>
  yup.string().trim().required(`Saisissez votre ${label}.`).max(60, '60 caractères maximum.');

export const phoneField = yup
  .string()
  .trim()
  .required('Saisissez votre numéro de téléphone.')
  .test('phone-ci', 'Numéro ivoirien invalide (ex. 07 07 07 07 07).', (value) =>
    isValidPhone(value),
  );

export const loginSchema = yup.object({
  email,
  password: yup.string().required('Saisissez votre mot de passe.'),
});

export const registerSchema = yup.object({
  firstName: name('prénom'),
  lastName: name('nom'),
  phone: phoneField,
  email,
  password: newPassword,
  passwordConfirmation: yup
    .string()
    .required('Confirmez le mot de passe.')
    .oneOf([yup.ref('password')], 'Les deux mots de passe sont différents.'),
  acceptPrivacy: yup.boolean().oneOf([true], 'Vous devez accepter pour créer un compte.'),
});

export const forgotPasswordSchema = yup.object({ email });

export const profileSchema = yup.object({
  firstName: name('prénom'),
  lastName: name('nom'),
  phone: phoneField,
});

export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Saisissez votre mot de passe actuel.'),
  newPassword,
  newPasswordConfirmation: yup
    .string()
    .required('Confirmez le nouveau mot de passe.')
    .oneOf([yup.ref('newPassword')], 'Les deux mots de passe sont différents.'),
});

export const deleteAccountSchema = yup.object({
  password: yup.string().required('Saisissez votre mot de passe pour confirmer.'),
});

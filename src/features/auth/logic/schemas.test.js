import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './schemas';

const valid = {
  firstName: 'Awa',
  lastName: 'Koné',
  phone: '07 07 07 07 07',
  email: 'awa@example.com',
  password: 'motdepasse',
  passwordConfirmation: 'motdepasse',
  acceptPrivacy: true,
};

async function errorsOf(schema, values) {
  try {
    await schema.validate(values, { abortEarly: false });
    return [];
  } catch (error) {
    return error.errors;
  }
}

describe('registerSchema', () => {
  it('accepte une inscription valide', async () => {
    expect(await errorsOf(registerSchema, valid)).toEqual([]);
  });

  it('donne des messages en français', async () => {
    const errors = await errorsOf(registerSchema, {
      ...valid,
      phone: '0607',
      email: 'pas-un-email',
      password: 'court',
      passwordConfirmation: 'autre',
      acceptPrivacy: false,
    });
    expect(errors).toEqual(
      expect.arrayContaining([
        'Numéro ivoirien invalide (ex. 07 07 07 07 07).',
        'Adresse e-mail invalide.',
        'Au moins 8 caractères.',
        'Les deux mots de passe sont différents.',
        'Vous devez accepter pour créer un compte.',
      ]),
    );
  });
});

describe('loginSchema', () => {
  it('exige l’e-mail et le mot de passe', async () => {
    expect(await errorsOf(loginSchema, { email: '', password: '' })).toEqual([
      'Saisissez votre e-mail.',
      'Saisissez votre mot de passe.',
    ]);
  });
});

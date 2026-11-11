import { describe, expect, it } from 'vitest';
import { AppError, getErrorMessage } from './errorMessages';

describe('getErrorMessage', () => {
  it('traduit les erreurs Firebase', () => {
    expect(getErrorMessage({ code: 'auth/wrong-password' })).toBe('Mot de passe incorrect.');
    expect(getErrorMessage({ code: 'auth/email-already-in-use' })).toMatch(/existe déjà/);
    expect(getErrorMessage({ code: 'permission-denied' })).toMatch(/pas le droit/);
    expect(getErrorMessage({ code: 'firestore/unavailable' })).toMatch(/indisponible/);
  });

  it('garde le message d’une erreur métier', () => {
    expect(getErrorMessage(new AppError('Code invalide.'))).toBe('Code invalide.');
  });

  it('donne un message générique sinon', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('Une erreur est survenue. Réessayez.');
    expect(getErrorMessage(null)).toBe('Une erreur est survenue. Réessayez.');
  });
});

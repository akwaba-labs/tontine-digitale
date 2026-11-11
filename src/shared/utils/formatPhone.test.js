import { describe, expect, it } from 'vitest';
import { formatPhone, isValidPhone, normalizePhone } from './formatPhone';

describe('formatPhone', () => {
  it.each([
    '0707070707',
    '07 07 07 07 07',
    '07.07.07.07.07',
    '+2250707070707',
    '+225 07 07 07 07 07',
    '002250707070707',
    '2250707070707',
  ])('reconnaît « %s »', (input) => {
    expect(isValidPhone(input)).toBe(true);
    expect(normalizePhone(input)).toBe('+2250707070707');
    expect(formatPhone(input)).toBe('+225 07 07 07 07 07');
  });

  it.each(['0505123456', '0102030405', '2721000000'])('accepte le préfixe de « %s »', (input) => {
    expect(isValidPhone(input)).toBe(true);
  });

  it.each(['', '070707070', '07070707070', '0907070707', '+33612345678', '+225070707070+7', 'abc'])(
    'refuse « %s »',
    (input) => {
      expect(isValidPhone(input)).toBe(false);
      expect(normalizePhone(input)).toBeNull();
    },
  );

  it('renvoie un numéro non reconnu tel quel', () => {
    expect(formatPhone(' +33 6 12 34 56 78 ')).toBe('+33 6 12 34 56 78');
  });

  it('gère les valeurs absentes', () => {
    expect(formatPhone(undefined)).toBe('');
    expect(isValidPhone(null)).toBe(false);
  });
});

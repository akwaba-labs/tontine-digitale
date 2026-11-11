import { describe, expect, it } from 'vitest';
import { formatAmount } from './formatAmount';

const normalizeSpaces = (text) => text.replace(/\u00A0/g, ' ');

describe('formatAmount', () => {
  it.each([
    [0, '0 FCFA'],
    [500, '500 FCFA'],
    [1000, '1 000 FCFA'],
    [25000, '25 000 FCFA'],
    [1250000, '1 250 000 FCFA'],
    [-5000, '-5 000 FCFA'],
  ])('formate %i en « %s »', (amount, expected) => {
    expect(normalizeSpaces(formatAmount(amount))).toBe(expected);
  });

  it('utilise des espaces insécables', () => {
    expect(formatAmount(25000)).toBe('25\u00A0000\u00A0FCFA');
  });

  it('peut omettre la devise', () => {
    expect(normalizeSpaces(formatAmount(25000, { withCurrency: false }))).toBe('25 000');
  });

  it('refuse les nombres à virgule', () => {
    expect(() => formatAmount(1000.5)).toThrow(RangeError);
  });

  it.each([NaN, '1000', null, undefined])('refuse la valeur %s', (value) => {
    expect(() => formatAmount(value)).toThrow(TypeError);
  });
});

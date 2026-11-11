import { describe, expect, it } from 'vitest';
import { addDays, addMonths, diffInDays, isIsoDate, todayIso } from './dates';

describe('dates', () => {
  it('valide le format AAAA-MM-JJ', () => {
    expect(isIsoDate('2026-02-28')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('26-01-01')).toBe(false);
    expect(isIsoDate(null)).toBe(false);
  });

  it('ajoute des jours en changeant de mois et d’année', () => {
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04');
    expect(addDays('2028-02-27', 2)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('ajoute des mois en gérant les mois de 28 à 31 jours', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-01-31', 2)).toBe('2026-03-31');
    expect(addMonths('2026-01-31', 3)).toBe('2026-04-30');
    expect(addMonths('2026-11-15', 2)).toBe('2027-01-15');
    expect(addMonths('2026-05-30', 9)).toBe('2027-02-28');
  });

  it('calcule un écart en jours', () => {
    expect(diffInDays('2026-11-01', '2026-11-11')).toBe(10);
    expect(diffInDays('2026-11-11', '2026-11-01')).toBe(-10);
    expect(diffInDays('2026-02-28', '2026-03-01')).toBe(1);
  });

  it('donne la date du jour à Abidjan', () => {
    expect(todayIso(new Date('2026-11-11T23:59:59Z'))).toBe('2026-11-11');
    expect(todayIso(new Date('2026-11-12T00:00:01Z'))).toBe('2026-11-12');
  });

  it('refuse une date invalide', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError);
  });
});

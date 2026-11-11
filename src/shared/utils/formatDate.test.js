import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatDayAndMonth,
  formatShortDate,
  toDate,
} from './formatDate';

// 11 novembre 2026, 14 h 30 à Abidjan (UTC+0, sans heure d'été).
const SAMPLE = '2026-11-11T14:30:00Z';

describe('formatDate', () => {
  it('formate une date longue en français', () => {
    expect(formatDate(SAMPLE)).toBe('11 novembre 2026');
  });

  it('formate une date courte', () => {
    expect(formatShortDate(SAMPLE)).toBe('11/11/2026');
  });

  it('formate le jour de la semaine et le mois', () => {
    expect(formatDayAndMonth(SAMPLE)).toBe('mercredi 11 novembre');
  });

  it('formate une date avec l’heure', () => {
    expect(formatDateTime(SAMPLE)).toBe('11 nov. 2026 à 14:30');
  });

  it('accepte un Timestamp Firestore', () => {
    const timestamp = { toDate: () => new Date(SAMPLE) };
    expect(formatDate(timestamp)).toBe('11 novembre 2026');
  });

  it('accepte un horodatage en millisecondes', () => {
    expect(formatShortDate(Date.parse(SAMPLE))).toBe('11/11/2026');
  });

  it('refuse une date invalide', () => {
    expect(() => formatDate('pas une date')).toThrow(RangeError);
    expect(() => toDate(null)).toThrow(TypeError);
  });
});

describe('formatDate avec un téléphone réglé sur un autre fuseau', () => {
  let originalTimeZone;

  beforeEach(() => {
    originalTimeZone = process.env.TZ;
    process.env.TZ = 'Asia/Tokyo';
  });

  afterEach(() => {
    process.env.TZ = originalTimeZone;
  });

  it('affiche toujours l’heure d’Abidjan', () => {
    // 23 h 30 à Abidjan = 8 h 30 le lendemain à Tokyo.
    expect(formatDateTime('2026-01-31T23:30:00Z')).toBe('31 janv. 2026 à 23:30');
  });
});

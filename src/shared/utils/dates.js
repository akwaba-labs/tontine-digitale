// Dates « calendaires » au format ISO « AAAA-MM-JJ ».
// Toutes les échéances sont stockées ainsi : pas d'heure, pas de fuseau, pas d'ambiguïté.
// Abidjan est en UTC+0 toute l'année : « aujourd'hui » est calculé dans ce fuseau.
import { APP_TIME_ZONE } from '../../config/app';

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const todayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isIsoDate(value) {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function parse(iso) {
  if (!isIsoDate(iso)) throw new RangeError(`Date invalide : ${String(iso)}`);
  const [, y, m, d] = ISO_DATE_PATTERN.exec(iso).map(Number);
  return { y, m, d };
}

function fromUtc(date) {
  return date.toISOString().slice(0, 10);
}

/** Date du jour à Abidjan, au format « AAAA-MM-JJ ». */
export function todayIso(now = new Date()) {
  return todayFormatter.format(now);
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function addDays(iso, days) {
  const { y, m, d } = parse(iso);
  return fromUtc(new Date(Date.UTC(y, m - 1, d + days)));
}

/**
 * Ajoute des mois en gardant le jour d'origine quand il existe,
 * sinon le dernier jour du mois : 31 janvier + 1 mois = 28 (ou 29) février,
 * 31 janvier + 2 mois = 31 mars.
 */
export function addMonths(iso, months) {
  const { y, m, d } = parse(iso);
  const totalMonths = y * 12 + (m - 1) + months;
  const year = Math.floor(totalMonths / 12);
  const month = (totalMonths % 12) + 1;
  const day = Math.min(d, daysInMonth(year, month));
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Nombre de jours de `from` à `to` (positif si `to` est après `from`). */
export function diffInDays(from, to) {
  const a = parse(from);
  const b = parse(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / DAY_MS);
}

/** Convertit « AAAA-MM-JJ » en Date (minuit UTC = minuit à Abidjan). */
export function isoToDate(iso) {
  const { y, m, d } = parse(iso);
  return new Date(Date.UTC(y, m - 1, d));
}

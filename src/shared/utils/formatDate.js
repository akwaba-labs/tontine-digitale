import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { APP_TIME_ZONE } from '../../config/app';

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

/**
 * Convertit une valeur en Date. Accepte une Date, un horodatage (ms), une chaîne ISO
 * ou un Timestamp Firestore (objet possédant une méthode toDate()).
 */
export function toDate(value) {
  if (value instanceof Date) return value;
  if (value && typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'number' || typeof value === 'string') return new Date(value);
  throw new TypeError(`Date invalide : ${String(value)}`);
}

/**
 * Renvoie une Date dont l'heure « locale » correspond à l'heure d'Abidjan,
 * quel que soit le fuseau horaire configuré sur le téléphone.
 */
function toAppTimeZone(value) {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError(`Date invalide : ${String(value)}`);
  }
  const parts = Object.fromEntries(
    partsFormatter.formatToParts(date).map(({ type, value: part }) => [type, Number(part)]),
  );
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

function formatInAppTimeZone(value, pattern) {
  return format(toAppTimeZone(value), pattern, { locale: fr });
}

/** « 11 novembre 2026 » */
export function formatDate(value) {
  return formatInAppTimeZone(value, 'd MMMM yyyy');
}

/** « 11/11/2026 » */
export function formatShortDate(value) {
  return formatInAppTimeZone(value, 'dd/MM/yyyy');
}

/** « mercredi 11 novembre » */
export function formatDayAndMonth(value) {
  return formatInAppTimeZone(value, 'EEEE d MMMM');
}

/** « 11 nov. 2026 à 14:30 » */
export function formatDateTime(value) {
  return formatInAppTimeZone(value, "d MMM yyyy 'à' HH:mm");
}

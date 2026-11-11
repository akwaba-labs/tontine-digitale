import { APP_NAME } from '../../config/app';
import { FREQUENCY_LABELS } from '../constants/domain';
import { formatAmount } from './formatAmount';
import { formatDate } from './formatDate';

/** Lien de partage WhatsApp avec un message prérempli (le destinataire est choisi dans WhatsApp). */
export function whatsappShareLink(message) {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildInviteMessage({ tontine, inviteUrl }) {
  return [
    `Bonjour ! Je t’invite à rejoindre la tontine « ${tontine.name} » sur ${APP_NAME}.`,
    `Cotisation : ${formatAmount(tontine.amount)} (${FREQUENCY_LABELS[tontine.frequency].toLowerCase()}), ${tontine.totalShares} tours.`,
    `Code d’invitation : ${tontine.inviteCode}`,
    `Rejoindre : ${inviteUrl}`,
  ].join('\n');
}

export function buildReminderMessage({ tontine, round, lateLines, tontineUrl }) {
  const names = lateLines.map((line) => `• ${line.member.displayName} : ${formatAmount(line.due)}`);
  return [
    `Rappel – tontine « ${tontine.name} », tour n° ${round.index} (échéance du ${formatDate(round.dueDate)}).`,
    'Cotisations pas encore reçues :',
    ...names,
    `Merci de régulariser et de déclarer votre paiement dans l’application : ${tontineUrl}`,
  ].join('\n');
}

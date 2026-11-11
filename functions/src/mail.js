// Contenu des e-mails envoyés aux membres à chaque événement d'une tontine.
// Fonctions pures (testées) : aucune dépendance à Firebase ici.
//
// Les phrases viennent du même code que l'onglet « Historique » de l'application
// (describeEvent) : l'e-mail dit exactement ce que les membres verront dans le journal.
import { describeEvent } from '../../src/features/tontines/logic/eventLabels.js';
import { EVENT_TYPES, MEMBER_STATUS } from '../../src/shared/constants/domain.js';
import { APP_NAME } from '../../src/config/app.js';

const SUBJECTS = {
  [EVENT_TYPES.TONTINE_UPDATED]: 'Paramètres modifiés',
  [EVENT_TYPES.TONTINE_STARTED]: 'La tontine a démarré',
  [EVENT_TYPES.TONTINE_COMPLETED]: 'La tontine est terminée',
  [EVENT_TYPES.TONTINE_CANCELLED]: 'La tontine est annulée',
  [EVENT_TYPES.MEMBER_ACCEPTED]: 'Nouveau membre',
  [EVENT_TYPES.MEMBER_ADDED]: 'Nouveau membre',
  [EVENT_TYPES.MEMBER_REFUSED]: 'Demande non acceptée',
  [EVENT_TYPES.MEMBER_REMOVED]: 'Un membre a été retiré',
  [EVENT_TYPES.MEMBER_LEFT]: 'Un membre est parti',
  [EVENT_TYPES.MEMBER_ROLE_CHANGED]: 'Changement de rôle',
  [EVENT_TYPES.MEMBER_SHARES_CHANGED]: 'Parts modifiées',
  [EVENT_TYPES.ORDER_SET]: 'Ordre de passage fixé',
  [EVENT_TYPES.DRAW_PERFORMED]: 'Résultat du tirage au sort',
  [EVENT_TYPES.PAYMENT_DECLARED]: 'Paiement déclaré',
  [EVENT_TYPES.PAYMENT_CONFIRMED]: 'Paiement confirmé',
  [EVENT_TYPES.PAYMENT_REJECTED]: 'Paiement rejeté',
  [EVENT_TYPES.PAYMENT_RECORDED]: 'Paiement enregistré',
  [EVENT_TYPES.PENALTY_APPLIED]: 'Pénalité de retard',
  [EVENT_TYPES.PAYOUT_SENT]: 'Pot versé',
  [EVENT_TYPES.PAYOUT_RECEIVED]: 'Pot reçu',
};

// La personne refusée ou retirée n'est plus membre active, mais elle doit être prévenue.
const CONCERNS_TARGET = [EVENT_TYPES.MEMBER_REFUSED, EVENT_TYPES.MEMBER_REMOVED];

/**
 * Qui reçoit l'e-mail : tous les membres actifs (avec ou sans compte), sauf l'auteur de l'action,
 * plus la personne concernée par un refus ou un retrait.
 */
export function selectRecipientIds(event, members) {
  const ids = new Set(
    members.filter((m) => m.status === MEMBER_STATUS.ACTIVE).map((m) => m.userId),
  );
  if (CONCERNS_TARGET.includes(event.type) && event.payload?.memberId) {
    ids.add(event.payload.memberId);
  }
  ids.delete(event.actorId);
  return [...ids];
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Construit l'e-mail pour un destinataire.
 * Les membres sans compte n'ont pas de lien vers l'application (ils ne peuvent pas s'y connecter).
 */
export function buildEmail({ event, tontine, recipientName, isGuest, appUrl }) {
  const sentence = describeEvent(event);
  const subject = `${tontine.name} · ${SUBJECTS[event.type] ?? 'Nouvelle activité'}`;
  const link = `${appUrl.replace(/\/$/, '')}/tontines/${encodeURIComponent(tontine.id)}?onglet=historique`;
  const greeting = recipientName ? `Bonjour ${recipientName},` : 'Bonjour,';
  const footer = isGuest
    ? `Vous recevez cet e-mail car l’organisateur de « ${tontine.name} » vous a inscrit avec cette adresse. Pour ne plus le recevoir, demandez-lui de la retirer.`
    : `Vous recevez cet e-mail car vous êtes membre de « ${tontine.name} ». Pour ne plus recevoir ces e-mails : ${APP_NAME} › Paramètres.`;

  const text = [
    greeting,
    '',
    `Du nouveau dans la tontine « ${tontine.name} » :`,
    sentence,
    '',
    ...(isGuest ? [] : [`Voir la tontine : ${link}`, '']),
    '—',
    footer,
  ].join('\n');

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px 12px;background:#fbf7ef;font-family:Arial,Helvetica,sans-serif;color:#1b2420">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e9dfcc;border-radius:16px">
      <tr>
        <td style="padding:20px 24px;background:#136f47;border-radius:16px 16px 0 0;color:#ffffff;font-size:18px;font-weight:bold">
          ${escapeHtml(tontine.name)}
        </td>
      </tr>
      <tr>
        <td style="padding:24px;font-size:16px;line-height:1.5">
          <p style="margin:0 0 12px">${escapeHtml(greeting)}</p>
          <p style="margin:0 0 16px;padding:12px 16px;background:#f3ead9;border-radius:10px">${escapeHtml(sentence)}</p>
          ${
            isGuest
              ? ''
              : `<p style="margin:0 0 8px"><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 20px;background:#136f47;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:bold">Voir la tontine</a></p>`
          }
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px;border-top:1px solid #e9dfcc;font-size:12px;color:#5f6b64">
          ${escapeHtml(footer)}
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

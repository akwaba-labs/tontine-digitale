// Résumé quotidien par e-mail : contenu et destinataires.
// Fonctions pures (testées) : aucune dépendance à Firebase ici.
//
// Les phrases viennent du même code que l'onglet « Historique » de l'application
// (describeEvent) : l'e-mail dit exactement ce que les membres verront dans le journal.
import { describeEvent } from '../../src/features/tontines/logic/eventLabels.js';
import { EVENT_TYPES, MEMBER_STATUS } from '../../src/shared/constants/domain.js';
import { formatDayAndMonth, formatTime } from '../../src/shared/utils/formatDate.js';
import { APP_NAME } from '../../src/config/app.js';

// Au-delà, le résumé renvoie vers l'historique de l'application.
export const MAX_EVENTS_PER_TONTINE = 15;

// La personne refusée ou retirée n'est plus membre active, mais elle doit être prévenue.
const CONCERNS_TARGET = [EVENT_TYPES.MEMBER_REFUSED, EVENT_TYPES.MEMBER_REMOVED];

/**
 * Qui doit voir un événement : tous les membres actifs (avec ou sans compte), sauf son auteur,
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

/**
 * Regroupe les événements de la journée par destinataire, puis par tontine.
 * `activity` : [{ tontine, members, events }] (événements triés par date).
 * Renvoie Map(memberId → [{ tontine, member, events }]).
 */
export function groupDigests(activity) {
  const digests = new Map();
  for (const { tontine, members, events } of activity) {
    const byId = new Map(members.map((m) => [m.userId, m]));
    const perMember = new Map();
    for (const event of events) {
      for (const memberId of selectRecipientIds(event, members)) {
        if (!byId.has(memberId)) continue;
        if (!perMember.has(memberId)) perMember.set(memberId, []);
        perMember.get(memberId).push(event);
      }
    }
    for (const [memberId, memberEvents] of perMember) {
      if (!digests.has(memberId)) digests.set(memberId, []);
      digests.get(memberId).push({ tontine, member: byId.get(memberId), events: memberEvents });
    }
  }
  return digests;
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const plural = (n, singular, pluralForm = `${singular}s`) =>
  `${n} ${n > 1 ? pluralForm : singular}`;

/**
 * Construit le résumé d'un destinataire.
 * Les membres sans compte n'ont pas de lien vers l'application (ils ne peuvent pas s'y connecter).
 */
export function buildDigestEmail({ sections, recipientName, isGuest, appUrl, date }) {
  const base = appUrl.replace(/\/$/, '');
  const total = sections.reduce((sum, s) => sum + s.events.length, 0);
  const day = formatDayAndMonth(date);
  const subject =
    sections.length === 1
      ? `${sections[0].tontine.name} · résumé du ${day} (${plural(total, 'nouveauté')})`
      : `Vos tontines · résumé du ${day} (${plural(total, 'nouveauté')})`;
  const greeting = recipientName ? `Bonjour ${recipientName},` : 'Bonjour,';
  const intro = `Voici ce qui s’est passé aujourd’hui dans ${sections.length > 1 ? 'vos tontines' : 'votre tontine'}.`;
  const footer = isGuest
    ? 'Vous recevez ce résumé car l’organisateur de la tontine vous a inscrit avec cette adresse. Pour ne plus le recevoir, demandez-lui de la retirer.'
    : `Vous recevez ce résumé car vous êtes membre de ces tontines. Pour ne plus le recevoir : ${APP_NAME} › Paramètres.`;

  const prepared = sections.map(({ tontine, events }) => ({
    name: tontine.name,
    link: `${base}/tontines/${encodeURIComponent(tontine.id)}?onglet=historique`,
    lines: events.slice(0, MAX_EVENTS_PER_TONTINE).map((event) => ({
      time: event.createdAt ? formatTime(event.createdAt) : '',
      sentence: describeEvent(event),
    })),
    hidden: Math.max(0, events.length - MAX_EVENTS_PER_TONTINE),
  }));

  const text = [
    greeting,
    '',
    intro,
    ...prepared.flatMap((s) => [
      '',
      `« ${s.name} »`,
      ...s.lines.map((l) => `- ${l.time ? `${l.time} · ` : ''}${l.sentence}`),
      ...(s.hidden ? [`- … et ${plural(s.hidden, 'autre activité', 'autres activités')}.`] : []),
      ...(isGuest ? [] : [`Voir la tontine : ${s.link}`]),
    ]),
    '',
    '—',
    footer,
  ].join('\n');

  const sectionHtml = (s) => `
      <tr>
        <td style="padding:20px 24px 4px">
          <div style="font-size:17px;font-weight:bold;color:#136f47;margin-bottom:8px">${escapeHtml(s.name)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${s.lines
              .map(
                (l) => `<tr>
              <td valign="top" style="padding:6px 10px 6px 0;width:44px;font-size:13px;color:#5f6b64;border-bottom:1px dashed #e9dfcc">${escapeHtml(l.time)}</td>
              <td style="padding:6px 0;font-size:15px;line-height:1.4;border-bottom:1px dashed #e9dfcc">${escapeHtml(l.sentence)}</td>
            </tr>`,
              )
              .join('')}
          </table>
          ${s.hidden ? `<p style="margin:8px 0 0;font-size:14px;color:#5f6b64">… et ${escapeHtml(plural(s.hidden, 'autre activité', 'autres activités'))}.</p>` : ''}
          ${
            isGuest
              ? ''
              : `<p style="margin:12px 0 0"><a href="${escapeHtml(s.link)}" style="display:inline-block;padding:10px 18px;background:#136f47;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:bold;font-size:14px">Voir la tontine</a></p>`
          }
        </td>
      </tr>`;

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:24px 12px;background:#fbf7ef;font-family:Arial,Helvetica,sans-serif;color:#1b2420">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e9dfcc;border-radius:16px">
      <tr>
        <td style="padding:20px 24px;background:#136f47;border-radius:16px 16px 0 0;color:#ffffff">
          <div style="font-size:13px;opacity:.8">${escapeHtml(APP_NAME)}</div>
          <div style="font-size:19px;font-weight:bold">Résumé du ${escapeHtml(day)}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 24px 0;font-size:16px;line-height:1.5">
          <p style="margin:0 0 4px">${escapeHtml(greeting)}</p>
          <p style="margin:0">${escapeHtml(intro)}</p>
        </td>
      </tr>${prepared.map(sectionHtml).join('')}
      <tr>
        <td style="padding:20px 24px;font-size:12px;color:#5f6b64">${escapeHtml(footer)}</td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

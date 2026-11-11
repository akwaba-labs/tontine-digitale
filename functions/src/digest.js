// Envoi du résumé quotidien : lit l'activité d'une période, construit un e-mail par membre
// et l'envoie (ou le simule). Utilisé par la fonction planifiée et par « npm run digest ».
import { FieldValue } from 'firebase-admin/firestore';
import { isGuestId } from '../../src/shared/constants/domain.js';
import { buildDigestEmail, groupDigests } from './mail.js';

/** Adresse et prénom d'un destinataire, ou null s'il ne veut / ne peut pas recevoir d'e-mail. */
async function resolveRecipient(db, tontineId, member) {
  if (isGuestId(member.userId)) {
    const contact = await db.doc(`tontines/${tontineId}/guestContacts/${member.userId}`).get();
    const email = contact.get('email');
    return email ? { email, name: member.displayName, isGuest: true } : null;
  }
  const user = await db.doc(`users/${member.userId}`).get();
  if (!user.exists || user.get('emailNotifications') === false || !user.get('email')) return null;
  return { email: user.get('email'), name: user.get('firstName'), isGuest: false };
}

/** Activité de la période, regroupée par tontine : [{ tontine, members, events }]. */
async function loadActivity(db, since, until) {
  const snapshot = await db
    .collectionGroup('events')
    .where('createdAt', '>', since)
    .where('createdAt', '<=', until)
    .orderBy('createdAt')
    .get();
  const eventsByTontine = new Map();
  for (const doc of snapshot.docs) {
    const tontineId = doc.ref.parent.parent.id;
    if (!eventsByTontine.has(tontineId)) eventsByTontine.set(tontineId, []);
    eventsByTontine.get(tontineId).push({ id: doc.id, ...doc.data() });
  }
  return Promise.all(
    [...eventsByTontine].map(async ([tontineId, events]) => {
      const [tontineSnap, membersSnap] = await Promise.all([
        db.doc(`tontines/${tontineId}`).get(),
        db.collection(`tontines/${tontineId}/members`).get(),
      ]);
      return {
        tontine: { id: tontineId, ...tontineSnap.data() },
        members: membersSnap.docs.map((d) => ({ ...d.data(), userId: d.id })),
        events,
      };
    }),
  ).then((list) => list.filter((a) => a.tontine.name));
}

/**
 * @param deliver  async ({ to, subject, text, html }) => void, ou null pour simuler
 * @param runKey   identifiant de l'envoi (la date) : un membre ne reçoit qu'un résumé par envoi
 * @returns        { recipients, sent, simulated, failed, skipped }
 */
export async function runDigest({ db, since, until, runKey, appUrl, deliver, logger = console }) {
  const activity = await loadActivity(db, since, until);
  const digests = groupDigests(activity);
  const stats = { recipients: digests.size, sent: 0, simulated: 0, failed: 0, skipped: 0 };

  for (const [memberId, sections] of digests) {
    // Un membre sans compte n'appartient qu'à une tontine : son identifiant lui est propre.
    const recipient = await resolveRecipient(db, sections[0].tontine.id, sections[0].member);
    if (!recipient) {
      stats.skipped += 1;
      continue;
    }
    const mail = buildDigestEmail({
      sections,
      recipientName: recipient.name,
      isGuest: recipient.isGuest,
      appUrl,
      date: until,
    });
    const logRef = db.doc(`mailLog/digest_${runKey}_${memberId}`);
    try {
      await logRef.create({
        kind: 'DAILY_DIGEST',
        to: recipient.email,
        subject: mail.subject,
        tontineIds: sections.map((s) => s.tontine.id),
        eventCount: sections.reduce((n, s) => n + s.events.length, 0),
        status: 'PENDING',
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      if (error.code === 6) {
        stats.skipped += 1; // ALREADY_EXISTS : déjà envoyé pour cette date
        continue;
      }
      throw error;
    }

    if (!deliver) {
      await logRef.update({ status: 'SIMULATED', text: mail.text });
      stats.simulated += 1;
      continue;
    }
    try {
      await deliver({ to: recipient.email, ...mail });
      await logRef.update({ status: 'SENT', sentAt: FieldValue.serverTimestamp() });
      stats.sent += 1;
    } catch (error) {
      logger.error(`Échec de l’envoi du résumé à ${recipient.email}`, error);
      await logRef.update({ status: 'FAILED', error: String(error.message).slice(0, 500) });
      stats.failed += 1;
    }
  }
  return stats;
}

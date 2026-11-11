// Cloud Functions : un e-mail à chaque membre pour chaque événement d'une tontine.
//
// Déclencheur : création d'un document dans tontines/{tontineId}/events (le journal, écrit par
// l'application dans le même lot que chaque action). L'envoi passe par un serveur SMTP
// (Brevo, Gmail, Mailjet…) configuré par paramètres : voir README, « E-mails ».
// Sans SMTP_HOST (émulateurs), les e-mails sont simulés : visibles dans la collection mailLog.
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import { buildEmail, selectRecipientIds } from './mail.js';
import { isGuestId } from '../../src/shared/constants/domain.js';

const FUNCTIONS_REGION = defineString('FUNCTIONS_REGION', {
  default: 'europe-west1',
  description: 'Région des fonctions (la même que la base Firestore).',
});
const APP_URL = defineString('APP_URL', {
  default: 'http://localhost:8081',
  description: 'Adresse publique de l’application, pour les liens des e-mails.',
});
const MAIL_FROM = defineString('MAIL_FROM', {
  default: 'Tontine Digitale <no-reply@example.com>',
  description: 'Expéditeur des e-mails.',
});
const SMTP_HOST = defineString('SMTP_HOST', { default: '', description: 'Serveur SMTP.' });
const SMTP_PORT = defineString('SMTP_PORT', { default: '587' });
const SMTP_USER = defineString('SMTP_USER', { default: '' });
const SMTP_PASS = defineSecret('SMTP_PASS');

setGlobalOptions({ region: FUNCTIONS_REGION, maxInstances: 10 });

initializeApp();
const db = getFirestore();

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(SMTP_PORT.value());
    transporter = nodemailer.createTransport({
      host: SMTP_HOST.value(),
      port,
      secure: port === 465,
      auth: SMTP_USER.value() ? { user: SMTP_USER.value(), pass: SMTP_PASS.value() } : undefined,
    });
  }
  return transporter;
}

/** Adresse et prénom d'un destinataire, ou null s'il ne veut / ne peut pas recevoir d'e-mail. */
async function resolveRecipient(tontineId, member) {
  if (isGuestId(member.userId)) {
    const contact = await db.doc(`tontines/${tontineId}/guestContacts/${member.userId}`).get();
    const email = contact.get('email');
    return email ? { email, name: member.displayName, isGuest: true } : null;
  }
  const user = await db.doc(`users/${member.userId}`).get();
  if (!user.exists || user.get('emailNotifications') === false || !user.get('email')) return null;
  return { email: user.get('email'), name: user.get('firstName'), isGuest: false };
}

export const emailMembersOnEvent = onDocumentCreated(
  { document: 'tontines/{tontineId}/events/{eventId}', secrets: [SMTP_PASS] },
  async ({ data, params }) => {
    if (!data) return;
    const { tontineId, eventId } = params;
    const event = data.data();

    const [tontineSnap, membersSnap] = await Promise.all([
      db.doc(`tontines/${tontineId}`).get(),
      db.collection(`tontines/${tontineId}/members`).get(),
    ]);
    if (!tontineSnap.exists) return;
    const tontine = { id: tontineId, ...tontineSnap.data() };
    const members = membersSnap.docs.map((d) => ({ ...d.data(), userId: d.id }));
    const byId = new Map(members.map((m) => [m.userId, m]));

    const simulate = !SMTP_HOST.value();
    const ids = selectRecipientIds(event, members);

    await Promise.all(
      ids.map(async (memberId) => {
        const member = byId.get(memberId);
        if (!member) return;
        // Une entrée par (événement, destinataire) : un déclencheur rejoué n'envoie pas deux fois.
        const logRef = db.doc(`mailLog/${eventId}_${memberId}`);
        const recipient = await resolveRecipient(tontineId, member);
        if (!recipient) return;

        const mail = buildEmail({
          event,
          tontine,
          recipientName: recipient.name,
          isGuest: recipient.isGuest,
          appUrl: APP_URL.value(),
        });
        try {
          await logRef.create({
            tontineId,
            eventId,
            eventType: event.type,
            to: recipient.email,
            subject: mail.subject,
            status: 'PENDING',
            createdAt: FieldValue.serverTimestamp(),
          });
        } catch (error) {
          if (error.code === 6) return; // ALREADY_EXISTS : déjà traité
          throw error;
        }

        if (simulate) {
          logger.info(`E-mail simulé pour ${recipient.email} : ${mail.subject}`);
          await logRef.update({ status: 'SIMULATED', text: mail.text });
          return;
        }
        try {
          await getTransporter().sendMail({
            from: MAIL_FROM.value(),
            to: recipient.email,
            subject: mail.subject,
            text: mail.text,
            html: mail.html,
          });
          await logRef.update({ status: 'SENT', sentAt: FieldValue.serverTimestamp() });
        } catch (error) {
          logger.error(`Échec de l’envoi à ${recipient.email}`, error);
          await logRef.update({ status: 'FAILED', error: String(error.message).slice(0, 500) });
        }
      }),
    );
  },
);

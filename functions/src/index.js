// Cloud Functions : résumé quotidien par e-mail de l'activité des tontines.
//
// Chaque soir, la fonction planifiée lit le journal (tontines/{id}/events) depuis l'envoi
// précédent et adresse à chaque membre un seul e-mail regroupant ses tontines (sans ses propres
// actions). Rien n'est envoyé à qui n'a rien de nouveau. L'envoi passe par un serveur SMTP
// (Brevo, Gmail, Mailjet…) configuré par paramètres : voir README, « E-mails ».
// Sans SMTP_HOST, les e-mails sont simulés : visibles dans la collection mailLog.
import { setGlobalOptions } from 'firebase-functions/v2';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { defineSecret, defineString } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import { runDigest } from './digest.js';
import { APP_TIME_ZONE } from '../../src/config/app.js';

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

setGlobalOptions({ region: FUNCTIONS_REGION, maxInstances: 1 });

initializeApp();
const db = getFirestore();
const DAY_MS = 24 * 60 * 60 * 1000;

function createDeliver() {
  if (!SMTP_HOST.value()) return null;
  const port = Number(SMTP_PORT.value());
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST.value(),
    port,
    secure: port === 465,
    auth: SMTP_USER.value() ? { user: SMTP_USER.value(), pass: SMTP_PASS.value() } : undefined,
  });
  return (mail) => transporter.sendMail({ from: MAIL_FROM.value(), ...mail });
}

export const sendDailyDigest = onSchedule(
  {
    schedule: 'every day 19:00',
    timeZone: APP_TIME_ZONE,
    secrets: [SMTP_PASS],
    timeoutSeconds: 540,
    retryCount: 1,
  },
  async () => {
    const stateRef = db.doc('digestState/daily');
    const until = new Date();
    // Reprend là où l'envoi précédent s'est arrêté (aucun événement oublié ni compté deux fois).
    const last = (await stateRef.get()).get('lastUntil');
    const since = last ? last.toDate() : new Date(until.getTime() - DAY_MS);
    const runKey = until.toISOString().slice(0, 10);

    const stats = await runDigest({
      db,
      since: Timestamp.fromDate(since),
      until: Timestamp.fromDate(until),
      runKey,
      appUrl: APP_URL.value(),
      deliver: createDeliver(),
      logger,
    });
    await stateRef.set({ lastUntil: Timestamp.fromDate(until), lastStats: stats });
    logger.info('Résumé quotidien envoyé', stats);
  },
);

import { describe, expect, it } from 'vitest';
import { buildEmail, escapeHtml, selectRecipientIds } from './mail.js';

const members = [
  { userId: 'owner', status: 'ACTIVE' },
  { userId: 'alice', status: 'ACTIVE' },
  { userId: 'guest_AbCdEfGhIjKlMnOpQrSt', status: 'ACTIVE' },
  { userId: 'bob', status: 'PENDING' },
  { userId: 'carl', status: 'LEFT' },
];

const tontine = { id: 't1', name: 'Tontine du marché' };

describe('selectRecipientIds', () => {
  it('prévient tous les membres actifs, avec ou sans compte, sauf l’auteur', () => {
    const event = { type: 'PAYMENT_DECLARED', actorId: 'alice', payload: {} };
    expect(selectRecipientIds(event, members)).toEqual(['owner', 'guest_AbCdEfGhIjKlMnOpQrSt']);
  });

  it('prévient aussi la personne refusée ou retirée', () => {
    const refused = { type: 'MEMBER_REFUSED', actorId: 'owner', payload: { memberId: 'bob' } };
    expect(selectRecipientIds(refused, members)).toContain('bob');
    const removed = { type: 'MEMBER_REMOVED', actorId: 'owner', payload: { memberId: 'carl' } };
    expect(selectRecipientIds(removed, members)).toContain('carl');
  });

  it('ne prévient pas les demandes en attente pour un événement ordinaire', () => {
    const event = { type: 'TONTINE_STARTED', actorId: 'owner', payload: {} };
    expect(selectRecipientIds(event, members)).not.toContain('bob');
  });
});

describe('buildEmail', () => {
  const event = {
    type: 'PAYMENT_DECLARED',
    actorName: 'Koffi',
    payload: { amount: 25000, method: 'WAVE', roundIndex: 2 },
  };

  it('reprend la phrase de l’historique et met un lien vers la tontine', () => {
    const mail = buildEmail({
      event,
      tontine,
      recipientName: 'Awa',
      isGuest: false,
      appUrl: 'https://app.example/',
    });
    expect(mail.subject).toBe('Tontine du marché · Paiement déclaré');
    expect(mail.text).toContain('Bonjour Awa,');
    expect(mail.text).toContain('Koffi a déclaré 25 000 FCFA (Wave) pour le tour n° 2.');
    expect(mail.text).toContain('https://app.example/tontines/t1?onglet=historique');
    expect(mail.html).toContain('Voir la tontine');
  });

  it('pas de lien pour un membre sans compte', () => {
    const mail = buildEmail({ event, tontine, recipientName: 'Awa', isGuest: true, appUrl: 'x' });
    expect(mail.text).not.toContain('Voir la tontine');
    expect(mail.html).not.toContain('Voir la tontine');
    expect(mail.text).toContain('l’organisateur');
  });

  it('échappe le HTML venant des utilisateurs', () => {
    const mail = buildEmail({
      event: { ...event, actorName: '<script>x</script>' },
      tontine: { ...tontine, name: 'A & B' },
      recipientName: 'Awa',
      isGuest: false,
      appUrl: 'x',
    });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('A &amp; B');
    expect(escapeHtml(`"'`)).toBe('&quot;&#39;');
  });
});

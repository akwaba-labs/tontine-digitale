import { describe, expect, it } from 'vitest';
import {
  MAX_EVENTS_PER_TONTINE,
  buildDigestEmail,
  escapeHtml,
  groupDigests,
  selectRecipientIds,
} from './mail.js';

const GUEST = 'guest_AbCdEfGhIjKlMnOpQrSt';
const members = [
  { userId: 'owner', displayName: 'Olivier', status: 'ACTIVE' },
  { userId: 'alice', displayName: 'Alice', status: 'ACTIVE' },
  { userId: GUEST, displayName: 'Awa', status: 'ACTIVE' },
  { userId: 'bob', displayName: 'Bob', status: 'PENDING' },
  { userId: 'carl', displayName: 'Carl', status: 'LEFT' },
];

const at = (iso) => new Date(iso);
const declared = (actorId, actorName, iso = '2026-11-11T09:14:00Z') => ({
  type: 'PAYMENT_DECLARED',
  actorId,
  actorName,
  payload: { amount: 25000, method: 'WAVE', roundIndex: 2 },
  createdAt: at(iso),
});

describe('selectRecipientIds', () => {
  it('tous les membres actifs, avec ou sans compte, sauf l’auteur', () => {
    expect(selectRecipientIds(declared('alice', 'Alice'), members)).toEqual(['owner', GUEST]);
  });

  it('prévient aussi la personne refusée ou retirée', () => {
    const refused = { type: 'MEMBER_REFUSED', actorId: 'owner', payload: { memberId: 'bob' } };
    expect(selectRecipientIds(refused, members)).toContain('bob');
    const removed = { type: 'MEMBER_REMOVED', actorId: 'owner', payload: { memberId: 'carl' } };
    expect(selectRecipientIds(removed, members)).toContain('carl');
  });
});

describe('groupDigests', () => {
  const t1 = { id: 't1', name: 'Tontine du marché' };
  const t2 = { id: 't2', name: 'Tontine du bureau' };

  it('un seul résumé par membre, qui regroupe ses tontines, sans ses propres actions', () => {
    const digests = groupDigests([
      { tontine: t1, members, events: [declared('alice', 'Alice'), declared('owner', 'Olivier')] },
      {
        tontine: t2,
        members: [members[0], members[1]],
        events: [declared('owner', 'Olivier')],
      },
    ]);
    const alice = digests.get('alice');
    expect(alice.map((s) => s.tontine.id)).toEqual(['t1', 't2']);
    expect(alice[0].events.map((e) => e.actorId)).toEqual(['owner']);
    expect(digests.get('owner').map((s) => s.tontine.id)).toEqual(['t1']);
    expect(digests.has('bob')).toBe(false);
  });

  it('personne n’est prévenu de ses seules actions', () => {
    const digests = groupDigests([
      { tontine: t1, members: [members[0]], events: [declared('owner', 'Olivier')] },
    ]);
    expect(digests.size).toBe(0);
  });
});

describe('buildDigestEmail', () => {
  const tontine = { id: 't1', name: 'Tontine du marché' };
  const date = at('2026-11-11T19:00:00Z');

  it('liste l’activité avec l’heure, la phrase de l’historique et un lien', () => {
    const mail = buildDigestEmail({
      sections: [{ tontine, events: [declared('alice', 'Koffi')] }],
      recipientName: 'Awa',
      isGuest: false,
      appUrl: 'https://app.example/',
      date,
    });
    expect(mail.subject).toBe('Tontine du marché · résumé du mercredi 11 novembre (1 nouveauté)');
    expect(mail.text).toContain('Bonjour Awa,');
    expect(mail.text).toContain('- 09:14 · Koffi a déclaré 25 000 FCFA (Wave) pour le tour n° 2.');
    expect(mail.text).toContain('https://app.example/tontines/t1?onglet=historique');
  });

  it('plusieurs tontines : objet général et une section par tontine', () => {
    const mail = buildDigestEmail({
      sections: [
        { tontine, events: [declared('a', 'A'), declared('b', 'B')] },
        { tontine: { id: 't2', name: 'Tontine du bureau' }, events: [declared('c', 'C')] },
      ],
      recipientName: 'Awa',
      isGuest: false,
      appUrl: 'x',
      date,
    });
    expect(mail.subject).toBe('Vos tontines · résumé du mercredi 11 novembre (3 nouveautés)');
    expect(mail.text).toContain('« Tontine du bureau »');
  });

  it('limite le nombre de lignes par tontine', () => {
    const events = Array.from({ length: MAX_EVENTS_PER_TONTINE + 3 }, () => declared('a', 'A'));
    const mail = buildDigestEmail({
      sections: [{ tontine, events }],
      recipientName: '',
      isGuest: false,
      appUrl: 'x',
      date,
    });
    expect(mail.text).toContain('… et 3 autres activités.');
  });

  it('pas de lien pour un membre sans compte', () => {
    const mail = buildDigestEmail({
      sections: [{ tontine, events: [declared('a', 'A')] }],
      recipientName: 'Awa',
      isGuest: true,
      appUrl: 'x',
      date,
    });
    expect(mail.text).not.toContain('Voir la tontine');
    expect(mail.html).not.toContain('Voir la tontine');
  });

  it('échappe le HTML venant des utilisateurs', () => {
    const mail = buildDigestEmail({
      sections: [{ tontine: { id: 't', name: 'A & B' }, events: [declared('a', '<script>')] }],
      recipientName: 'Awa',
      isGuest: false,
      appUrl: 'x',
      date,
    });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('A &amp; B');
    expect(escapeHtml(`"'`)).toBe('&quot;&#39;');
  });
});

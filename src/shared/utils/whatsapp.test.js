import { describe, expect, it } from 'vitest';
import { buildInviteMessage, buildReminderMessage, whatsappShareLink } from './whatsapp';

const tontine = {
  name: 'Tontine du bureau',
  amount: 25000,
  frequency: 'MONTHLY',
  totalShares: 10,
  inviteCode: 'ABCD23',
};

describe('WhatsApp', () => {
  it('encode le message dans le lien', () => {
    expect(whatsappShareLink('Salut & bienvenue')).toBe(
      'https://wa.me/?text=Salut%20%26%20bienvenue',
    );
  });

  it('prépare le message d’invitation', () => {
    const message = buildInviteMessage({ tontine, inviteUrl: 'https://app.test/rejoindre/ABCD23' });
    expect(message).toContain('« Tontine du bureau »');
    expect(message).toContain('25\u00A0000\u00A0FCFA (chaque mois)');
    expect(message).toContain('ABCD23');
    expect(message).toContain('https://app.test/rejoindre/ABCD23');
  });

  it('liste les retardataires dans la relance', () => {
    const message = buildReminderMessage({
      tontine,
      round: { index: 3, dueDate: '2026-11-05' },
      lateLines: [
        { member: { displayName: 'Awa Koné' }, due: 26000 },
        { member: { displayName: 'Yao Kouamé' }, due: 25000 },
      ],
      tontineUrl: 'https://app.test/tontines/x',
    });
    expect(message).toContain('tour n° 3 (échéance du 5 novembre 2026)');
    expect(message).toContain('• Awa Koné : 26\u00A0000\u00A0FCFA');
    expect(message).toContain('• Yao Kouamé');
  });
});

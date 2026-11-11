import { describe, expect, it } from 'vitest';
import { describeEvent } from './eventLabels';

const nbsp = (text) => text.replace(/\u00A0/g, ' ');

describe('describeEvent', () => {
  it('décrit une confirmation de paiement', () => {
    expect(
      nbsp(
        describeEvent({
          type: 'PAYMENT_CONFIRMED',
          actorName: 'Olivier',
          payload: { memberName: 'Awa', amount: 20000, roundIndex: 2 },
        }),
      ),
    ).toBe('Olivier a confirmé le paiement de Awa (20 000 FCFA, tour n° 2).');
  });

  it('décrit un tirage au sort', () => {
    expect(
      describeEvent({
        type: 'DRAW_PERFORMED',
        actorName: 'Olivier',
        payload: { order: ['Awa', 'Koffi'] },
      }),
    ).toBe('Olivier a effectué le tirage au sort : Awa, Koffi.');
  });

  it('décrit un versement du pot', () => {
    expect(
      nbsp(
        describeEvent({
          type: 'PAYOUT_SENT',
          actorName: 'Olivier',
          payload: { roundIndex: 1, amount: 100000, beneficiaryName: 'Awa', method: 'WAVE' },
        }),
      ),
    ).toBe('Olivier a versé le pot du tour n° 1 (100 000 FCFA) à Awa (Wave).');
  });

  it('reste lisible pour un type inconnu', () => {
    expect(describeEvent({ type: 'AUTRE', actorName: 'X', payload: {} })).toBe('X : AUTRE');
  });
});

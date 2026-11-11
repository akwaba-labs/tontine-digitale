import { describe, expect, it } from 'vitest';
import { tontineSchema } from './tontineSchema';

const valid = {
  name: 'Tontine du marché',
  description: '',
  amount: '25000',
  frequency: 'MONTHLY',
  depositsPerRound: '1',
  startDate: '2027-01-31',
  totalShares: '10',
  ownerShares: '1',
  graceDays: '3',
  penaltyAmount: '1000',
  orderMode: 'DRAW',
};

async function errorsOf(values) {
  try {
    await tontineSchema.validate(values, { abortEarly: false });
    return [];
  } catch (error) {
    return error.errors;
  }
}

describe('tontineSchema', () => {
  it('accepte une tontine valide et convertit les nombres', async () => {
    const result = await tontineSchema.validate(valid);
    expect(result.amount).toBe(25000);
    expect(result.totalShares).toBe(10);
  });

  it('refuse un montant à virgule ou trop petit', async () => {
    expect(await errorsOf({ ...valid, amount: '2500.5' })).toContain(
      'Cotisation : nombre entier sans virgule.',
    );
    expect(await errorsOf({ ...valid, amount: '50' })).toContain('Minimum 100 FCFA.');
  });

  it('refuse une date impossible et trop de parts pour l’organisateur', async () => {
    const errors = await errorsOf({ ...valid, startDate: '2027-02-30', ownerShares: '11' });
    expect(errors).toContain('Date invalide.');
    expect(errors).toContain('Plus que le nombre total de parts.');
  });
});

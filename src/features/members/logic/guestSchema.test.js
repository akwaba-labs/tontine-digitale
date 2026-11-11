import { describe, expect, it } from 'vitest';
import { guestSchema } from './guestSchema';

const valid = { displayName: 'Awa Koné', phone: '', email: '', shares: 1 };

describe('guestSchema', () => {
  it('accepte un nom seul', async () => {
    await expect(guestSchema(3).validate(valid)).resolves.toBeTruthy();
  });

  it('accepte un téléphone ivoirien et un e-mail', async () => {
    await expect(
      guestSchema(3).validate({ ...valid, phone: '07 07 07 07 07', email: 'awa@example.com' }),
    ).resolves.toBeTruthy();
  });

  it('refuse un nom vide, un mauvais numéro ou un mauvais e-mail', async () => {
    await expect(guestSchema(3).validate({ ...valid, displayName: ' ' })).rejects.toThrow();
    await expect(guestSchema(3).validate({ ...valid, phone: '12345' })).rejects.toThrow();
    await expect(guestSchema(3).validate({ ...valid, email: 'awa@' })).rejects.toThrow();
  });

  it('refuse plus de parts que disponibles', async () => {
    await expect(guestSchema(2).validate({ ...valid, shares: 3 })).rejects.toThrow(
      '2 part(s) disponible(s)',
    );
  });
});

import { describe, expect, it } from 'vitest';
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from './inviteCode';

describe('code d’invitation', () => {
  it('génère 6 caractères non ambigus', () => {
    for (let i = 0; i < 50; i += 1) {
      const code = generateInviteCode();
      expect(isValidInviteCode(code)).toBe(true);
      expect(code).not.toMatch(/[01OI]/);
    }
  });

  it('utilise le générateur fourni', () => {
    expect(generateInviteCode(() => [0, 1, 2, 3, 4, 31])).toBe('ABCDE9');
  });

  it('nettoie la saisie', () => {
    expect(normalizeInviteCode(' ab-cd 23 ')).toBe('ABCD23');
    expect(isValidInviteCode('ABCD2')).toBe(false);
    expect(isValidInviteCode('ABCD0O')).toBe(false);
  });
});

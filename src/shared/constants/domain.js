// Constantes métier partagées (valeurs stockées en base : ne pas renommer sans migration).

export const TONTINE_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

export const FREQUENCY = Object.freeze({
  WEEKLY: 'WEEKLY',
  BIWEEKLY: 'BIWEEKLY',
  MONTHLY: 'MONTHLY',
});

export const FREQUENCY_LABELS = Object.freeze({
  WEEKLY: 'Chaque semaine',
  BIWEEKLY: 'Toutes les deux semaines',
  MONTHLY: 'Chaque mois',
});

export const ORDER_MODE = Object.freeze({
  MANUAL: 'MANUAL',
  DRAW: 'DRAW',
});

export const MEMBER_ROLE = Object.freeze({
  ORGANIZER: 'ORGANIZER',
  CO_ORGANIZER: 'CO_ORGANIZER',
  MEMBER: 'MEMBER',
});

export const MEMBER_ROLE_LABELS = Object.freeze({
  ORGANIZER: 'Organisateur',
  CO_ORGANIZER: 'Co-organisateur',
  MEMBER: 'Membre',
});

// Membre sans compte, ajouté par l'organisateur : identifiant « guest_ » + 20 caractères.
export const GUEST_ID_PREFIX = 'guest_';

export function isGuestId(id) {
  return typeof id === 'string' && id.startsWith(GUEST_ID_PREFIX);
}

export const MEMBER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  REFUSED: 'REFUSED',
  LEFT: 'LEFT',
});

export const CONTRIBUTION_STATUS = Object.freeze({
  PENDING: 'PENDING',
  DECLARED: 'DECLARED',
  CONFIRMED: 'CONFIRMED',
  REJECTED: 'REJECTED',
  LATE: 'LATE',
});

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'Espèces',
  WAVE: 'Wave',
  ORANGE_MONEY: 'Orange Money',
  MTN_MOMO: 'MTN MoMo',
  MOOV_MONEY: 'Moov Money',
  BANK_TRANSFER: 'Virement',
});

export const PAYOUT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  SENT: 'SENT',
  RECEIVED: 'RECEIVED',
});

export const ROUND_STATE = Object.freeze({
  UPCOMING: 'UPCOMING',
  CURRENT: 'CURRENT',
  AWAITING_PAYOUT: 'AWAITING_PAYOUT',
  COMPLETED: 'COMPLETED',
});

export const EVENT_TYPES = Object.freeze({
  TONTINE_CREATED: 'TONTINE_CREATED',
  TONTINE_UPDATED: 'TONTINE_UPDATED',
  TONTINE_STARTED: 'TONTINE_STARTED',
  TONTINE_COMPLETED: 'TONTINE_COMPLETED',
  TONTINE_CANCELLED: 'TONTINE_CANCELLED',
  MEMBER_ACCEPTED: 'MEMBER_ACCEPTED',
  MEMBER_ADDED: 'MEMBER_ADDED',
  MEMBER_REFUSED: 'MEMBER_REFUSED',
  MEMBER_REMOVED: 'MEMBER_REMOVED',
  MEMBER_LEFT: 'MEMBER_LEFT',
  MEMBER_ROLE_CHANGED: 'MEMBER_ROLE_CHANGED',
  MEMBER_SHARES_CHANGED: 'MEMBER_SHARES_CHANGED',
  ORDER_SET: 'ORDER_SET',
  DRAW_PERFORMED: 'DRAW_PERFORMED',
  PAYMENT_DECLARED: 'PAYMENT_DECLARED',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_REJECTED: 'PAYMENT_REJECTED',
  PAYMENT_RECORDED: 'PAYMENT_RECORDED',
  PENALTY_APPLIED: 'PENALTY_APPLIED',
  PAYOUT_SENT: 'PAYOUT_SENT',
  PAYOUT_RECEIVED: 'PAYOUT_RECEIVED',
});

export const NOTIFICATION_TYPES = Object.freeze({
  JOIN_REQUEST: 'JOIN_REQUEST',
  JOIN_ACCEPTED: 'JOIN_ACCEPTED',
  JOIN_REFUSED: 'JOIN_REFUSED',
  TONTINE_STARTED: 'TONTINE_STARTED',
  PAYMENT_TO_CONFIRM: 'PAYMENT_TO_CONFIRM',
  PAYMENT_CONFIRMED: 'PAYMENT_CONFIRMED',
  PAYMENT_REJECTED: 'PAYMENT_REJECTED',
  PENALTY_APPLIED: 'PENALTY_APPLIED',
  PAYOUT_SENT: 'PAYOUT_SENT',
  PAYOUT_RECEIVED: 'PAYOUT_RECEIVED',
  // Rappels calculés dans l'application (pas stockés) :
  YOUR_TURN: 'YOUR_TURN',
  DUE_SOON: 'DUE_SOON',
});

// Limites, identiques à celles vérifiées par firestore.rules.
export const LIMITS = Object.freeze({
  minAmount: 100,
  maxAmount: 100_000_000,
  minShares: 2,
  maxShares: 60,
  maxSharesPerMember: 10,
  maxGraceDays: 30,
  maxProofSizeBytes: 2 * 1024 * 1024,
});

import {
  EVENT_TYPES,
  FREQUENCY_LABELS,
  MEMBER_ROLE_LABELS,
  PAYMENT_METHODS,
} from '../../../shared/constants/domain';
import { formatAmount } from '../../../shared/utils/formatAmount';

const amount = (value) => (Number.isSafeInteger(value) ? formatAmount(value) : '');
const method = (value) => (value ? ` (${PAYMENT_METHODS[value] ?? value})` : '');

/** Phrase lisible décrivant une entrée du journal. */
export function describeEvent(event) {
  const p = event.payload ?? {};
  const actor = event.actorName;
  switch (event.type) {
    case EVENT_TYPES.TONTINE_CREATED:
      return `${actor} a créé la tontine : ${amount(p.amount)} ${FREQUENCY_LABELS[p.frequency]?.toLowerCase() ?? ''}, ${p.totalShares} tours.`;
    case EVENT_TYPES.TONTINE_UPDATED:
      return `${actor} a modifié les paramètres de la tontine.`;
    case EVENT_TYPES.TONTINE_STARTED:
      return `${actor} a démarré la tontine.`;
    case EVENT_TYPES.TONTINE_COMPLETED:
      return `${actor} a clôturé la tontine : tous les tours sont terminés.`;
    case EVENT_TYPES.TONTINE_CANCELLED:
      return `${actor} a annulé la tontine${p.reason ? ` : ${p.reason}` : '.'}`;
    case EVENT_TYPES.MEMBER_ACCEPTED:
      return `${actor} a accepté ${p.memberName} (${p.shares} part${p.shares > 1 ? 's' : ''}).`;
    case EVENT_TYPES.MEMBER_ADDED:
      return `${actor} a ajouté ${p.memberName} (${p.shares} part${p.shares > 1 ? 's' : ''}, sans compte).`;
    case EVENT_TYPES.MEMBER_REFUSED:
      return `${actor} a refusé la demande de ${p.memberName}.`;
    case EVENT_TYPES.MEMBER_REMOVED:
      return `${actor} a retiré ${p.memberName} de la tontine.`;
    case EVENT_TYPES.MEMBER_LEFT:
      return `${actor} a quitté la tontine.`;
    case EVENT_TYPES.MEMBER_ROLE_CHANGED:
      return `${actor} a nommé ${p.memberName} : ${MEMBER_ROLE_LABELS[p.role]?.toLowerCase() ?? p.role}.`;
    case EVENT_TYPES.MEMBER_SHARES_CHANGED:
      return `${actor} a fixé ${p.shares} part${p.shares > 1 ? 's' : ''} pour ${p.memberName}.`;
    case EVENT_TYPES.ORDER_SET:
      return `${actor} a fixé l’ordre de passage : ${(p.order ?? []).join(', ')}.`;
    case EVENT_TYPES.DRAW_PERFORMED:
      return `${actor} a effectué le tirage au sort : ${(p.order ?? []).join(', ')}.`;
    case EVENT_TYPES.PAYMENT_DECLARED:
      return `${actor} a déclaré ${amount(p.amount)}${method(p.method)} pour le tour n° ${p.roundIndex}.`;
    case EVENT_TYPES.PAYMENT_CONFIRMED:
      return `${actor} a confirmé le paiement de ${p.memberName} (${amount(p.amount)}, tour n° ${p.roundIndex}).`;
    case EVENT_TYPES.PAYMENT_REJECTED:
      return `${actor} a rejeté le paiement de ${p.memberName} (tour n° ${p.roundIndex}) : ${p.reason}`;
    case EVENT_TYPES.PAYMENT_RECORDED:
      return `${actor} a enregistré le paiement de ${p.memberName}${method(p.method)} : ${amount(p.amount)}, tour n° ${p.roundIndex}.`;
    case EVENT_TYPES.PENALTY_APPLIED:
      return `${actor} a appliqué une pénalité de ${amount(p.amount)} à ${p.memberName} (tour n° ${p.roundIndex}).`;
    case EVENT_TYPES.PAYOUT_SENT:
      return `${actor} a versé le pot du tour n° ${p.roundIndex} (${amount(p.amount)}) à ${p.beneficiaryName}${method(p.method)}.`;
    case EVENT_TYPES.PAYOUT_RECEIVED:
      if (p.onBehalfOf) {
        return `${actor} a confirmé avoir remis le pot du tour n° ${p.roundIndex} (${amount(p.amount)}) à ${p.onBehalfOf}.`;
      }
      return `${actor} a confirmé avoir reçu le pot du tour n° ${p.roundIndex} (${amount(p.amount)}).`;
    default:
      return `${actor} : ${event.type}`;
  }
}

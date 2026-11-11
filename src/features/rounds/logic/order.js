import { activeMembers } from '../../contributions/logic/contributions';
import { sumShares } from './schedule';

/**
 * Vérifie qu'une tontine est prête : parts complètes et ordre de passage cohérent.
 * Renvoie la liste des problèmes (vide si tout est prêt).
 */
export function getStartBlockers(tontine, members) {
  const problems = [];
  const active = activeMembers(members);
  const shares = sumShares(active);

  if (shares < tontine.totalShares) {
    problems.push(
      `Il manque ${tontine.totalShares - shares} part(s) : ${shares} sur ${tontine.totalShares} sont attribuées.`,
    );
  } else if (shares > tontine.totalShares) {
    problems.push(
      `Trop de parts attribuées : ${shares} pour ${tontine.totalShares} tours. Réduisez les parts d’un membre.`,
    );
  }

  if (members.some((member) => member.status === 'PENDING')) {
    problems.push('Des demandes d’adhésion attendent votre réponse.');
  }

  const orderProblem = validatePayoutOrder(tontine.payoutOrder ?? [], active, tontine.totalShares);
  if (orderProblem) problems.push(orderProblem);

  return problems;
}

/** L'ordre doit contenir exactement les parts de chaque membre actif. */
export function validatePayoutOrder(order, active, totalShares) {
  if (order.length === 0) return 'L’ordre de passage n’est pas encore fixé.';
  if (order.length !== totalShares) {
    return `L’ordre de passage contient ${order.length} tour(s) au lieu de ${totalShares}.`;
  }
  const expected = new Map(active.map((member) => [member.userId, member.shares]));
  const counted = new Map();
  for (const slot of order) {
    counted.set(slot.memberId, (counted.get(slot.memberId) ?? 0) + 1);
  }
  const consistent =
    expected.size === counted.size &&
    [...expected].every(([userId, shares]) => counted.get(userId) === shares);
  return consistent ? null : 'L’ordre de passage ne correspond plus aux membres : refaites-le.';
}

/** Déplace un tour d'une position (ordre manuel). */
export function moveSlot(order, fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= order.length) return order;
  const result = [...order];
  const [slot] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, slot);
  return result;
}

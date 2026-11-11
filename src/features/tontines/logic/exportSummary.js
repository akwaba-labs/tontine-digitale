import { PAYMENT_METHODS } from '../../../shared/constants/domain';
import { getStatusDisplay } from '../../../shared/utils/statusLabels';
import {
  activeMembers,
  contributionId,
  getEffectiveStatus,
  summarizeMember,
} from '../../contributions/logic/contributions';

/** Bilan par membre : parts, versé, pénalités, reçu, retards. */
export function buildMemberRows({
  tontine,
  members,
  rounds,
  deposits,
  contributionsById,
  currentDepositIndex,
  today,
}) {
  return activeMembers(members).map((member) => {
    const summary = summarizeMember({
      userId: member.userId,
      tontine,
      member,
      rounds,
      deposits,
      contributionsById,
      currentDepositIndex,
      today,
    });
    return {
      name: member.displayName,
      phone: member.phone,
      shares: member.shares,
      paid: summary.totalPaid,
      penalties: summary.totalPenalties,
      received: summary.totalReceived,
      lateCount: summary.lateCount,
      turns: summary.myRounds.map((round) => round.index).join(', '),
    };
  });
}

/** Détail des cotisations des dépôts déjà arrivés (jusqu'au dépôt en cours). */
export function buildContributionRows({
  tontine,
  members,
  deposits,
  contributionsById,
  currentDepositIndex,
  today,
}) {
  const rows = [];
  for (const deposit of deposits) {
    if (currentDepositIndex !== null && deposit.index > currentDepositIndex) break;
    for (const member of activeMembers(members)) {
      const contribution =
        contributionsById.get(contributionId(deposit.index, member.userId)) ?? null;
      const status = getEffectiveStatus(contribution, deposit, tontine.graceDays, today);
      rows.push({
        round: deposit.roundIndex,
        dueDate: deposit.dueDate,
        name: member.displayName,
        amount: tontine.amount * member.shares,
        penalty: contribution?.penaltyAmount ?? 0,
        status: getStatusDisplay(status).label,
        method: contribution?.method ? PAYMENT_METHODS[contribution.method] : '',
        reference: contribution?.reference ?? '',
      });
    }
  }
  return rows;
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV compatible Excel en français : séparateur « ; » et BOM UTF-8 pour les accents. */
export function toCsv(columns, rows) {
  const header = columns.map((column) => escapeCsv(column.label)).join(';');
  const lines = rows.map((row) => columns.map((column) => escapeCsv(row[column.key])).join(';'));
  return `\uFEFF${[header, ...lines].join('\r\n')}\r\n`;
}

export const MEMBER_COLUMNS = [
  { key: 'name', label: 'Membre' },
  { key: 'phone', label: 'Téléphone' },
  { key: 'shares', label: 'Parts' },
  { key: 'turns', label: 'Tours de réception' },
  { key: 'paid', label: 'Total versé (FCFA)' },
  { key: 'penalties', label: 'Pénalités (FCFA)' },
  { key: 'received', label: 'Total reçu (FCFA)' },
  { key: 'lateCount', label: 'Retards' },
];

export const CONTRIBUTION_COLUMNS = [
  { key: 'round', label: 'Tour' },
  { key: 'dueDate', label: 'Échéance' },
  { key: 'name', label: 'Membre' },
  { key: 'amount', label: 'Montant (FCFA)' },
  { key: 'penalty', label: 'Pénalité (FCFA)' },
  { key: 'status', label: 'Statut' },
  { key: 'method', label: 'Moyen' },
  { key: 'reference', label: 'Référence' },
];

export function exportFileName(tontine, extension) {
  const slug = tontine.name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `tontine-${slug || 'export'}.${extension}`;
}

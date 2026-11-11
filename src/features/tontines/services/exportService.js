import { APP_NAME } from '../../../config/app';
import { FREQUENCY_LABELS } from '../../../shared/constants/domain';
import { formatAmount } from '../../../shared/utils/formatAmount';
import { formatDate, formatDateTime } from '../../../shared/utils/formatDate';
import { getStatusDisplay } from '../../../shared/utils/statusLabels';
import { describeEvent } from '../logic/eventLabels';
import {
  CONTRIBUTION_COLUMNS,
  MEMBER_COLUMNS,
  buildContributionRows,
  buildMemberRows,
  exportFileName,
  toCsv,
} from '../logic/exportSummary';
import { fetchAllEvents } from './eventService';

function download(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCsv(detail) {
  const memberCsv = toCsv(MEMBER_COLUMNS, buildMemberRows(detail));
  const contributionCsv = toCsv(CONTRIBUTION_COLUMNS, buildContributionRows(detail)).replace(
    /^\uFEFF/,
    '',
  );
  const content = `${memberCsv}\r\n${contributionCsv}`;
  download(
    new Blob([content], { type: 'text/csv;charset=utf-8' }),
    exportFileName(detail.tontine, 'csv'),
  );
}

/** Récapitulatif PDF : règles, bilan par membre, cotisations, journal. Chargé à la demande. */
export async function exportPdf(detail) {
  const [{ jsPDF }, { autoTable }, events] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    fetchAllEvents(detail.tontine.id),
  ]);
  const { tontine } = detail;
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const green = [30, 123, 79];

  pdf.setFontSize(18);
  pdf.setTextColor(...green);
  pdf.text(tontine.name, 40, 50);
  pdf.setFontSize(10);
  pdf.setTextColor(80);
  pdf.text(
    [
      `Statut : ${getStatusDisplay(tontine.status, 'tontine').label} · Organisateur : ${tontine.ownerName}`,
      `Cotisation : ${formatAmount(tontine.amount)} par part · ${FREQUENCY_LABELS[tontine.frequency]} · ${tontine.totalShares} tours à partir du ${formatDate(tontine.startDate)}`,
      `Délai de grâce : ${tontine.graceDays} jour(s) · Pénalité : ${tontine.penaltyAmount ? formatAmount(tontine.penaltyAmount) : 'aucune'}`,
      `Édité le ${formatDateTime(new Date())} avec ${APP_NAME}`,
    ],
    40,
    70,
  );

  const table = (title, head, body, startY) => {
    pdf.setFontSize(12);
    pdf.setTextColor(...green);
    pdf.text(title, 40, startY);
    autoTable(pdf, {
      head: [head],
      body,
      startY: startY + 8,
      styles: { fontSize: 8 },
      headStyles: { fillColor: green },
      margin: { left: 40, right: 40 },
    });
    return pdf.lastAutoTable.finalY + 28;
  };

  let y = table(
    'Bilan par membre',
    ['Membre', 'Parts', 'Tours', 'Versé', 'Pénalités', 'Reçu', 'Retards'],
    buildMemberRows(detail).map((r) => [
      r.name,
      r.shares,
      r.turns,
      formatAmount(r.paid),
      formatAmount(r.penalties),
      formatAmount(r.received),
      r.lateCount,
    ]),
    130,
  );
  y = table(
    'Calendrier des tours',
    ['Tour', 'Échéance', 'Bénéficiaire', 'Pot', 'Versement'],
    detail.rounds.map((round) => [
      round.index,
      formatDate(round.dueDate),
      round.beneficiaryName,
      formatAmount(round.potAmount),
      getStatusDisplay(round.payoutStatus, 'payout').label,
    ]),
    y,
  );
  y = table(
    'Cotisations',
    ['Tour', 'Membre', 'Montant', 'Pénalité', 'Statut', 'Moyen', 'Référence'],
    buildContributionRows(detail).map((r) => [
      r.round,
      r.name,
      formatAmount(r.amount),
      r.penalty ? formatAmount(r.penalty) : '',
      r.status,
      r.method,
      r.reference,
    ]),
    y,
  );
  table(
    'Journal des opérations',
    ['Date', 'Opération'],
    events.map((event) => [
      event.createdAt ? formatDateTime(event.createdAt) : '',
      describeEvent(event),
    ]),
    y,
  );

  pdf.save(exportFileName(tontine, 'pdf'));
}

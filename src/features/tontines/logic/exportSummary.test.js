import { describe, expect, it } from 'vitest';
import { indexContributions } from '../../contributions/logic/contributions';
import { buildDeposits } from '../../rounds/logic/schedule';
import {
  MEMBER_COLUMNS,
  buildContributionRows,
  buildMemberRows,
  exportFileName,
  toCsv,
} from './exportSummary';

const detail = {
  tontine: {
    name: 'Tontine du Marché',
    amount: 10000,
    graceDays: 0,
    penaltyAmount: 500,
    totalShares: 2,
  },
  members: [
    { userId: 'awa', displayName: 'Awa', phone: '+2250707070707', shares: 1, status: 'ACTIVE' },
    { userId: 'yao', displayName: 'Yao; "le grand"', phone: '', shares: 1, status: 'ACTIVE' },
  ],
  rounds: [
    {
      index: 1,
      dueDate: '2026-10-01',
      beneficiaryId: 'awa',
      potAmount: 20000,
      payoutStatus: 'RECEIVED',
    },
    {
      index: 2,
      dueDate: '2026-11-01',
      beneficiaryId: 'yao',
      potAmount: 20000,
      payoutStatus: 'PENDING',
    },
  ],
  contributionsById: indexContributions([
    {
      roundIndex: 1,
      memberId: 'awa',
      status: 'CONFIRMED',
      penaltyAmount: 0,
      method: 'WAVE',
      reference: 'W1',
    },
    {
      roundIndex: 1,
      memberId: 'yao',
      status: 'CONFIRMED',
      penaltyAmount: 500,
      method: 'CASH',
      reference: '',
    },
  ]),
  currentDepositIndex: 2,
  today: '2026-11-10',
};
detail.deposits = buildDeposits(detail.rounds);

describe('export', () => {
  it('construit le bilan par membre', () => {
    const rows = buildMemberRows(detail);
    expect(rows[0]).toMatchObject({
      name: 'Awa',
      paid: 10000,
      received: 20000,
      lateCount: 1,
      turns: '1',
    });
    expect(rows[1]).toMatchObject({ paid: 10500, penalties: 500, received: 0 });
  });

  it('construit le détail des cotisations', () => {
    const rows = buildContributionRows(detail);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({ round: 1, status: 'Confirmé', method: 'Wave' });
    expect(rows[3]).toMatchObject({ round: 2, name: 'Yao; "le grand"', status: 'En retard' });
  });

  it('produit un CSV pour Excel (BOM, « ; », échappement)', () => {
    const csv = toCsv(MEMBER_COLUMNS.slice(0, 2), [{ name: 'Yao; "le grand"', phone: '+225' }]);
    expect(csv.startsWith('\uFEFFMembre;Téléphone\r\n')).toBe(true);
    expect(csv).toContain('"Yao; ""le grand""";+225');
  });

  it('donne un nom de fichier sans accents', () => {
    expect(exportFileName(detail.tontine, 'pdf')).toBe('tontine-tontine-du-marche.pdf');
  });
});

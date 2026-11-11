import { useState } from 'react';
import { Form, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import StatusBadge from '../../../shared/components/StatusBadge';
import { APP_NAME } from '../../../config/app';
import { formatDate } from '../../../shared/utils/formatDate';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { FREQUENCY_LABELS, TONTINE_STATUS } from '../../../shared/constants/domain';
import { adminTontinePath } from '../../../app/routePaths';
import { payoutRhythmLabel, potAmountOf } from '../../rounds/logic/schedule';
import { listAllTontines } from '../services/adminService';
import { useAdminQuery } from '../components/useAdminQuery';

const FILTERS = [
  { key: 'all', label: 'Toutes' },
  { key: TONTINE_STATUS.ACTIVE, label: 'En cours' },
  { key: TONTINE_STATUS.DRAFT, label: 'En préparation' },
  { key: TONTINE_STATUS.COMPLETED, label: 'Terminées' },
  { key: TONTINE_STATUS.CANCELLED, label: 'Annulées' },
];

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export default function AdminTontinesPage() {
  const navigate = useNavigate();
  const { data: tontines, isLoading, error } = useAdminQuery(() => listAllTontines());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  if (isLoading) return <Loader />;
  if (error) return <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />;

  const term = normalize(search.trim());
  const visible = tontines
    .filter((t) => filter === 'all' || t.status === filter)
    .filter((t) => !term || normalize(`${t.name} ${t.ownerName} ${t.inviteCode}`).includes(term));

  return (
    <>
      <title>{`Tontines · Back-office · ${APP_NAME}`}</title>
      <div className="page-intro">
        <div>
          <h1>Tontines</h1>
          <div className="page-intro__sub">{tontines.length} tontine(s) sur la plateforme</div>
        </div>
        <div className="search-field" style={{ minWidth: '18rem' }}>
          <Search size={18} aria-hidden="true" />
          <Form.Control
            type="search"
            placeholder="Nom, organisateur ou code"
            aria-label="Rechercher une tontine"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="filter-pills mb-3" role="group" aria-label="Filtrer par statut">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`filter-pill ${filter === f.key ? 'is-active' : ''}`}
            aria-pressed={filter === f.key}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="count">
              {f.key === 'all'
                ? tontines.length
                : tontines.filter((t) => t.status === f.key).length}
            </span>
          </button>
        ))}
      </div>
      <div className="panel p-0 overflow-hidden">
        <Table responsive hover className="admin-table mb-0">
          <thead>
            <tr>
              <th>Tontine</th>
              <th>Statut</th>
              <th>Dépôt</th>
              <th>Pot</th>
              <th>Membres</th>
              <th>Créée le</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr
                key={t.id}
                className="cursor-pointer"
                onClick={() => navigate(adminTontinePath(t.id))}
              >
                <td>
                  <div className="fw-semibold">{t.name}</div>
                  <div className="small text-secondary">
                    {t.ownerName} · code {t.inviteCode}
                  </div>
                </td>
                <td>
                  <StatusBadge kind="tontine" status={t.status} />
                </td>
                <td className="text-nowrap">
                  <AmountDisplay amount={t.amount} />
                  <div className="small text-secondary">{FREQUENCY_LABELS[t.frequency]}</div>
                </td>
                <td className="text-nowrap">
                  <AmountDisplay amount={potAmountOf(t)} />
                  <div className="small text-secondary">{payoutRhythmLabel(t)}</div>
                </td>
                <td>
                  {t.memberIds.length} membre{t.memberIds.length > 1 ? 's' : ''}
                  <div className="small text-secondary">{t.totalShares} tours</div>
                </td>
                <td className="text-nowrap">{t.createdAt ? formatDate(t.createdAt) : '—'}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-secondary py-4">
                  Aucune tontine ne correspond.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </>
  );
}

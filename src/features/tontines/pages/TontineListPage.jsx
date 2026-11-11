import { useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import { Hourglass, Plus, Search, Ticket, Users } from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import { APP_NAME } from '../../../config/app';
import { useAuth, useActor } from '../../../shared/hooks/useAuth';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { MEMBER_STATUS, PAYOUT_STATUS, TONTINE_STATUS } from '../../../shared/constants/domain';
import { ROUTES } from '../../../app/routePaths';
import { useMyTontines } from '../hooks/useMyTontines';
import { useMyMemberships } from '../../members/hooks/useMyMemberships';
import { cancelJoinRequest } from '../../members/services/memberService';
import { useTontineBundles } from '../../dashboard/hooks/useTontineBundles';
import TontineCard from '../components/TontineCard';

const FILTERS = [
  { key: 'all', label: 'Toutes', statuses: null },
  { key: 'active', label: 'En cours', statuses: [TONTINE_STATUS.ACTIVE] },
  { key: 'draft', label: 'En préparation', statuses: [TONTINE_STATUS.DRAFT] },
  {
    key: 'closed',
    label: 'Terminées',
    statuses: [TONTINE_STATUS.COMPLETED, TONTINE_STATUS.CANCELLED],
  },
  { key: 'mine', label: 'J’organise', statuses: null, mine: true },
];

function normalize(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function PendingRequests() {
  const { data: memberships } = useMyMemberships();
  const actor = useActor();
  const { run, isRunning } = useAsyncAction();
  const pending = (memberships ?? []).filter((m) => m.status === MEMBER_STATUS.PENDING);
  if (pending.length === 0) return null;

  return (
    <section className="panel mb-4">
      <div className="panel__head">
        <h2 className="panel__title">Mes demandes en attente</h2>
        <span className="panel__count">{pending.length}</span>
      </div>
      {pending.map((membership) => (
        <div key={membership.tontineId} className="org-row">
          <span className="icon-bubble icon-bubble--warning">
            <Hourglass size={18} aria-hidden="true" />
          </span>
          <div className="flex-grow-1 min-w-0">
            <div className="fw-semibold text-truncate">{membership.tontineName ?? 'Tontine'}</div>
            <div className="small text-secondary">
              {membership.shares} part{membership.shares > 1 ? 's' : ''} · l’organisateur doit
              accepter votre demande
            </div>
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={isRunning}
            onClick={() =>
              run(() => cancelJoinRequest(membership.tontineId, actor.uid), {
                success: 'Demande annulée.',
              })
            }
          >
            Annuler
          </Button>
        </div>
      ))}
    </section>
  );
}

export default function TontineListPage() {
  const { user } = useAuth();
  const { data: tontines, isLoading, error } = useMyTontines();
  const { bundles } = useTontineBundles(tontines);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const all = tontines ?? [];
  const matches = (f, t) =>
    f.mine ? t.ownerId === user.uid : !f.statuses || f.statuses.includes(t.status);
  const current = FILTERS.find((f) => f.key === filter);
  const visible = all
    .filter((t) => matches(current, t))
    .filter((t) => !search.trim() || normalize(t.name).includes(normalize(search.trim())));

  const progressOf = (tontine) => {
    const rounds = bundles[tontine.id]?.rounds;
    if (!rounds) return null;
    return {
      completed: rounds.filter((r) => r.payoutStatus === PAYOUT_STATUS.RECEIVED).length,
      total: rounds.length,
    };
  };

  return (
    <>
      <title>{`Mes tontines · ${APP_NAME}`}</title>
      <div className="page-intro">
        <div>
          <h1>Mes tontines</h1>
          <div className="page-intro__sub">
            {all.length} tontine{all.length > 1 ? 's' : ''} ·{' '}
            {all.filter((t) => t.ownerId === user.uid).length} organisée(s) par vous
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link to={ROUTES.join} className="btn btn-outline-primary">
            <Ticket size={18} className="me-1" aria-hidden="true" />
            Rejoindre
          </Link>
          <Link to={ROUTES.createTontine} className="btn btn-primary">
            <Plus size={18} className="me-1" aria-hidden="true" />
            Créer
          </Link>
        </div>
      </div>

      <PendingRequests />
      {isLoading && <Loader />}
      {error && <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />}

      {tontines && all.length === 0 && (
        <EmptyState
          icon={Users}
          title="Vous ne participez à aucune tontine"
          message="Créez votre tontine ou rejoignez celle de votre groupe avec le code d’invitation reçu."
          action={{ label: 'Créer une tontine', to: ROUTES.createTontine }}
        />
      )}

      {all.length > 0 && (
        <>
          <Row className="g-3 align-items-center mb-4">
            <Col lg={8}>
              <div className="filter-pills" role="group" aria-label="Filtrer les tontines">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`filter-pill ${filter === f.key ? 'is-active' : ''}`}
                    aria-pressed={filter === f.key}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                    <span className="count">{all.filter((t) => matches(f, t)).length}</span>
                  </button>
                ))}
              </div>
            </Col>
            <Col lg={4}>
              <div className="search-field">
                <Search size={18} aria-hidden="true" />
                <Form.Control
                  type="search"
                  placeholder="Rechercher une tontine"
                  aria-label="Rechercher une tontine"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </Col>
          </Row>

          {visible.length === 0 ? (
            <p className="text-secondary">Aucune tontine ne correspond.</p>
          ) : (
            <Row xs={1} md={2} xl={3} className="g-3">
              {visible.map((tontine) => (
                <Col key={tontine.id}>
                  <TontineCard tontine={tontine} uid={user.uid} progress={progressOf(tontine)} />
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
    </>
  );
}

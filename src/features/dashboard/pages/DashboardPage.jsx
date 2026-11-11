import { Col, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Gift,
  Layers,
  Plus,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import StatusBadge from '../../../shared/components/StatusBadge';
import StatTile from '../../../shared/components/StatTile';
import SpaceSwitch from '../../../shared/components/SpaceSwitch';
import { APP_NAME } from '../../../config/app';
import { useAuth } from '../../../shared/hooks/useAuth';
import { diffInDays, todayIso } from '../../../shared/utils/dates';
import { formatDate, formatDayAndMonth } from '../../../shared/utils/formatDate';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { TONTINE_STATUS } from '../../../shared/constants/domain';
import { ROUTES, declarePaymentPath, tontineTabPath } from '../../../app/routePaths';
import { useMyTontines } from '../../tontines/hooks/useMyTontines';
import TontineCard from '../../tontines/components/TontineCard';
import { depositLabel } from '../../rounds/logic/schedule';
import { useOrganizerOverview } from '../../organizer/hooks/useOrganizerOverview';
import { useTontineBundles } from '../hooks/useTontineBundles';
import { buildTodos, buildTotals } from '../logic/todos';
import { buildMemberAgenda } from '../logic/agenda';
import TodoList from '../components/TodoList';

function whenLabel(date, today) {
  const days = diffInDays(today, date);
  if (days < 0) return `en retard de ${-days} jour${days < -1 ? 's' : ''}`;
  if (days === 0) return 'aujourd’hui';
  if (days === 1) return 'demain';
  return `dans ${days} jours`;
}

/** Bandeau du haut : la prochaine chose à payer et le prochain pot à recevoir. */
function Hero({ firstName, agenda, today }) {
  const { nextDeposit, nextPayout } = agenda;
  return (
    <section className="dash-hero">
      <div className="dash-hero__main">
        <div className="dash-hero__date">{formatDayAndMonth(today)}</div>
        <h1 className="dash-hero__title">Bonjour {firstName} !</h1>
        {nextDeposit ? (
          <p className="dash-hero__text">
            Prochain dépôt :{' '}
            <strong>
              <AmountDisplay amount={nextDeposit.amount} />
            </strong>{' '}
            pour « {nextDeposit.tontine.name} », {whenLabel(nextDeposit.date, today)}.
          </p>
        ) : (
          <p className="dash-hero__text">Vous êtes à jour de toutes vos cotisations.</p>
        )}
        {nextDeposit && (
          <Link
            to={declarePaymentPath(nextDeposit.tontine.id, nextDeposit.deposit.index)}
            className="btn btn-warning btn-stamp"
          >
            Déclarer mon dépôt <ArrowRight size={18} className="ms-1" aria-hidden="true" />
          </Link>
        )}
      </div>
      {nextPayout && (
        <Link
          to={tontineTabPath(nextPayout.tontine.id, 'tours')}
          className="dash-hero__payout text-decoration-none"
        >
          <Gift size={22} aria-hidden="true" />
          <span className="dash-hero__payout-label">Mon prochain pot</span>
          <strong className="dash-hero__payout-amount">
            <AmountDisplay amount={nextPayout.amount} />
          </strong>
          <span>
            le {formatDate(nextPayout.date)} · {nextPayout.tontine.name}
          </span>
        </Link>
      )}
    </section>
  );
}

/** Chronologie des prochaines échéances (dépôts et pots), toutes tontines confondues. */
function Agenda({ events, today }) {
  if (events.length === 0) {
    return <p className="text-secondary mb-0">Aucune échéance à venir.</p>;
  }
  return (
    <ol className="agenda">
      {events.slice(0, 6).map((event) => (
        <li key={event.key} className={`agenda__item agenda__item--${event.kind}`}>
          <span className="agenda__dot" aria-hidden="true" />
          <div className="agenda__date">
            {formatDate(event.date)} · {whenLabel(event.date, today)}
          </div>
          <div className="d-flex justify-content-between align-items-center gap-2">
            <div className="min-w-0">
              <div className="fw-semibold text-truncate">
                {event.kind === 'deposit' ? 'Dépôt à faire' : 'Je reçois le pot'}
              </div>
              <div className="small text-secondary text-truncate">
                {event.tontine.name}
                {event.kind === 'deposit' ? ` · ${depositLabel(event.deposit)}` : ''}
              </div>
            </div>
            <div className="text-end flex-shrink-0">
              <AmountDisplay
                amount={event.amount}
                className={`fw-bold ${event.kind === 'payout' ? 'text-primary' : ''}`}
              />
              {event.kind === 'deposit' && event.status !== 'PENDING' && (
                <div>
                  <StatusBadge status={event.status} />
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { data: tontines, isLoading, error } = useMyTontines();
  const { bundles } = useTontineBundles(tontines);
  const { pendingActions } = useOrganizerOverview();
  const today = todayIso();

  if (isLoading) return <Loader />;
  if (error) return <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />;

  const firstName = profile?.firstName ?? '';
  const current = tontines.filter((t) =>
    [TONTINE_STATUS.ACTIVE, TONTINE_STATUS.DRAFT].includes(t.status),
  );
  const todos = current.flatMap((tontine) =>
    buildTodos({ uid: user.uid, tontine, bundle: bundles[tontine.id], today }),
  );
  const totals = buildTotals({ uid: user.uid, tontines: current, bundles, today });
  const agenda = buildMemberAgenda({ uid: user.uid, tontines: current, bundles, today });
  const progressOf = (tontineId) => {
    const situation = agenda.situations.find((s) => s.tontine.id === tontineId);
    return situation
      ? { completed: situation.completedRounds, total: situation.totalRounds }
      : null;
  };

  return (
    <>
      <title>{`Bonjour ${firstName} ! · ${APP_NAME}`}</title>
      <SpaceSwitch organizerCount={pendingActions} />
      <Hero firstName={firstName} agenda={agenda} today={today} />

      {current.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucune tontine en cours"
          message="Créez votre tontine ou rejoignez celle de votre groupe avec le code d’invitation reçu."
          action={{ label: 'Créer une tontine', to: ROUTES.createTontine }}
        />
      ) : (
        <>
          <Row xs={2} lg={4} className="g-3 mb-4">
            <Col>
              <StatTile
                icon={ArrowUpFromLine}
                label="Total versé"
                value={<AmountDisplay amount={totals.paid} />}
              />
            </Col>
            <Col>
              <StatTile
                icon={ArrowDownToLine}
                label="Total reçu"
                tone="saffron"
                value={<AmountDisplay amount={totals.received} />}
              />
            </Col>
            <Col>
              <StatTile
                icon={AlertTriangle}
                label="Retards"
                tone={totals.late ? 'red' : 'neutral'}
                value={totals.late}
                hint={totals.late ? 'À régulariser' : 'Aucun retard'}
              />
            </Col>
            <Col>
              <StatTile
                icon={Layers}
                label="Tontines"
                tone="blue"
                value={current.length}
                hint={`${current.filter((t) => t.status === TONTINE_STATUS.ACTIVE).length} en cours`}
              />
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col lg={7}>
              <section className="panel h-100">
                <div className="panel__head">
                  <h2 className="panel__title">À faire</h2>
                  {todos.length > 0 && <span className="panel__count">{todos.length}</span>}
                </div>
                <TodoList todos={todos} />
              </section>
            </Col>
            <Col lg={5}>
              <section className="panel h-100">
                <div className="panel__head">
                  <h2 className="panel__title">Prochaines échéances</h2>
                  <Wallet size={18} className="text-secondary" aria-hidden="true" />
                </div>
                <Agenda events={agenda.events} today={today} />
              </section>
            </Col>
          </Row>

          <section className="mb-4">
            <div className="section-head">
              <h2 className="section-head__title">Mes tontines</h2>
              <Link to={ROUTES.tontines} className="section-head__link">
                Tout voir <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <Row xs={1} md={2} xl={3} className="g-3">
              {current.map((tontine) => (
                <Col key={tontine.id}>
                  <TontineCard tontine={tontine} uid={user.uid} progress={progressOf(tontine.id)} />
                </Col>
              ))}
            </Row>
          </section>
        </>
      )}

      <div className="quick-actions">
        <Link to={ROUTES.join} className="quick-action">
          <Ticket size={22} aria-hidden="true" />
          <span>
            <strong>Rejoindre une tontine</strong>
            <small>Avec le code reçu sur WhatsApp</small>
          </span>
        </Link>
        <Link to={ROUTES.createTontine} className="quick-action">
          <Plus size={22} aria-hidden="true" />
          <span>
            <strong>Créer une tontine</strong>
            <small>Vous en serez l’organisateur</small>
          </span>
        </Link>
      </div>
    </>
  );
}

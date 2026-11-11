import { Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import { Plus, Ticket, Users } from 'lucide-react';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import StatusBadge from '../../../shared/components/StatusBadge';
import { useAuth } from '../../../shared/hooks/useAuth';
import { todayIso } from '../../../shared/utils/dates';
import { formatDate } from '../../../shared/utils/formatDate';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { MEMBER_STATUS, TONTINE_STATUS } from '../../../shared/constants/domain';
import { ROUTES } from '../../../app/routePaths';
import { useMyTontines } from '../../tontines/hooks/useMyTontines';
import TontineCard from '../../tontines/components/TontineCard';
import { indexContributions, summarizeMember } from '../../contributions/logic/contributions';
import { buildDeposits, getCurrentDepositIndex } from '../../rounds/logic/schedule';
import { useTontineBundles } from '../hooks/useTontineBundles';
import { buildTodos, buildTotals } from '../logic/todos';
import TodoList from '../components/TodoList';

function TotalTile({ label, children }) {
  return (
    <Col>
      <Card className="shadow-sm h-100 text-center">
        <Card.Body className="py-3 px-2">
          <div className="small text-secondary">{label}</div>
          <div className="total-value fw-bold">{children}</div>
        </Card.Body>
      </Card>
    </Col>
  );
}

function TontineSituation({ tontine, bundle, uid, today }) {
  const me = bundle?.members?.find((m) => m.userId === uid && m.status === MEMBER_STATUS.ACTIVE);
  if (tontine.status !== TONTINE_STATUS.ACTIVE || !me || !bundle?.rounds || !bundle?.contributions)
    return null;
  const deposits = buildDeposits(bundle.rounds);
  const summary = summarizeMember({
    userId: uid,
    tontine,
    member: me,
    rounds: bundle.rounds,
    deposits,
    contributionsById: indexContributions(bundle.contributions),
    currentDepositIndex: getCurrentDepositIndex(deposits, today),
    today,
  });
  return (
    <div className="small mt-2 pt-2 border-top">
      {summary.nextDue ? (
        <div className="d-flex justify-content-between align-items-center gap-2">
          <span>
            Prochaine : <AmountDisplay amount={summary.nextDue.amount} className="fw-semibold" /> le{' '}
            {formatDate(summary.nextDue.round.dueDate)}
          </span>
          <StatusBadge status={summary.nextDue.status} />
        </div>
      ) : (
        <div className="text-success">À jour</div>
      )}
      {summary.nextPayout && (
        <div>
          Mon tour : n° {summary.nextPayout.index}, le {formatDate(summary.nextPayout.dueDate)} (
          <AmountDisplay amount={summary.nextPayout.potAmount} />)
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { data: tontines, isLoading, error } = useMyTontines();
  const { bundles } = useTontineBundles(tontines);
  const today = todayIso();

  if (isLoading) return <Loader />;
  if (error) return <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />;

  const current = tontines.filter((t) =>
    [TONTINE_STATUS.ACTIVE, TONTINE_STATUS.DRAFT].includes(t.status),
  );
  const todos = current.flatMap((tontine) =>
    buildTodos({ uid: user.uid, tontine, bundle: bundles[tontine.id], today }),
  );
  const totals = buildTotals({ uid: user.uid, tontines: current, bundles, today });

  return (
    <>
      <PageHeader title={`Bonjour ${profile?.firstName ?? ''} !`} subtitle={formatDate(today)} />
      {current.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucune tontine en cours"
          message="Créez votre tontine ou rejoignez celle de votre groupe avec le code d’invitation reçu."
          action={{ label: 'Créer une tontine', to: ROUTES.createTontine }}
        />
      ) : (
        <>
          <Row xs={3} className="g-2 mb-4">
            <TotalTile label="Total versé">
              <AmountDisplay amount={totals.paid} />
            </TotalTile>
            <TotalTile label="Total reçu">
              <AmountDisplay amount={totals.received} />
            </TotalTile>
            <TotalTile label="Retards">
              <span className={totals.late ? 'text-danger' : ''}>{totals.late}</span>
            </TotalTile>
          </Row>

          <section className="mb-4">
            <h2 className="h5 mb-3">À faire</h2>
            <TodoList todos={todos} />
          </section>

          <section className="mb-4">
            <h2 className="h5 mb-3">Mes tontines</h2>
            <Row xs={1} md={2} xl={3} className="g-3">
              {current.map((tontine) => (
                <Col key={tontine.id}>
                  <TontineCard tontine={tontine} uid={user.uid}>
                    <TontineSituation
                      tontine={tontine}
                      bundle={bundles[tontine.id]}
                      uid={user.uid}
                      today={today}
                    />
                  </TontineCard>
                </Col>
              ))}
            </Row>
          </section>
        </>
      )}
      <div className="d-grid d-sm-flex gap-2">
        <Link to={ROUTES.join} className="btn btn-outline-primary">
          <Ticket size={18} className="me-1" aria-hidden="true" />
          Rejoindre avec un code
        </Link>
        <Link to={ROUTES.createTontine} className="btn btn-outline-primary">
          <Plus size={18} className="me-1" aria-hidden="true" />
          Créer une tontine
        </Link>
      </div>
    </>
  );
}

import { Button, Card, Col, ListGroup, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import { Plus, Ticket, Users } from 'lucide-react';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import { useAuth, useActor } from '../../../shared/hooks/useAuth';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { MEMBER_STATUS, TONTINE_STATUS } from '../../../shared/constants/domain';
import { ROUTES } from '../../../app/routePaths';
import { useMyTontines } from '../hooks/useMyTontines';
import { useMyMemberships } from '../../members/hooks/useMyMemberships';
import { cancelJoinRequest } from '../../members/services/memberService';
import TontineCard from '../components/TontineCard';

const GROUPS = [
  { title: 'En cours', statuses: [TONTINE_STATUS.ACTIVE] },
  { title: 'En préparation', statuses: [TONTINE_STATUS.DRAFT] },
  {
    title: 'Terminées ou annulées',
    statuses: [TONTINE_STATUS.COMPLETED, TONTINE_STATUS.CANCELLED],
  },
];

function PendingRequests() {
  const { data: memberships } = useMyMemberships();
  const actor = useActor();
  const { run, isRunning } = useAsyncAction();
  const pending = (memberships ?? []).filter((m) => m.status === MEMBER_STATUS.PENDING);
  if (pending.length === 0) return null;

  return (
    <Card className="shadow-sm mb-4 border-warning">
      <Card.Header className="fw-semibold">Mes demandes en attente</Card.Header>
      <ListGroup variant="flush">
        {pending.map((membership) => (
          <ListGroup.Item
            key={membership.tontineId}
            className="d-flex justify-content-between align-items-center gap-2"
          >
            <span>
              {membership.tontineName ?? 'Tontine'} — {membership.shares} part(s)
              <br />
              <small className="text-secondary">L’organisateur doit accepter votre demande.</small>
            </span>
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
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}

export default function TontineListPage() {
  const { user } = useAuth();
  const { data: tontines, isLoading, error } = useMyTontines();

  const actions = (
    <>
      <Link to={ROUTES.join} className="btn btn-outline-primary">
        <Ticket size={18} className="me-1" aria-hidden="true" />
        Rejoindre
      </Link>
      <Link to={ROUTES.createTontine} className="btn btn-primary">
        <Plus size={18} className="me-1" aria-hidden="true" />
        Créer
      </Link>
    </>
  );

  return (
    <>
      <PageHeader title="Mes tontines" actions={actions} />
      <PendingRequests />
      {isLoading && <Loader />}
      {error && <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />}
      {tontines && tontines.length === 0 && (
        <EmptyState
          icon={Users}
          title="Vous ne participez à aucune tontine"
          message="Créez votre tontine ou rejoignez celle de votre groupe avec le code d’invitation reçu."
          action={{ label: 'Créer une tontine', to: ROUTES.createTontine }}
        />
      )}
      {tontines &&
        GROUPS.map(({ title, statuses }) => {
          const items = tontines.filter((t) => statuses.includes(t.status));
          if (items.length === 0) return null;
          return (
            <section key={title} className="mb-4">
              <h2 className="h6 text-secondary text-uppercase mb-3">{title}</h2>
              <Row xs={1} md={2} xl={3} className="g-3">
                {items.map((tontine) => (
                  <Col key={tontine.id}>
                    <TontineCard tontine={tontine} uid={user.uid} />
                  </Col>
                ))}
              </Row>
            </section>
          );
        })}
    </>
  );
}

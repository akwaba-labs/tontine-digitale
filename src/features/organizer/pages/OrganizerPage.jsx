import { Button, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Gift,
  HandCoins,
  Plus,
  UserPlus,
} from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import StatTile from '../../../shared/components/StatTile';
import StatusBadge from '../../../shared/components/StatusBadge';
import SpaceSwitch from '../../../shared/components/SpaceSwitch';
import UserAvatar from '../../../shared/components/UserAvatar';
import { APP_NAME } from '../../../config/app';
import { useActor } from '../../../shared/hooks/useAuth';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { formatDate } from '../../../shared/utils/formatDate';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { PAYMENT_METHODS } from '../../../shared/constants/domain';
import { ROUTES, tontineDetailPath, tontineTabPath } from '../../../app/routePaths';
import { depositLabel } from '../../rounds/logic/schedule';
import { confirmPayment } from '../../contributions/services/contributionService';
import { acceptMember, refuseMember } from '../../members/services/memberService';
import { useOrganizerOverview } from '../hooks/useOrganizerOverview';

function PaymentsToConfirm({ managed }) {
  const actor = useActor();
  const { run, isRunning } = useAsyncAction();
  const items = managed.flatMap((m) =>
    m.toConfirm.map((item) => ({ ...item, tontine: m.tontine })),
  );
  if (items.length === 0) {
    return <p className="text-secondary mb-0">Aucun paiement en attente de confirmation.</p>;
  }
  return items.map(({ contribution, deposit, tontine }) => (
    <div key={`${tontine.id}-${contribution.id}`} className="org-row">
      <UserAvatar name={contribution.memberName} size={38} />
      <div className="flex-grow-1 min-w-0">
        <div className="fw-semibold text-truncate">
          {contribution.memberName} · <AmountDisplay amount={contribution.amount} />
        </div>
        <div className="small text-secondary text-truncate">
          {tontine.name} · {deposit ? depositLabel(deposit) : `tour n° ${contribution.roundIndex}`}
          {contribution.method ? ` · ${PAYMENT_METHODS[contribution.method]}` : ''}
          {contribution.reference ? ` · réf. ${contribution.reference}` : ''}
        </div>
      </div>
      <div className="d-flex gap-2 flex-shrink-0">
        <Link
          to={tontineTabPath(tontine.id, 'cotisations')}
          className="btn btn-sm btn-outline-secondary d-none d-sm-inline-flex"
        >
          Voir
        </Link>
        <Button
          size="sm"
          variant="success"
          disabled={isRunning}
          onClick={() =>
            run(() => confirmPayment(actor, tontine, contribution, deposit), {
              success: `Paiement de ${contribution.memberName} confirmé.`,
            })
          }
        >
          Confirmer
        </Button>
      </div>
    </div>
  ));
}

function JoinRequests({ managed, bundles }) {
  const actor = useActor();
  const { run, isRunning } = useAsyncAction();
  const items = managed.flatMap((m) =>
    m.requests.map((member) => ({ member, tontine: m.tontine })),
  );
  if (items.length === 0) {
    return <p className="text-secondary mb-0">Aucune demande d’adhésion.</p>;
  }
  return items.map(({ member, tontine }) => (
    <div key={`${tontine.id}-${member.userId}`} className="org-row">
      <UserAvatar name={member.displayName} size={38} />
      <div className="flex-grow-1 min-w-0">
        <div className="fw-semibold text-truncate">{member.displayName}</div>
        <div className="small text-secondary text-truncate">
          {tontine.name} · {member.shares} part{member.shares > 1 ? 's' : ''}
        </div>
      </div>
      <div className="d-flex gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="outline-danger"
          disabled={isRunning}
          onClick={() =>
            run(() => refuseMember(actor, tontine, member), { success: 'Demande refusée.' })
          }
        >
          Refuser
        </Button>
        <Button
          size="sm"
          variant="success"
          disabled={isRunning}
          onClick={() =>
            run(() => acceptMember(actor, tontine, bundles[tontine.id]?.members ?? [], member), {
              success: `${member.displayName} fait maintenant partie de la tontine.`,
            })
          }
        >
          Accepter
        </Button>
      </div>
    </div>
  ));
}

function PayoutsDue({ managed }) {
  const items = managed.flatMap((m) =>
    m.payoutsDue.map((round) => ({ round, tontine: m.tontine })),
  );
  if (items.length === 0) {
    return <p className="text-secondary mb-0">Aucun pot à verser pour le moment.</p>;
  }
  return items.map(({ round, tontine }) => (
    <div key={`${tontine.id}-${round.index}`} className="org-row">
      <span className="icon-bubble icon-bubble--success">
        <Gift size={18} aria-hidden="true" />
      </span>
      <div className="flex-grow-1 min-w-0">
        <div className="fw-semibold text-truncate">
          {round.beneficiaryName} · <AmountDisplay amount={round.potAmount} />
        </div>
        <div className="small text-secondary text-truncate">
          {tontine.name} · tour n° {round.index} du {formatDate(round.dueDate)}
        </div>
      </div>
      <Link
        to={tontineTabPath(tontine.id, 'tours')}
        className="btn btn-sm btn-primary flex-shrink-0"
      >
        Verser
      </Link>
    </div>
  ));
}

function CollectCard({ item }) {
  const { tontine, current } = item;
  return (
    <div className="collect-card">
      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
        <div className="collect-card__title">
          <Link to={tontineDetailPath(tontine.id)}>{tontine.name}</Link>
        </div>
        <StatusBadge kind="tontine" status={tontine.status} />
      </div>
      {current ? (
        <>
          <div className="small text-secondary mb-3">
            {depositLabel(current.deposit)} · bénéficiaire {current.deposit.beneficiaryName}
          </div>
          <div className="d-flex align-items-end justify-content-between mb-2">
            <div>
              <div className="collect-card__rate">{current.paymentRate} %</div>
              <div className="small text-secondary">collecté</div>
            </div>
            <div className="text-end small">
              <AmountDisplay amount={current.collectedContributions} className="fw-bold" />
              <div className="text-secondary">
                sur <AmountDisplay amount={current.expected} />
              </div>
            </div>
          </div>
          <div className="mini-progress mb-3" aria-hidden="true">
            <span style={{ width: `${current.paymentRate}%` }} />
          </div>
          <div className="d-flex flex-wrap gap-3 small">
            <span>
              <strong>{current.confirmedCount}</strong> payé(s)
            </span>
            <span>
              <strong>{current.declaredCount}</strong> à confirmer
            </span>
            <span className={current.lateLines.length ? 'text-danger' : ''}>
              <strong>{current.lateLines.length}</strong> en retard
            </span>
          </div>
        </>
      ) : (
        <p className="small text-secondary mb-0">
          En préparation : {tontine.memberIds.length} membre(s) pour {tontine.totalShares} parts.{' '}
          <Link to={tontineTabPath(tontine.id, 'membres')}>Gérer les membres</Link>
        </p>
      )}
    </div>
  );
}

export default function OrganizerPage() {
  const { managed, totals, pendingActions, isLoading, error, hasManaged, bundles } =
    useOrganizerOverview();

  if (isLoading) return <Loader />;
  if (error) return <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />;

  return (
    <>
      <title>{`Espace organisateur · ${APP_NAME}`}</title>
      <SpaceSwitch organizerCount={pendingActions} />
      <section className="dash-hero dash-hero--ink">
        <div>
          <div className="dash-hero__date">Espace organisateur</div>
          <h1 className="dash-hero__title">
            {pendingActions > 0
              ? `${pendingActions} action${pendingActions > 1 ? 's' : ''} vous attend${pendingActions > 1 ? 'ent' : ''}`
              : 'Tout est à jour'}
          </h1>
          <p className="dash-hero__text mb-0">
            Confirmez les paiements, répondez aux demandes et versez les pots de{' '}
            {managed.length > 1 ? `vos ${managed.length} tontines` : 'votre tontine'}.
          </p>
        </div>
        <Link to={ROUTES.createTontine} className="btn btn-warning btn-stamp">
          <Plus size={18} className="me-1" aria-hidden="true" /> Nouvelle tontine
        </Link>
      </section>

      {!hasManaged ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Vous n’organisez encore aucune tontine"
          message="Créez une tontine : vous pourrez inviter les membres, confirmer leurs dépôts et suivre la collecte ici."
          action={{ label: 'Créer une tontine', to: ROUTES.createTontine }}
        />
      ) : (
        <>
          <Row xs={2} lg={4} className="g-3 mb-4">
            <Col>
              <StatTile
                icon={HandCoins}
                label="À confirmer"
                tone="saffron"
                value={totals.toConfirm}
              />
            </Col>
            <Col>
              <StatTile icon={UserPlus} label="Demandes" tone="blue" value={totals.requests} />
            </Col>
            <Col>
              <StatTile icon={Gift} label="Pots à verser" value={totals.payoutsDue} />
            </Col>
            <Col>
              <StatTile
                icon={AlertTriangle}
                label="Retards (dépôt en cours)"
                tone={totals.late ? 'red' : 'neutral'}
                value={totals.late}
              />
            </Col>
          </Row>

          <Row className="g-4 mb-4">
            <Col lg={7}>
              <section className="panel h-100">
                <div className="panel__head">
                  <h2 className="panel__title">Paiements à confirmer</h2>
                  {totals.toConfirm > 0 && <span className="panel__count">{totals.toConfirm}</span>}
                </div>
                <PaymentsToConfirm managed={managed} />
              </section>
            </Col>
            <Col lg={5}>
              <section className="panel mb-4">
                <div className="panel__head">
                  <h2 className="panel__title">Demandes d’adhésion</h2>
                  {totals.requests > 0 && <span className="panel__count">{totals.requests}</span>}
                </div>
                <JoinRequests managed={managed} bundles={bundles} />
              </section>
              <section className="panel">
                <div className="panel__head">
                  <h2 className="panel__title">Pots à verser</h2>
                  {totals.payoutsDue > 0 && (
                    <span className="panel__count">{totals.payoutsDue}</span>
                  )}
                </div>
                <PayoutsDue managed={managed} />
              </section>
            </Col>
          </Row>

          <section>
            <div className="section-head">
              <h2 className="section-head__title">Collecte par tontine</h2>
              <Link to={ROUTES.tontines} className="section-head__link">
                Mes tontines <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <Row xs={1} md={2} xl={3} className="g-3">
              {managed.map((item) => (
                <Col key={item.tontine.id}>
                  <CollectCard item={item} />
                </Col>
              ))}
            </Row>
          </section>
        </>
      )}
    </>
  );
}

import { Col, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import { AlertTriangle, HandCoins, Layers, Mail, Users } from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import StatTile from '../../../shared/components/StatTile';
import { APP_NAME } from '../../../config/app';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { ROUTES, adminTontinePath } from '../../../app/routePaths';
import { describeEvent } from '../../tontines/logic/eventLabels';
import { getPlatformStats, listRecentEvents } from '../services/adminService';
import { useAdminQuery } from '../components/useAdminQuery';

const STATUS_BARS = [
  { key: 'active', label: 'En cours', className: 'bar--green' },
  { key: 'draft', label: 'En préparation', className: 'bar--saffron' },
  { key: 'completed', label: 'Terminées', className: 'bar--blue' },
  { key: 'cancelled', label: 'Annulées', className: 'bar--grey' },
];

export default function AdminOverviewPage() {
  const stats = useAdminQuery(getPlatformStats);
  const events = useAdminQuery(() => listRecentEvents(12));

  if (stats.isLoading) return <Loader />;
  if (stats.error) {
    return <EmptyState title="Chargement impossible" message={getErrorMessage(stats.error)} />;
  }
  const s = stats.data;
  const max = Math.max(1, ...STATUS_BARS.map((b) => s.tontines[b.key]));

  return (
    <>
      <title>{`Back-office · ${APP_NAME}`}</title>
      <div className="page-intro">
        <div>
          <h1>Vue d’ensemble</h1>
          <div className="page-intro__sub">Toute l’activité de la plateforme</div>
        </div>
      </div>

      <Row xs={1} sm={2} xl={4} className="g-3 mb-4">
        <Col>
          <StatTile icon={Users} label="Utilisateurs inscrits" value={s.users} tone="blue" />
        </Col>
        <Col>
          <StatTile
            icon={Layers}
            label="Tontines"
            value={s.tontines.total}
            hint={`${s.tontines.active} en cours`}
          />
        </Col>
        <Col>
          <StatTile
            icon={HandCoins}
            label="Dépôts confirmés"
            tone="saffron"
            value={<AmountDisplay amount={s.confirmedAmount} />}
            hint={`${s.confirmedCount} paiement(s)`}
          />
        </Col>
        <Col>
          <StatTile
            icon={AlertTriangle}
            label="Pénalités appliquées"
            tone={s.lateWithPenalty ? 'red' : 'neutral'}
            value={<AmountDisplay amount={s.penaltiesAmount} />}
            hint={`${s.lateWithPenalty} dépôt(s) en retard non réglé(s)`}
          />
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={5}>
          <section className="panel mb-4">
            <div className="panel__head">
              <h2 className="panel__title">Tontines par statut</h2>
              <Link to={ROUTES.adminTontines} className="section-head__link small">
                Voir
              </Link>
            </div>
            {STATUS_BARS.map((bar) => (
              <div key={bar.key} className="bar-row">
                <div className="d-flex justify-content-between small mb-1">
                  <span>{bar.label}</span>
                  <strong>{s.tontines[bar.key]}</strong>
                </div>
                <div className="bar">
                  <span
                    className={bar.className}
                    style={{ width: `${(s.tontines[bar.key] / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </section>
          <section className="panel">
            <div className="panel__head">
              <h2 className="panel__title">E-mails</h2>
              <Mail size={18} className="text-secondary" aria-hidden="true" />
            </div>
            <p className="mb-2">
              <strong>{s.mails}</strong> résumé(s) quotidien(s) traités.
            </p>
            <Link to={ROUTES.adminMails} className="section-head__link small">
              Consulter le journal
            </Link>
          </section>
        </Col>
        <Col lg={7}>
          <section className="panel h-100">
            <div className="panel__head">
              <h2 className="panel__title">Activité récente</h2>
            </div>
            {events.isLoading && <Loader />}
            {events.error && <p className="text-danger">{getErrorMessage(events.error)}</p>}
            {events.data?.length === 0 && <p className="text-secondary">Aucune activité.</p>}
            {events.data?.map((event) => (
              <Link
                key={`${event.tontineId}-${event.id}`}
                to={adminTontinePath(event.tontineId)}
                className="org-row text-decoration-none text-reset"
              >
                <span className="icon-bubble icon-bubble--neutral flex-shrink-0">
                  <Layers size={16} aria-hidden="true" />
                </span>
                <span className="flex-grow-1 min-w-0">
                  <span className="d-block">{describeEvent(event)}</span>
                  <span className="small text-secondary">
                    {event.createdAt ? formatDateTime(event.createdAt) : ''}
                  </span>
                </span>
              </Link>
            ))}
          </section>
        </Col>
      </Row>
    </>
  );
}

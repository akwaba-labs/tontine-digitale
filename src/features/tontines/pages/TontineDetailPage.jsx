import { Nav, Tab } from 'react-bootstrap';
import { Link, useParams, useSearchParams } from 'react-router';
import { Pencil, Wallet } from 'lucide-react';
import PageHeader from '../../../shared/components/PageHeader';
import StatusBadge from '../../../shared/components/StatusBadge';
import Loader from '../../../shared/components/Loader';
import { TONTINE_STATUS } from '../../../shared/constants/domain';
import { declarePaymentPath, editTontinePath } from '../../../app/routePaths';
import { useTontineDetail } from '../hooks/useTontineDetail';
import TontineLoadError from '../components/TontineLoadError';
import OverviewTab from '../components/OverviewTab';
import HistoryTab from '../components/HistoryTab';
import RoundsTab from '../../rounds/components/RoundsTab';
import ContributionsTab from '../../contributions/components/ContributionsTab';
import MembersTab from '../../members/components/MembersTab';

const TABS = [
  { key: 'apercu', title: 'Aperçu', Component: OverviewTab },
  { key: 'tours', title: 'Tours', Component: RoundsTab },
  { key: 'cotisations', title: 'Cotisations', Component: ContributionsTab },
  { key: 'membres', title: 'Membres', Component: MembersTab },
  { key: 'historique', title: 'Historique', Component: HistoryTab },
];

export default function TontineDetailPage() {
  const { tontineId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const detail = useTontineDetail(tontineId);
  const activeTab = TABS.some((tab) => tab.key === searchParams.get('onglet'))
    ? searchParams.get('onglet')
    : 'apercu';

  if (detail.isLoading) return <Loader />;
  if (detail.error || detail.notFound) return <TontineLoadError error={detail.error} />;

  const { tontine, isOwner, me } = detail;
  const canEdit = isOwner && [TONTINE_STATUS.DRAFT, TONTINE_STATUS.ACTIVE].includes(tontine.status);
  const canDeclare = tontine.status === TONTINE_STATUS.ACTIVE && me;
  const pendingCount = detail.members.filter((m) => m.status === 'PENDING').length;
  const toConfirmCount = detail.isManager
    ? detail.contributions.filter((c) => c.status === 'DECLARED').length
    : 0;

  return (
    <>
      <PageHeader
        title={tontine.name}
        subtitle={<StatusBadge kind="tontine" status={tontine.status} />}
        actions={
          <>
            {canEdit && (
              <Link
                to={editTontinePath(tontine.id)}
                className="btn btn-outline-secondary"
                aria-label="Modifier la tontine"
              >
                <Pencil size={18} aria-hidden="true" />
                <span className="d-none d-sm-inline ms-1">Modifier</span>
              </Link>
            )}
            {canDeclare && (
              <Link to={declarePaymentPath(tontine.id)} className="btn btn-primary">
                <Wallet size={18} className="me-1" aria-hidden="true" />
                Déclarer un paiement
              </Link>
            )}
          </>
        }
      />
      <Tab.Container
        activeKey={activeTab}
        onSelect={(key) => setSearchParams({ onglet: key }, { replace: true })}
        mountOnEnter
      >
        <Nav variant="tabs" className="nav-tabs-scroll mb-3" role="tablist">
          {TABS.map(({ key, title }) => {
            const badge =
              key === 'membres' ? pendingCount : key === 'cotisations' ? toConfirmCount : 0;
            return (
              <Nav.Item key={key}>
                <Nav.Link eventKey={key} role="tab">
                  {title}
                  {badge > 0 && (
                    <span className="badge rounded-pill text-bg-warning ms-1">
                      {badge}
                      <span className="visually-hidden"> à traiter</span>
                    </span>
                  )}
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
        <Tab.Content>
          {TABS.map(({ key, Component }) => (
            <Tab.Pane key={key} eventKey={key}>
              <Component detail={detail} />
            </Tab.Pane>
          ))}
        </Tab.Content>
      </Tab.Container>
    </>
  );
}

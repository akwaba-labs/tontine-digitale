import { Tab, Tabs } from 'react-bootstrap';
import { Link, useParams } from 'react-router';
import { CalendarDays, History, LayoutGrid, Receipt, Users } from 'lucide-react';
import { declarePaymentPath } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

const TABS = [
  {
    key: 'overview',
    title: 'Aperçu',
    icon: LayoutGrid,
    emptyTitle: 'Aperçu de la tontine',
    message: 'Montant, fréquence, tour en cours et progression s’afficheront ici.',
  },
  {
    key: 'rounds',
    title: 'Tours',
    icon: CalendarDays,
    emptyTitle: 'Calendrier des tours',
    message: 'Chaque tour, sa date, son bénéficiaire et le montant du pot s’afficheront ici.',
  },
  {
    key: 'contributions',
    title: 'Cotisations',
    icon: Receipt,
    emptyTitle: 'Aucune cotisation',
    message: 'Vous verrez ici qui a payé, qui a déclaré son paiement et qui est en retard.',
  },
  {
    key: 'members',
    title: 'Membres',
    icon: Users,
    emptyTitle: 'Aucun membre',
    message: 'La liste des membres et leur nombre de parts s’afficheront ici.',
  },
  {
    key: 'history',
    title: 'Historique',
    icon: History,
    emptyTitle: 'Historique vide',
    message:
      'Toutes les opérations de la tontine seront inscrites ici, sans possibilité de modification.',
  },
];

export default function TontineDetailPage() {
  const { tontineId } = useParams();

  return (
    <>
      <PageHeader
        title="Détail de la tontine"
        actions={
          <Link to={declarePaymentPath(tontineId)} className="btn btn-primary">
            Déclarer un paiement
          </Link>
        }
      />
      <Tabs
        defaultActiveKey="overview"
        id="tontine-tabs"
        className="nav-tabs-scroll mb-3"
        mountOnEnter
      >
        {TABS.map(({ key, title, icon, emptyTitle, message }) => (
          <Tab key={key} eventKey={key} title={title}>
            <EmptyState icon={icon} title={emptyTitle} message={message} />
          </Tab>
        ))}
      </Tabs>
    </>
  );
}

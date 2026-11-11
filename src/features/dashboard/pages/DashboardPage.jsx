import { LayoutDashboard } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Tableau de bord" />
      <EmptyState
        icon={LayoutDashboard}
        title="Aucune tontine pour le moment"
        message="Créez votre première tontine ou rejoignez celle de votre groupe avec un code d’invitation."
        action={{ label: 'Créer une tontine', to: ROUTES.createTontine }}
      />
    </>
  );
}

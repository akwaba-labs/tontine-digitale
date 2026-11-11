import { Users } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function TontineListPage() {
  return (
    <>
      <PageHeader title="Mes tontines" />
      <EmptyState
        icon={Users}
        title="Vous ne participez à aucune tontine"
        message="Les tontines que vous organisez et celles dont vous êtes membre apparaîtront ici."
        action={{ label: 'Créer une tontine', to: ROUTES.createTontine }}
      />
    </>
  );
}

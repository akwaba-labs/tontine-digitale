import { CircleUser } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function ProfilePage() {
  return (
    <>
      <PageHeader title="Mon profil" />
      <EmptyState
        icon={CircleUser}
        title="Profil bientôt disponible"
        message="Vous pourrez modifier votre nom, votre téléphone et votre photo."
        action={{ label: 'Paramètres', to: ROUTES.settings }}
      />
    </>
  );
}

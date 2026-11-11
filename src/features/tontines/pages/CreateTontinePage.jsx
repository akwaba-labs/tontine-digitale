import { CirclePlus } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function CreateTontinePage() {
  return (
    <>
      <PageHeader title="Créer une tontine" />
      <EmptyState
        icon={CirclePlus}
        title="Création bientôt disponible"
        message="Vous pourrez choisir le montant, la fréquence, la date de début et le nombre de membres."
        action={{ label: 'Retour à mes tontines', to: ROUTES.tontines }}
      />
    </>
  );
}

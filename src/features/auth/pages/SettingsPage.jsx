import { Settings } from 'lucide-react';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Paramètres" />
      <EmptyState
        icon={Settings}
        title="Paramètres bientôt disponibles"
        message="Vous pourrez gérer vos préférences, consulter l’usage de vos données et supprimer votre compte."
      />
    </>
  );
}

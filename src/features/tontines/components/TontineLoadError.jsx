import { ShieldAlert } from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import { ROUTES } from '../../../app/routePaths';
import { getErrorMessage } from '../../../shared/utils/errorMessages';

export default function TontineLoadError({ error }) {
  const denied = error?.code === 'permission-denied';
  return (
    <EmptyState
      icon={ShieldAlert}
      title={denied || !error ? 'Tontine introuvable ou accès réservé' : 'Chargement impossible'}
      message={
        denied || !error
          ? 'Seuls les membres acceptés peuvent voir cette tontine. Si on vous a invité, utilisez le code d’invitation.'
          : getErrorMessage(error)
      }
      action={{ label: 'Retour à mes tontines', to: ROUTES.tontines }}
    />
  );
}

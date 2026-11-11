import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Hourglass, ShieldAlert } from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import { ROUTES } from '../../../app/routePaths';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { useAuth } from '../../../shared/hooks/useAuth';
import { MEMBER_STATUS } from '../../../shared/constants/domain';
import { getMyMembership } from '../../members/services/memberService';

/** Accès refusé : si l'utilisateur a une demande en attente, on le lui dit. */
function usePendingRequest(tontineId, enabled) {
  const { user } = useAuth();
  const [state, setState] = useState({ key: null, isPending: false });
  const key = enabled && user ? `${tontineId}:${user.uid}` : null;
  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    getMyMembership(tontineId, user.uid)
      .then(
        (membership) =>
          !cancelled && setState({ key, isPending: membership?.status === MEMBER_STATUS.PENDING }),
      )
      .catch(() => !cancelled && setState({ key, isPending: false }));
    return () => {
      cancelled = true;
    };
  }, [key, tontineId, user]);
  return state.key === key && state.isPending;
}

export default function TontineLoadError({ error }) {
  const { tontineId } = useParams();
  const denied = !error || error.code === 'permission-denied';
  const isPending = usePendingRequest(tontineId, denied);

  if (isPending) {
    return (
      <EmptyState
        icon={Hourglass}
        title="Demande en attente"
        message="L’organisateur n’a pas encore accepté votre demande. Vous verrez la tontine dès qu’il l’aura acceptée."
        action={{ label: 'Retour à mes tontines', to: ROUTES.tontines }}
      />
    );
  }
  return (
    <EmptyState
      icon={ShieldAlert}
      title={denied ? 'Tontine introuvable ou accès réservé' : 'Chargement impossible'}
      message={
        denied
          ? 'Seuls les membres acceptés peuvent voir cette tontine. Si on vous a invité, utilisez le code d’invitation.'
          : getErrorMessage(error)
      }
      action={{ label: 'Retour à mes tontines', to: ROUTES.tontines }}
    />
  );
}

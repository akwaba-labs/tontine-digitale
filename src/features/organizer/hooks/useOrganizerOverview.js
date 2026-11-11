import { useAuth } from '../../../shared/hooks/useAuth';
import { todayIso } from '../../../shared/utils/dates';
import { useMyTontines } from '../../tontines/hooks/useMyTontines';
import { useTontineBundles } from '../../dashboard/hooks/useTontineBundles';
import { buildOrganizerOverview, isManagerOf } from '../logic/overview';

/** Tontines gérées par l'utilisateur et actions en attente (temps réel). */
export function useOrganizerOverview() {
  const { user } = useAuth();
  const { data: tontines, isLoading, error } = useMyTontines();
  const managedTontines = (tontines ?? []).filter((t) => isManagerOf(t, user?.uid));
  const { bundles } = useTontineBundles(managedTontines);
  const overview = buildOrganizerOverview({
    uid: user?.uid,
    tontines: managedTontines,
    bundles,
    today: todayIso(),
  });
  return { ...overview, bundles, isLoading, error, hasManaged: managedTontines.length > 0 };
}

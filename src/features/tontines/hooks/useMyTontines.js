import { useSubscription } from '../../../shared/hooks/useSubscription';
import { useAuth } from '../../../shared/hooks/useAuth';
import { subscribeMyTontines } from '../services/tontineService';

export function useMyTontines() {
  const { user } = useAuth();
  const uid = user?.uid;
  return useSubscription(uid ? `my-tontines:${uid}` : null, (onData, onError) =>
    subscribeMyTontines(uid, onData, onError),
  );
}

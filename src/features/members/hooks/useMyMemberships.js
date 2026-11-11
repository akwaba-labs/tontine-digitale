import { useSubscription } from '../../../shared/hooks/useSubscription';
import { useAuth } from '../../../shared/hooks/useAuth';
import { subscribeMyMemberships } from '../services/memberService';

export function useMyMemberships() {
  const { user } = useAuth();
  const uid = user?.uid;
  return useSubscription(uid ? `memberships:${uid}` : null, (onData, onError) =>
    subscribeMyMemberships(uid, onData, onError),
  );
}

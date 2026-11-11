import { useEffect, useRef, useState } from 'react';

/**
 * S'abonne à une source temps réel (onSnapshot) identifiée par `key`.
 * `subscribe(onData, onError)` doit renvoyer une fonction de désabonnement.
 * Si `key` est vide, rien n'est chargé (data = null).
 */
export function useSubscription(key, subscribe) {
  const [state, setState] = useState({ key: null, data: undefined, error: null });
  const subscribeRef = useRef(subscribe);

  useEffect(() => {
    subscribeRef.current = subscribe;
  });

  useEffect(() => {
    if (!key) return undefined;
    return subscribeRef.current(
      (data) => setState({ key, data, error: null }),
      (error) => setState({ key, data: undefined, error }),
    );
  }, [key]);

  if (!key) return { data: null, isLoading: false, error: null };
  const isCurrent = state.key === key;
  return {
    data: isCurrent ? state.data : undefined,
    error: isCurrent ? state.error : null,
    isLoading: !isCurrent,
  };
}

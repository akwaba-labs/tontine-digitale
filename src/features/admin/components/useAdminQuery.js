import { useEffect, useState } from 'react';

/** Charge une donnée du back-office une fois (pas de temps réel : lectures ponctuelles). */
export function useAdminQuery(load, deps = []) {
  const [state, setState] = useState({ data: null, error: null, isLoading: true });
  useEffect(() => {
    let cancelled = false;
    load()
      .then((data) => !cancelled && setState({ data, error: null, isLoading: false }))
      .catch((error) => !cancelled && setState({ data: null, error, isLoading: false }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

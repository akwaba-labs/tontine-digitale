import { useCallback, useState } from 'react';
import { getErrorMessage } from '../utils/errorMessages';
import { useToast } from './useToast';

/**
 * Exécute une action asynchrone (écriture Firestore…) avec état « en cours »
 * et messages de succès / d'erreur traduits.
 */
export function useAsyncAction() {
  const [isRunning, setIsRunning] = useState(false);
  const { showSuccess, showError } = useToast();

  const run = useCallback(
    async (action, { success } = {}) => {
      setIsRunning(true);
      try {
        const result = await action();
        if (success) showSuccess(success);
        return { ok: true, result };
      } catch (error) {
        console.error(error);
        showError(getErrorMessage(error));
        return { ok: false, error };
      } finally {
        setIsRunning(false);
      }
    },
    [showSuccess, showError],
  );

  return { run, isRunning };
}

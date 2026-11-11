import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

/**
 * Affiche un message temporaire (succès, erreur…).
 * Exemple : const { showSuccess, showError } = useToast(); showSuccess('Paiement déclaré.');
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast doit être utilisé à l’intérieur de <ToastProvider>.');
  }
  return context;
}

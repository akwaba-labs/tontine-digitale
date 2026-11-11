import ToastProvider from './providers/ToastProvider';

/** Regroupe les providers globaux. L'AuthProvider s'ajoutera ici en phase 3. */
export default function AppProviders({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}

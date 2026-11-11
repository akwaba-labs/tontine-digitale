import ToastProvider from './providers/ToastProvider';
import AuthProvider from './providers/AuthProvider';

/** Providers globaux de l'application. */
export default function AppProviders({ children }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}

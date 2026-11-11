import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../shared/hooks/useAuth';
import Loader from '../shared/components/Loader';
import NotificationsProvider from './providers/NotificationsProvider';
import { ROUTES, safeRedirect } from './routePaths';

/** Pages réservées aux utilisateurs connectés, avec un profil complet. */
export function RequireAuth() {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loader fullPage />;
  if (!user) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`${ROUTES.login}?redirect=${encodeURIComponent(redirect)}`} replace />;
  }
  if (!profile && location.pathname !== ROUTES.profile) {
    return <Navigate to={`${ROUTES.profile}?completer=1`} replace />;
  }
  return (
    <NotificationsProvider>
      <Outlet />
    </NotificationsProvider>
  );
}

/** Connexion / inscription : redirige un utilisateur déjà connecté. */
export function RedirectIfAuthenticated() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading) return <Loader fullPage />;
  if (user) {
    const redirect = new URLSearchParams(location.search).get('redirect');
    return <Navigate to={safeRedirect(redirect)} replace />;
  }
  return <Outlet />;
}

/** Back-office : réservé aux administrateurs de la plateforme. */
export function RequireAdmin() {
  const { isAdmin, isAdminResolved, isLoading } = useAuth();
  if (isLoading || !isAdminResolved) return <Loader fullPage />;
  if (!isAdmin) return <Navigate to={ROUTES.dashboard} replace />;
  return <Outlet />;
}

import { Link } from 'react-router';
import { Bell, Settings } from 'lucide-react';
import { ROUTES } from '../../app/routePaths';
import { useAuth } from '../hooks/useAuth';
import BrandLogo, { BrandName } from './BrandLogo';
import UnreadBadge from './UnreadBadge';
import UserAvatar from './UserAvatar';

/** Barre du haut de l'espace client : marque (mobile), notifications, paramètres et profil. */
export default function AppTopbar() {
  const { profile, displayName } = useAuth();
  return (
    <header className="app-topbar">
      <Link
        to={ROUTES.dashboard}
        className="d-flex d-lg-none align-items-center gap-2 text-decoration-none"
      >
        <BrandLogo />
        <BrandName />
      </Link>
      <div className="ms-auto d-flex align-items-center gap-1">
        <Link
          to={ROUTES.notifications}
          className="app-topbar__icon"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={20} aria-hidden="true" />
          <UnreadBadge className="app-topbar__badge" />
        </Link>
        <Link
          to={ROUTES.settings}
          className="app-topbar__icon d-none d-sm-inline-flex"
          aria-label="Paramètres"
          title="Paramètres"
        >
          <Settings size={20} aria-hidden="true" />
        </Link>
        <Link to={ROUTES.profile} className="ms-1" aria-label="Mon profil" title="Mon profil">
          <UserAvatar name={displayName} photoURL={profile?.photoURL} size={36} />
        </Link>
      </div>
    </header>
  );
}

import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { ArrowLeft, Gauge, Layers, Mail, Users } from 'lucide-react';
import Loader from '../../../shared/components/Loader';
import BrandLogo, { BrandName } from '../../../shared/components/BrandLogo';
import UserAvatar from '../../../shared/components/UserAvatar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { ROUTES } from '../../../app/routePaths';

const ITEMS = [
  { to: ROUTES.admin, label: 'Vue d’ensemble', icon: Gauge, end: true },
  { to: ROUTES.adminUsers, label: 'Utilisateurs', icon: Users },
  { to: ROUTES.adminTontines, label: 'Tontines', icon: Layers },
  { to: ROUTES.adminMails, label: 'E-mails', icon: Mail },
];

/** Back-office de la plateforme : barre latérale sombre, distincte de l'espace client. */
export default function AdminLayout() {
  const { profile, displayName } = useAuth();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to={ROUTES.admin} className="admin-sidebar__brand">
          <BrandLogo />
          <span>
            <BrandName />
            <span className="admin-sidebar__tag">Back-office</span>
          </span>
        </Link>
        <nav className="admin-sidebar__nav" aria-label="Navigation du back-office">
          {ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="admin-sidebar__link">
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <Link to={ROUTES.dashboard} className="admin-sidebar__link">
            <ArrowLeft size={19} aria-hidden="true" />
            <span>Retour à l’application</span>
          </Link>
          <div className="admin-sidebar__user">
            <UserAvatar name={displayName} photoURL={profile?.photoURL} size={34} />
            <span className="text-truncate">{displayName}</span>
          </div>
        </div>
      </aside>
      <main id="main-content" className="admin-main">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

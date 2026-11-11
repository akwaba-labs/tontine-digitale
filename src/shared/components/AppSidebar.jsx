import { Link, NavLink } from 'react-router';
import { LogOut } from 'lucide-react';
import { ADMIN_LINK, SIDEBAR_SECTIONS } from '../../app/navigation';
import { ROUTES } from '../../app/routePaths';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { useOrganizerOverview } from '../../features/organizer/hooks/useOrganizerOverview';
import { logout } from '../../features/auth/services/authService';
import BrandLogo, { BrandName } from './BrandLogo';
import UserAvatar from './UserAvatar';

function Count({ value, variant = 'danger' }) {
  if (!value) return null;
  return (
    <span className={`sidebar-count sidebar-count--${variant}`}>
      {value > 99 ? '99+' : value}
      <span className="visually-hidden"> en attente</span>
    </span>
  );
}

/** Navigation de l'espace client sur ordinateur : espace membre, espace organisateur, compte. */
export default function AppSidebar() {
  const { user, profile, displayName, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const { pendingActions } = useOrganizerOverview();
  const counts = { unread: unreadCount, organizer: pendingActions };

  return (
    <aside className="app-sidebar d-none d-lg-flex" aria-label="Navigation de l’espace client">
      <Link to={ROUTES.dashboard} className="app-sidebar__brand">
        <BrandLogo />
        <BrandName />
      </Link>
      <nav className="app-sidebar__nav" aria-label="Navigation principale">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="app-sidebar__section">
            <div className="app-sidebar__title">{section.title}</div>
            {section.items.map(({ to, label, icon: Icon, end, badge }) => (
              <NavLink key={to} to={to} end={end} className="app-sidebar__link">
                <Icon size={19} aria-hidden="true" />
                <span className="flex-grow-1">{label}</span>
                {badge && (
                  <Count
                    value={counts[badge]}
                    variant={badge === 'organizer' ? 'warning' : 'danger'}
                  />
                )}
              </NavLink>
            ))}
          </div>
        ))}
        {isAdmin && (
          <div className="app-sidebar__section">
            <div className="app-sidebar__title">Plateforme</div>
            <NavLink to={ADMIN_LINK.to} className="app-sidebar__link app-sidebar__link--admin">
              <ADMIN_LINK.icon size={19} aria-hidden="true" />
              <span>{ADMIN_LINK.label}</span>
            </NavLink>
          </div>
        )}
      </nav>
      <div className="app-sidebar__user">
        <UserAvatar name={displayName} photoURL={profile?.photoURL} size={38} />
        <div className="min-w-0 flex-grow-1">
          <div className="fw-semibold text-truncate">{displayName}</div>
          <div className="small text-secondary text-truncate">
            {isAdmin ? 'Administrateur' : user?.email}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-light rounded-circle p-2"
          title="Se déconnecter"
          aria-label="Se déconnecter"
          onClick={() => logout()}
        >
          <LogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}

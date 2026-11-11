import { NavLink } from 'react-router';
import { APP_NAV_ITEMS } from '../../app/navigation';
import { ROUTES } from '../../app/routePaths';
import UnreadBadge from './UnreadBadge';

/** Barre de navigation fixée en bas de l'écran, affichée uniquement sur mobile. */
export default function BottomNav() {
  return (
    <nav className="bottom-nav fixed-bottom d-md-none" aria-label="Navigation principale">
      <ul className="bottom-nav__list">
        {APP_NAV_ITEMS.map(({ to, label, icon: Icon, end, isPrimary }) => (
          <li key={to} className="bottom-nav__item">
            <NavLink
              to={to}
              end={end}
              className={`bottom-nav__link${isPrimary ? ' bottom-nav__link--primary' : ''}`}
            >
              <span className="bottom-nav__icon position-relative">
                <Icon size={isPrimary ? 26 : 24} aria-hidden="true" />
                {to === ROUTES.notifications && (
                  <UnreadBadge className="position-absolute top-0 start-100 translate-middle small" />
                )}
              </span>
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

import { Container, Nav, Navbar } from 'react-bootstrap';
import { Link, NavLink } from 'react-router';
import { Settings } from 'lucide-react';
import { APP_NAME } from '../../config/app';
import { ROUTES } from '../../app/routePaths';
import { APP_NAV_ITEMS } from '../../app/navigation';
import BrandLogo from './BrandLogo';
import UnreadBadge from './UnreadBadge';
import { useAuth } from '../hooks/useAuth';

/**
 * Barre du haut.
 * - variant « app » : liens de l'application visibles à partir des tablettes (md) ;
 *   sur mobile, la navigation se fait par la barre du bas.
 * - variant « public » : liens Connexion / Inscription.
 */
export default function AppNavbar({ variant = 'app' }) {
  const { user } = useAuth();
  const brandTarget = user ? ROUTES.dashboard : ROUTES.home;

  return (
    <Navbar bg="white" className="border-bottom shadow-sm" sticky="top">
      <Container>
        <Navbar.Brand
          as={Link}
          to={brandTarget}
          className="d-flex align-items-center gap-2 fw-bold text-primary"
        >
          <BrandLogo />
          <span>{APP_NAME}</span>
        </Navbar.Brand>

        {variant === 'app' ? (
          <Nav
            className="ms-auto d-none d-md-flex align-items-center gap-1"
            aria-label="Navigation principale"
          >
            {APP_NAV_ITEMS.map((item) => (
              <Nav.Link key={item.to} as={NavLink} to={item.to} end={item.end}>
                {item.desktopLabel}
                {item.to === ROUTES.notifications && <UnreadBadge className="ms-1" />}
              </Nav.Link>
            ))}
            <Nav.Link as={NavLink} to={ROUTES.settings} aria-label="Paramètres" title="Paramètres">
              <Settings size={20} aria-hidden="true" />
            </Nav.Link>
          </Nav>
        ) : user ? (
          <Nav className="ms-auto">
            <Link
              to={ROUTES.dashboard}
              className="btn btn-primary btn-sm d-inline-flex align-items-center"
            >
              Mon tableau de bord
            </Link>
          </Nav>
        ) : (
          <Nav className="ms-auto flex-row align-items-center gap-2">
            <Nav.Link as={NavLink} to={ROUTES.login} className="fw-semibold">
              Connexion
            </Nav.Link>
            <Link
              to={ROUTES.register}
              className="btn btn-primary btn-sm d-none d-sm-inline-flex align-items-center"
            >
              Inscription
            </Link>
          </Nav>
        )}
      </Container>
    </Navbar>
  );
}

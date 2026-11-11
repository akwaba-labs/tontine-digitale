import { Badge, Col, Container, Row } from 'react-bootstrap';
import { Suspense } from 'react';
import { Link, Outlet } from 'react-router';
import Loader from './Loader';
import OfflineBanner from './OfflineBanner';
import { APP_NAME } from '../../config/app';
import AppNavbar from './AppNavbar';
import BottomNav from './BottomNav';
import AppSidebar from './AppSidebar';
import AppTopbar from './AppTopbar';
import BrandLogo, { BrandName } from './BrandLogo';
import { ROUTES } from '../../app/routePaths';

const isUsingEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';

function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Aller au contenu
    </a>
  );
}

function EmulatorBadge() {
  if (!isUsingEmulators) return null;
  return (
    <Badge
      bg="warning"
      text="dark"
      className="position-fixed bottom-0 start-0 m-2 d-none d-md-inline-block"
    >
      Mode émulateurs
    </Badge>
  );
}

/** Mise en page de l'espace client : barre latérale (ordinateur), barre du haut, barre du bas (mobile). */
export function AppLayout() {
  return (
    <div className="app-shell">
      <SkipLink />
      <AppSidebar />
      <div className="app-shell__main">
        <AppTopbar />
        <OfflineBanner />
        <main id="main-content" className="app-main app-main--with-bottom-nav">
          <div className="app-content">
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <BottomNav />
      <EmulatorBadge />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <Container>
        <Row className="g-4">
          <Col md={6}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <BrandLogo />
              <BrandName className="fs-5" />
            </div>
            <p className="mb-0" style={{ maxWidth: '26rem' }}>
              Le carnet de bord de votre tontine. Les versements se font comme d’habitude, en
              espèces ou par Mobile Money ; ici, on les note, on les confirme, et tout le monde voit
              la même chose.
            </p>
          </Col>
          <Col xs={6} md={3}>
            <div className="site-footer__title">Commencer</div>
            <ul className="list-unstyled d-grid gap-2 mb-0">
              <li>
                <Link to={ROUTES.register}>Créer un compte</Link>
              </li>
              <li>
                <Link to={ROUTES.join}>Rejoindre une tontine</Link>
              </li>
            </ul>
          </Col>
          <Col xs={6} md={3}>
            <div className="site-footer__title">Mon compte</div>
            <ul className="list-unstyled d-grid gap-2 mb-0">
              <li>
                <Link to={ROUTES.login}>Se connecter</Link>
              </li>
              <li>
                <Link to={ROUTES.forgotPassword}>Mot de passe oublié</Link>
              </li>
            </ul>
          </Col>
        </Row>
        <div className="site-footer__bottom d-flex flex-column flex-sm-row justify-content-between gap-2">
          <span>
            © {new Date().getFullYear()} {APP_NAME}
          </span>
          <span>Fait pour les tontines d’Afrique de l’Ouest · FCFA</span>
        </div>
      </Container>
    </footer>
  );
}

/** Mise en page des pages publiques (accueil, connexion, inscription…). */
export function PublicLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <SkipLink />
      <AppNavbar variant="public" />
      <main id="main-content" className="flex-grow-1">
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
      <EmulatorBadge />
    </div>
  );
}

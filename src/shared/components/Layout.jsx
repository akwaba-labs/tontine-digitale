import { Badge, Container } from 'react-bootstrap';
import { Suspense } from 'react';
import { Outlet } from 'react-router';
import Loader from './Loader';
import { APP_NAME } from '../../config/app';
import AppNavbar from './AppNavbar';
import BottomNav from './BottomNav';

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

/** Mise en page des pages accessibles une fois connecté. */
export function AppLayout() {
  return (
    <>
      <SkipLink />
      <AppNavbar variant="app" />
      <main id="main-content" className="app-main app-main--with-bottom-nav">
        <Container>
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </Container>
      </main>
      <BottomNav />
      <EmulatorBadge />
    </>
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
      <footer className="py-4 text-center text-secondary small border-top bg-white">
        © {new Date().getFullYear()} {APP_NAME} · L'application ne déplace pas d'argent : elle trace
        les cotisations.
      </footer>
      <EmulatorBadge />
    </div>
  );
}

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import AppProviders from './AppProviders';
import { appRoutes } from './routes';

const state = vi.hoisted(() => ({ user: null, profile: null }));

vi.mock('../features/auth/services/authService', () => ({
  onAuthChange: (callback) => {
    callback(state.user);
    return () => {};
  },
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock('../features/auth/services/userService', () => ({
  subscribeUserProfile: (uid, onData) => {
    onData(state.profile);
    return () => {};
  },
  createUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  uploadAvatar: vi.fn(),
  removeAvatar: vi.fn(),
}));

vi.mock('../features/notifications/services/notificationService', () => ({
  subscribeMyNotifications: (uid, onData) => {
    onData([{ id: 'n1', message: 'Paiement confirmé', read: false, link: '' }]);
    return () => {};
  },
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  addNotification: vi.fn(),
  addNotifications: vi.fn(),
}));

vi.mock('../features/tontines/services/tontineService', () => ({
  subscribeMyTontines: (uid, onData) => {
    onData([]);
    return () => {};
  },
}));

vi.mock('../features/members/services/memberService', () => ({
  subscribeMyMemberships: (uid, onData) => {
    onData([]);
    return () => {};
  },
}));

function renderAt(path) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

// Les pages sont chargées à la demande (lazy) : on les précharge pour des tests rapides.
beforeAll(async () => {
  await Promise.all([
    import('../features/auth/pages/LoginPage'),
    import('../features/auth/pages/ProfilePage'),
    import('../features/dashboard/pages/DashboardPage'),
    import('../features/notifications/pages/NotificationsPage'),
  ]);
}, 60000);

beforeEach(() => {
  state.user = null;
  state.profile = null;
});

const signIn = (profile = { firstName: 'Awa', lastName: 'Koné', phone: '+2250707070707' }) => {
  state.user = { uid: 'awa', email: 'awa@example.com' };
  state.profile = profile;
};

describe('Navigation', () => {
  it('affiche la page d’accueil publique avec Connexion et Inscription', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Votre tontine');
    expect(screen.getByRole('link', { name: 'Connexion' })).toHaveAttribute('href', '/connexion');
    expect(screen.getByRole('link', { name: 'Inscription' })).toHaveAttribute(
      'href',
      '/inscription',
    );
  });

  it('redirige vers la connexion quand on n’est pas connecté', async () => {
    const router = renderAt('/tableau-de-bord');
    expect(await screen.findByRole('heading', { level: 1, name: 'Connexion' })).toBeInTheDocument();
    expect(router.state.location.search).toBe('?redirect=%2Ftableau-de-bord');
  });

  it('affiche le tableau de bord, la barre du bas et le badge des notifications', async () => {
    signIn();
    renderAt('/tableau-de-bord');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Bonjour Awa !' }),
    ).toBeInTheDocument();
    const bottomNav = screen
      .getAllByRole('navigation', { name: 'Navigation principale' })
      .find((nav) => nav.classList.contains('bottom-nav'));
    expect(within(bottomNav).getByRole('link', { name: 'Accueil' })).toHaveClass('active');
    expect(within(bottomNav).getByRole('link', { name: /Alertes/ })).toHaveTextContent('1');
  });

  it('demande de compléter le profil s’il manque', async () => {
    signIn(null);
    renderAt('/tontines');
    expect(await screen.findByText(/Complétez votre profil/)).toBeInTheDocument();
  });

  it('redirige un utilisateur connecté qui ouvre la page de connexion', async () => {
    signIn();
    renderAt('/connexion?redirect=/notifications');
    expect(await screen.findByText('Paiement confirmé')).toBeInTheDocument();
  });

  it('affiche une page introuvable pour une adresse inconnue', () => {
    renderAt('/adresse-inconnue');
    expect(screen.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeInTheDocument();
  });
});

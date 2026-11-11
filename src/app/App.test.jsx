import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import AppProviders from './AppProviders';
import { appRoutes } from './routes';

function renderAt(path) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe('Navigation', () => {
  it('affiche la page d’accueil publique avec les liens Connexion et Inscription', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Votre tontine');
    expect(screen.getByRole('link', { name: 'Connexion' })).toHaveAttribute('href', '/connexion');
    expect(screen.getByRole('link', { name: 'Inscription' })).toHaveAttribute(
      'href',
      '/inscription',
    );
  });

  it('affiche la barre du bas et marque l’onglet actif sur le tableau de bord', () => {
    renderAt('/tableau-de-bord');
    expect(screen.getByRole('heading', { level: 1, name: 'Tableau de bord' })).toBeInTheDocument();

    const navs = screen.getAllByRole('navigation', { name: 'Navigation principale' });
    const bottomNav = navs.find((nav) => nav.classList.contains('bottom-nav'));
    const homeLink = within(bottomNav).getByRole('link', { name: 'Accueil' });
    expect(homeLink).toHaveClass('active');
    expect(within(bottomNav).getByRole('link', { name: 'Tontines' })).not.toHaveClass('active');
  });

  it('affiche les onglets du détail d’une tontine', () => {
    renderAt('/tontines/abc123');
    for (const tab of ['Aperçu', 'Tours', 'Cotisations', 'Membres', 'Historique']) {
      expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Déclarer un paiement' })).toHaveAttribute(
      'href',
      '/tontines/abc123/declarer',
    );
  });

  it('affiche une page introuvable pour une adresse inconnue', () => {
    renderAt('/adresse-inconnue');
    expect(screen.getByRole('heading', { level: 1, name: 'Page introuvable' })).toBeInTheDocument();
  });
});

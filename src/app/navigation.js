import { Bell, CirclePlus, House, UserRound, Users } from 'lucide-react';
import { ROUTES } from './routePaths';

// Entrées de la navigation principale (barre du bas sur mobile, barre du haut sur ordinateur).
export const APP_NAV_ITEMS = Object.freeze([
  { to: ROUTES.dashboard, label: 'Accueil', desktopLabel: 'Tableau de bord', icon: House },
  { to: ROUTES.tontines, label: 'Tontines', desktopLabel: 'Mes tontines', icon: Users, end: true },
  {
    to: ROUTES.createTontine,
    label: 'Créer',
    desktopLabel: 'Créer une tontine',
    icon: CirclePlus,
    isPrimary: true,
  },
  { to: ROUTES.notifications, label: 'Alertes', desktopLabel: 'Notifications', icon: Bell },
  { to: ROUTES.profile, label: 'Profil', desktopLabel: 'Profil', icon: UserRound },
]);

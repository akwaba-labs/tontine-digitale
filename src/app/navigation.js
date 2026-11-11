import {
  Bell,
  CirclePlus,
  ClipboardCheck,
  House,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { ROUTES } from './routePaths';

// Barre du bas (mobile).
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

// Barre latérale (ordinateur) : l'espace membre et l'espace organisateur.
export const SIDEBAR_SECTIONS = Object.freeze([
  {
    title: 'Mon espace',
    items: [
      { to: ROUTES.dashboard, label: 'Tableau de bord', icon: House },
      { to: ROUTES.tontines, label: 'Mes tontines', icon: Users, end: true },
      { to: ROUTES.notifications, label: 'Notifications', icon: Bell, badge: 'unread' },
    ],
  },
  {
    title: 'Espace organisateur',
    items: [
      {
        to: ROUTES.organizer,
        label: 'Vue d’ensemble',
        icon: ClipboardCheck,
        badge: 'organizer',
      },
      { to: ROUTES.createTontine, label: 'Créer une tontine', icon: CirclePlus },
    ],
  },
  {
    title: 'Compte',
    items: [
      { to: ROUTES.profile, label: 'Profil', icon: UserRound },
      { to: ROUTES.settings, label: 'Paramètres', icon: Settings },
    ],
  },
]);

export const ADMIN_LINK = Object.freeze({
  to: ROUTES.admin,
  label: 'Back-office',
  icon: ShieldCheck,
});

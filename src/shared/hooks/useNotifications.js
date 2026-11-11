import { createContext, useContext } from 'react';

export const NotificationsContext = createContext(null);

const EMPTY = { notifications: [], unreadCount: 0, isLoading: false, error: null };

/** Notifications de l'utilisateur connecté (vide hors connexion). */
export function useNotifications() {
  return useContext(NotificationsContext) ?? EMPTY;
}

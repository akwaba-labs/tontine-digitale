import { createContext, useContext, useMemo } from 'react';

export const AuthContext = createContext(null);

/**
 * { user, profile, isLoading, displayName }
 * - user : utilisateur Firebase Auth (ou null)
 * - profile : document users/{uid} (ou null s'il n'est pas encore rempli)
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>.');
  }
  return context;
}

export function getDisplayName(profile, user) {
  if (profile?.firstName) return `${profile.firstName} ${profile.lastName}`.trim();
  return user?.displayName || user?.email || 'Utilisateur';
}

/** Auteur des actions (journal, notifications) : { uid, name }. */
export function useActor() {
  const { user, displayName } = useAuth();
  return useMemo(() => (user ? { uid: user.uid, name: displayName } : null), [user, displayName]);
}

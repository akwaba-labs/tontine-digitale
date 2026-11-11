import { useEffect, useMemo, useState } from 'react';
import { AuthContext, getDisplayName } from '../../shared/hooks/useAuth';
import { onAuthChange } from '../../features/auth/services/authService';
import { subscribeAdminFlag, subscribeUserProfile } from '../../features/auth/services/userService';
import { NO_PERSISTENCE_KEY } from '../../config/firebase';

// Délai au-delà duquel on considère le cache local de Firestore bloqué.
const PROFILE_TIMEOUT_MS = 12000;

/**
 * Filet de sécurité : si la page est rechargée pendant la toute première initialisation du cache
 * local (IndexedDB), Firestore peut ne plus jamais répondre dans cet onglet. On recharge alors une
 * seule fois sans cache local (pour la session), plutôt que d'afficher « Chargement… » sans fin.
 */
function useStuckCacheRecovery(isWaitingForProfile) {
  useEffect(() => {
    if (!isWaitingForProfile || !navigator.onLine) return undefined;
    const timer = setTimeout(() => {
      try {
        if (sessionStorage.getItem(NO_PERSISTENCE_KEY) === '1') return;
        sessionStorage.setItem(NO_PERSISTENCE_KEY, '1');
      } catch {
        return;
      }
      window.location.reload();
    }, PROFILE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isWaitingForProfile]);
}

export default function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({ user: null, isResolved: false });
  const [profileState, setProfileState] = useState({ uid: null, profile: null });
  const [adminState, setAdminState] = useState({ uid: null, isAdmin: false });

  useEffect(() => onAuthChange((user) => setAuthState({ user, isResolved: true })), []);

  const uid = authState.user?.uid ?? null;

  useEffect(() => {
    if (!uid) return undefined;
    return subscribeUserProfile(
      uid,
      (profile) => setProfileState({ uid, profile }),
      (error) => {
        console.error(error);
        setProfileState({ uid, profile: null });
      },
    );
  }, [uid]);

  useEffect(() => {
    if (!uid) return undefined;
    return subscribeAdminFlag(uid, (isAdmin) => setAdminState({ uid, isAdmin }));
  }, [uid]);

  useStuckCacheRecovery(Boolean(uid) && profileState.uid !== uid);

  const value = useMemo(() => {
    const { user, isResolved } = authState;
    const profileLoaded = !user || profileState.uid === user.uid;
    const profile = user && profileLoaded ? profileState.profile : null;
    return {
      user,
      profile,
      isLoading: !isResolved || !profileLoaded,
      displayName: getDisplayName(profile, user),
      isAdmin: Boolean(user) && adminState.uid === user.uid && adminState.isAdmin,
    };
  }, [authState, profileState, adminState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

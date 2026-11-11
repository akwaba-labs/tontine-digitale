import { useEffect, useMemo, useState } from 'react';
import { AuthContext, getDisplayName } from '../../shared/hooks/useAuth';
import { onAuthChange } from '../../features/auth/services/authService';
import { subscribeUserProfile } from '../../features/auth/services/userService';

export default function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({ user: null, isResolved: false });
  const [profileState, setProfileState] = useState({ uid: null, profile: null });

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

  const value = useMemo(() => {
    const { user, isResolved } = authState;
    const profileLoaded = !user || profileState.uid === user.uid;
    const profile = user && profileLoaded ? profileState.profile : null;
    return {
      user,
      profile,
      isLoading: !isResolved || !profileLoaded,
      displayName: getDisplayName(profile, user),
    };
  }, [authState, profileState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

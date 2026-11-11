import { useMemo } from 'react';
import { NotificationsContext } from '../../shared/hooks/useNotifications';
import { useSubscription } from '../../shared/hooks/useSubscription';
import { useAuth } from '../../shared/hooks/useAuth';
import { subscribeMyNotifications } from '../../features/notifications/services/notificationService';

export default function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const { data, isLoading, error } = useSubscription(
    uid ? `notifications:${uid}` : null,
    (onData, onError) => subscribeMyNotifications(uid, onData, onError),
  );
  const value = useMemo(() => {
    const notifications = data ?? [];
    return {
      notifications,
      unreadCount: notifications.filter((notification) => !notification.read).length,
      isLoading,
      error,
    };
  }, [data, isLoading, error]);
  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

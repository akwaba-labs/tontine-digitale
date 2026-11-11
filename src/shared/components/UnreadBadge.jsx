import { useNotifications } from '../hooks/useNotifications';

export default function UnreadBadge({ className = '' }) {
  const { unreadCount } = useNotifications();
  if (unreadCount === 0) return null;
  return (
    <span className={`badge rounded-pill text-bg-danger ${className}`}>
      {unreadCount > 99 ? '99+' : unreadCount}
      <span className="visually-hidden"> non lue{unreadCount > 1 ? 's' : ''}</span>
    </span>
  );
}

import { Button, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { todayIso } from '../../../shared/utils/dates';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { useMyTontines } from '../../tontines/hooks/useMyTontines';
import { useTontineBundles } from '../../dashboard/hooks/useTontineBundles';
import { buildTodos } from '../../dashboard/logic/todos';
import TodoList from '../../dashboard/components/TodoList';
import { deleteNotification, markAllAsRead, markAsRead } from '../services/notificationService';

const REMINDER_TYPES = ['LATE', 'REJECTED', 'DUE_SOON', 'YOUR_TURN', 'CONFIRM_PAYOUT'];

function Reminders() {
  const { user } = useAuth();
  const { data: tontines } = useMyTontines();
  const { bundles } = useTontineBundles(tontines);
  const today = todayIso();
  const reminders = (tontines ?? [])
    .flatMap((tontine) =>
      buildTodos({ uid: user.uid, tontine, bundle: bundles[tontine.id], today }),
    )
    .filter((todo) => REMINDER_TYPES.includes(todo.type));
  if (reminders.length === 0) return null;
  return (
    <section className="mb-4">
      <h2 className="h6 text-uppercase text-secondary">Rappels</h2>
      <TodoList todos={reminders} />
    </section>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, error } = useNotifications();
  const { run, isRunning } = useAsyncAction();

  const open = (notification) => {
    if (!notification.read) markAsRead(notification.id).catch(console.error);
    if (notification.link) navigate(notification.link);
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        actions={
          unreadCount > 0 && (
            <Button
              variant="outline-primary"
              disabled={isRunning}
              onClick={() =>
                run(() => markAllAsRead(notifications), { success: 'Tout est marqué comme lu.' })
              }
            >
              <CheckCheck size={18} className="me-1" aria-hidden="true" />
              Tout marquer comme lu
            </Button>
          )
        }
      />
      <Reminders />
      <h2 className="h6 text-uppercase text-secondary">Activité</h2>
      {isLoading && <Loader />}
      {error && <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />}
      {!isLoading && !error && notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="Aucune notification"
          message="Vous serez prévenu ici des paiements à confirmer, des paiements confirmés ou rejetés et de votre tour."
        />
      )}
      {notifications.length > 0 && (
        <ListGroup className="shadow-sm">
          {notifications.map((notification) => (
            <ListGroup.Item
              key={notification.id}
              className={`d-flex align-items-start gap-2 py-3 ${notification.read ? '' : 'notification-unread'}`}
            >
              <button
                type="button"
                className="btn btn-link text-start text-reset text-decoration-none p-0 flex-grow-1"
                onClick={() => open(notification)}
              >
                {!notification.read && <span className="visually-hidden">Non lue : </span>}
                <span className={notification.read ? '' : 'fw-semibold'}>
                  {notification.message}
                </span>
                <span className="d-block small text-secondary">
                  {notification.createdAt ? formatDateTime(notification.createdAt) : ''}
                </span>
              </button>
              <Button
                variant="link"
                size="sm"
                className="text-secondary"
                aria-label="Supprimer la notification"
                onClick={() => run(() => deleteNotification(notification.id))}
              >
                <Trash2 size={16} aria-hidden="true" />
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </>
  );
}

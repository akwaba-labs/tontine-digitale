import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Gift,
  HandCoins,
  Play,
  Send,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  XCircle,
} from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import { APP_NAME } from '../../../config/app';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useNotifications } from '../../../shared/hooks/useNotifications';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { diffInDays, todayIso } from '../../../shared/utils/dates';
import { formatDate, formatTime, toAppIsoDate } from '../../../shared/utils/formatDate';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { NOTIFICATION_TYPES as T } from '../../../shared/constants/domain';
import { useMyTontines } from '../../tontines/hooks/useMyTontines';
import { useTontineBundles } from '../../dashboard/hooks/useTontineBundles';
import { buildTodos } from '../../dashboard/logic/todos';
import TodoList from '../../dashboard/components/TodoList';
import { deleteNotification, markAllAsRead, markAsRead } from '../services/notificationService';

const REMINDER_TYPES = ['LATE', 'REJECTED', 'DUE_SOON', 'YOUR_TURN', 'CONFIRM_PAYOUT'];

const TYPE_DISPLAY = {
  [T.JOIN_REQUEST]: [UserPlus, 'info'],
  [T.JOIN_ACCEPTED]: [UserCheck, 'success'],
  [T.JOIN_REFUSED]: [UserX, 'danger'],
  [T.TONTINE_STARTED]: [Play, 'success'],
  [T.PAYMENT_TO_CONFIRM]: [HandCoins, 'warning'],
  [T.PAYMENT_CONFIRMED]: [CheckCircle2, 'success'],
  [T.PAYMENT_REJECTED]: [XCircle, 'danger'],
  [T.PENALTY_APPLIED]: [AlertTriangle, 'danger'],
  [T.PAYOUT_SENT]: [Send, 'success'],
  [T.PAYOUT_RECEIVED]: [Gift, 'success'],
};

function dayLabel(iso, today) {
  const days = diffInDays(iso, today);
  if (days === 0) return 'Aujourd’hui';
  if (days === 1) return 'Hier';
  return formatDate(iso);
}

/** Regroupe les notifications par jour (à Abidjan), les plus récentes d'abord. */
function groupByDay(notifications) {
  const groups = [];
  for (const notification of notifications) {
    const day = notification.createdAt ? toAppIsoDate(notification.createdAt) : 'inconnu';
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(notification);
    else groups.push({ day, items: [notification] });
  }
  return groups;
}

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
    <section className="panel mb-4">
      <div className="panel__head">
        <h2 className="panel__title">Rappels</h2>
        <span className="panel__count">{reminders.length}</span>
      </div>
      <TodoList todos={reminders} />
    </section>
  );
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, error } = useNotifications();
  const { run, isRunning } = useAsyncAction();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const today = todayIso();

  const visible = onlyUnread ? notifications.filter((n) => !n.read) : notifications;

  const open = (notification) => {
    if (!notification.read) markAsRead(notification.id).catch(console.error);
    if (notification.link) navigate(notification.link);
  };

  return (
    <>
      <title>{`Notifications · ${APP_NAME}`}</title>
      <div className="page-intro">
        <div>
          <h1>Notifications</h1>
          <div className="page-intro__sub">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Vous êtes à jour'}
          </div>
        </div>
        {unreadCount > 0 && (
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
        )}
      </div>

      <Reminders />

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h2 className="section-head__title">Activité</h2>
        <div className="filter-pills" role="group" aria-label="Filtrer les notifications">
          <button
            type="button"
            className={`filter-pill ${onlyUnread ? '' : 'is-active'}`}
            aria-pressed={!onlyUnread}
            onClick={() => setOnlyUnread(false)}
          >
            Toutes <span className="count">{notifications.length}</span>
          </button>
          <button
            type="button"
            className={`filter-pill ${onlyUnread ? 'is-active' : ''}`}
            aria-pressed={onlyUnread}
            onClick={() => setOnlyUnread(true)}
          >
            Non lues <span className="count">{unreadCount}</span>
          </button>
        </div>
      </div>

      {isLoading && <Loader />}
      {error && <EmptyState title="Chargement impossible" message={getErrorMessage(error)} />}
      {!isLoading && !error && visible.length === 0 && (
        <EmptyState
          icon={Bell}
          title={onlyUnread ? 'Aucune notification non lue' : 'Aucune notification'}
          message="Vous serez prévenu ici des paiements à confirmer, des paiements confirmés ou rejetés et de votre tour."
        />
      )}

      {groupByDay(visible).map((group) => (
        <section key={group.day}>
          <h3 className="notif-day">
            {group.day === 'inconnu' ? 'À l’instant' : dayLabel(group.day, today)}
          </h3>
          {group.items.map((notification) => {
            const [Icon, tone] = TYPE_DISPLAY[notification.type] ?? [Bell, 'neutral'];
            return (
              <div
                key={notification.id}
                className={`notif ${notification.read ? '' : 'notif--unread'}`}
              >
                <span className={`icon-bubble icon-bubble--${tone}`}>
                  <Icon size={18} aria-hidden="true" />
                </span>
                <button type="button" className="notif__body" onClick={() => open(notification)}>
                  {!notification.read && (
                    <>
                      <span className="notif__dot" aria-hidden="true" />
                      <span className="visually-hidden">Non lue : </span>
                    </>
                  )}
                  <span className={notification.read ? '' : 'fw-semibold'}>
                    {notification.message}
                  </span>
                  <span className="notif__time d-block">
                    {notification.createdAt ? formatTime(notification.createdAt) : ''}
                  </span>
                </button>
                <Button
                  variant="link"
                  size="sm"
                  className="text-secondary p-1"
                  aria-label="Supprimer la notification"
                  onClick={() => run(() => deleteNotification(notification.id))}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </div>
            );
          })}
        </section>
      ))}
    </>
  );
}

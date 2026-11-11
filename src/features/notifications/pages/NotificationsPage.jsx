import { Bell } from 'lucide-react';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function NotificationsPage() {
  return (
    <>
      <PageHeader title="Notifications" />
      <EmptyState
        icon={Bell}
        title="Aucune notification"
        message="Vous serez prévenu ici des paiements à confirmer, des paiements confirmés et de votre tour."
      />
    </>
  );
}

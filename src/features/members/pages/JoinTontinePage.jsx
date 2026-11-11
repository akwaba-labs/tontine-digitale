import { Container } from 'react-bootstrap';
import { useParams } from 'react-router';
import { Ticket } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function JoinTontinePage() {
  const { inviteCode } = useParams();

  return (
    <Container className="py-4" style={{ maxWidth: '32rem' }}>
      <PageHeader title="Rejoindre une tontine" />
      <EmptyState
        icon={Ticket}
        title={inviteCode ? `Code d’invitation : ${inviteCode}` : 'Rejoindre avec un code'}
        message="Vous pourrez bientôt envoyer votre demande à l’organisateur, qui l’acceptera ou la refusera."
        action={{ label: 'Créer mon compte', to: ROUTES.register }}
      />
    </Container>
  );
}

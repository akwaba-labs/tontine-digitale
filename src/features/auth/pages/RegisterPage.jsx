import { Container } from 'react-bootstrap';
import { UserPlus } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function RegisterPage() {
  return (
    <Container className="py-4" style={{ maxWidth: '32rem' }}>
      <PageHeader title="Inscription" />
      <EmptyState
        icon={UserPlus}
        title="Inscription bientôt disponible"
        message="Vous pourrez créer votre compte avec votre nom, votre téléphone et votre e-mail."
        action={{ label: 'J’ai déjà un compte', to: ROUTES.login }}
      />
    </Container>
  );
}

import { Container } from 'react-bootstrap';
import { LogIn } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function LoginPage() {
  return (
    <Container className="py-4" style={{ maxWidth: '32rem' }}>
      <PageHeader title="Connexion" />
      <EmptyState
        icon={LogIn}
        title="Connexion bientôt disponible"
        message="Vous pourrez vous connecter avec votre e-mail et votre mot de passe."
        action={{ label: 'Créer un compte', to: ROUTES.register }}
      />
    </Container>
  );
}

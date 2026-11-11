import { Container } from 'react-bootstrap';
import { KeyRound } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function ForgotPasswordPage() {
  return (
    <Container className="py-4" style={{ maxWidth: '32rem' }}>
      <PageHeader title="Mot de passe oublié" />
      <EmptyState
        icon={KeyRound}
        title="Réinitialisation bientôt disponible"
        message="Vous recevrez un e-mail pour choisir un nouveau mot de passe."
        action={{ label: 'Retour à la connexion', to: ROUTES.login }}
      />
    </Container>
  );
}

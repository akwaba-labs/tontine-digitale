import { MapPinOff } from 'lucide-react';
import PageHeader from '../shared/components/PageHeader';
import EmptyState from '../shared/components/EmptyState';
import { ROUTES } from './routePaths';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page introuvable" />
      <EmptyState
        icon={MapPinOff}
        title="Cette page n’existe pas"
        message="Le lien est peut-être incorrect ou la page a été déplacée."
        action={{ label: 'Retour au tableau de bord', to: ROUTES.dashboard }}
      />
    </>
  );
}

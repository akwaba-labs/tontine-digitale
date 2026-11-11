import { useParams } from 'react-router';
import { Wallet } from 'lucide-react';
import { tontineDetailPath } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import EmptyState from '../../../shared/components/EmptyState';

export default function DeclarePaymentPage() {
  const { tontineId } = useParams();

  return (
    <>
      <PageHeader title="Déclarer un paiement" />
      <EmptyState
        icon={Wallet}
        title="Déclaration bientôt disponible"
        message="Vous pourrez indiquer le moyen de paiement (espèces, Wave, Orange Money, MTN MoMo, Moov Money, virement), la référence et joindre une capture d’écran."
        action={{ label: 'Retour à la tontine', to: tontineDetailPath(tontineId) }}
      />
    </>
  );
}

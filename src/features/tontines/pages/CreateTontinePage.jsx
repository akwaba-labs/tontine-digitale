import { Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import PageHeader from '../../../shared/components/PageHeader';
import { useActor, useAuth } from '../../../shared/hooks/useAuth';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { tontineTabPath } from '../../../app/routePaths';
import TontineForm from '../components/TontineForm';
import { createTontine } from '../services/tontineService';

export default function CreateTontinePage() {
  const navigate = useNavigate();
  const actor = useActor();
  const { profile } = useAuth();
  const { run } = useAsyncAction();

  const onSubmit = async (values) => {
    const { ok, result: tontineId } = await run(() => createTontine(actor, profile, values), {
      success: 'Tontine créée ! Invitez maintenant les membres.',
    });
    if (ok) navigate(tontineTabPath(tontineId, 'apercu'));
  };

  return (
    <>
      <PageHeader
        title="Créer une tontine"
        subtitle="Vous pourrez inviter les membres juste après."
      />
      <Row>
        <Col lg={8}>
          <TontineForm onSubmit={onSubmit} submitLabel="Créer la tontine" />
        </Col>
      </Row>
    </>
  );
}

import { Navigate, useNavigate, useParams } from 'react-router';
import PageHeader from '../../../shared/components/PageHeader';
import Loader from '../../../shared/components/Loader';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { TONTINE_STATUS } from '../../../shared/constants/domain';
import { tontineDetailPath } from '../../../app/routePaths';
import TontineForm from '../components/TontineForm';
import { useTontineDetail } from '../hooks/useTontineDetail';
import { updateTontineSettings } from '../services/tontineService';
import TontineLoadError from '../components/TontineLoadError';

export default function EditTontinePage() {
  const { tontineId } = useParams();
  const navigate = useNavigate();
  const { run } = useAsyncAction();
  const { isLoading, error, notFound, tontine, isOwner, actor } = useTontineDetail(tontineId);

  if (isLoading) return <Loader />;
  if (error || notFound) return <TontineLoadError error={error} />;
  if (!isOwner || [TONTINE_STATUS.COMPLETED, TONTINE_STATUS.CANCELLED].includes(tontine.status)) {
    return <Navigate to={tontineDetailPath(tontineId)} replace />;
  }

  const onSubmit = async (values) => {
    const { ok } = await run(() => updateTontineSettings(actor, tontine, values), {
      success: 'Paramètres enregistrés.',
    });
    if (ok) navigate(tontineDetailPath(tontineId));
  };

  return (
    <>
      <PageHeader title="Modifier la tontine" subtitle={tontine.name} />
      <TontineForm
        isEdit
        defaultValues={tontine}
        lockStructure={tontine.status !== TONTINE_STATUS.DRAFT}
        lockOrder={Boolean(tontine.drawAt)}
        onSubmit={onSubmit}
        submitLabel="Enregistrer"
      />
    </>
  );
}

import { useState } from 'react';
import { Alert, Button, Card, Form } from 'react-bootstrap';
import { Link } from 'react-router';
import { CheckCircle2, CircleAlert, Dices, ListOrdered, Play } from 'lucide-react';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { ORDER_MODE, TONTINE_STATUS } from '../../../shared/constants/domain';
import { tontineTabPath } from '../../../app/routePaths';
import { formatDate } from '../../../shared/utils/formatDate';
import { getStartBlockers } from '../../rounds/logic/order';
import { closeTontine, startTontine } from '../services/tontineService';
import AddMembersBar from '../../members/components/AddMembersBar';
import { activeMembers } from '../../contributions/logic/contributions';
import { sumShares } from '../../rounds/logic/schedule';

/** Préparation : ce qui manque avant de démarrer, puis démarrage ou annulation. */
export default function StartPanel({ detail }) {
  const { tontine, members, actor } = detail;
  const { run, isRunning } = useAsyncAction();
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState('');
  const blockers = getStartBlockers(tontine, members);
  const missingShares = sumShares(activeMembers(members)) < tontine.totalShares;

  const onStart = async () => {
    const { ok } = await run(() => startTontine(actor, tontine, members), {
      success: 'La tontine a démarré ! Les membres sont prévenus.',
    });
    if (ok) setModal(null);
  };

  const onCancel = async () => {
    const { ok } = await run(
      () => closeTontine(actor, tontine, TONTINE_STATUS.CANCELLED, reason.trim()),
      {
        success: 'Tontine annulée.',
      },
    );
    if (ok) setModal(null);
  };

  return (
    <Card className="shadow-sm mb-3">
      <Card.Body>
        <h2 className="h6 fw-bold mb-3">Avant de démarrer</h2>
        {blockers.length === 0 ? (
          <Alert variant="success" className="d-flex gap-2">
            <CheckCircle2 aria-hidden="true" />
            Tout est prêt : membres, parts et ordre de passage.
          </Alert>
        ) : (
          <ul className="list-unstyled mb-3">
            {blockers.map((problem) => (
              <li key={problem} className="d-flex gap-2 mb-2">
                <CircleAlert size={20} className="text-warning flex-shrink-0" aria-hidden="true" />
                {problem}
              </li>
            ))}
          </ul>
        )}
        {missingShares && !tontine.drawAt && (
          <div className="mb-3 p-3 rounded bg-body-tertiary">
            <p className="small fw-semibold mb-2">Compléter les parts :</p>
            <AddMembersBar detail={detail} compact />
          </div>
        )}
        {!missingShares && !tontine.drawAt && (tontine.payoutOrder ?? []).length === 0 && (
          <div className="mb-3 p-3 rounded bg-body-tertiary">
            <p className="small mb-2">
              {tontine.orderMode === ORDER_MODE.DRAW
                ? 'Toutes les parts sont attribuées : vous pouvez faire le tirage au sort. Faites-le de préférence devant les membres (en réunion ou en appel), le résultat est définitif.'
                : 'Toutes les parts sont attribuées : fixez maintenant l’ordre de passage.'}
            </p>
            <Link to={tontineTabPath(tontine.id, 'tours')} className="btn btn-outline-primary">
              {tontine.orderMode === ORDER_MODE.DRAW ? (
                <Dices size={18} className="me-1" aria-hidden="true" />
              ) : (
                <ListOrdered size={18} className="me-1" aria-hidden="true" />
              )}
              {tontine.orderMode === ORDER_MODE.DRAW
                ? 'Aller au tirage au sort'
                : 'Fixer l’ordre de passage'}
            </Link>
          </div>
        )}
        <div className="d-grid d-sm-flex gap-2">
          <Button size="lg" disabled={blockers.length > 0} onClick={() => setModal('start')}>
            <Play size={18} className="me-1" aria-hidden="true" />
            Démarrer la tontine
          </Button>
          <Button variant="outline-danger" onClick={() => setModal('cancel')}>
            Annuler la tontine
          </Button>
        </div>
      </Card.Body>
      <ConfirmModal
        show={modal === 'start'}
        title="Démarrer la tontine ?"
        confirmLabel="Démarrer"
        isProcessing={isRunning}
        onConfirm={onStart}
        onCancel={() => setModal(null)}
      >
        Le calendrier des {tontine.totalShares} tours sera créé à partir du{' '}
        {formatDate(tontine.startDate)}. Ensuite, le montant, la fréquence, les membres et l’ordre
        de passage ne pourront plus changer.
      </ConfirmModal>
      <ConfirmModal
        show={modal === 'cancel'}
        title="Annuler la tontine ?"
        confirmLabel="Annuler la tontine"
        cancelLabel="Retour"
        confirmVariant="danger"
        isProcessing={isRunning}
        onConfirm={onCancel}
        onCancel={() => setModal(null)}
      >
        <p>La tontine sera close définitivement. L’historique reste consultable.</p>
        <Form.Group controlId="cancel-reason">
          <Form.Label>Motif (facultatif)</Form.Label>
          <Form.Control
            value={reason}
            maxLength={200}
            onChange={(event) => setReason(event.target.value)}
          />
        </Form.Group>
      </ConfirmModal>
    </Card>
  );
}

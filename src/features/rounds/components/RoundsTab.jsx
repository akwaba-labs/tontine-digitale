import { useState } from 'react';
import { Button, ListGroup } from 'react-bootstrap';
import { CalendarDays } from 'lucide-react';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import StatusBadge from '../../../shared/components/StatusBadge';
import EmptyState from '../../../shared/components/EmptyState';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import {
  PAYMENT_METHODS,
  PAYOUT_STATUS,
  ROUND_STATE,
  TONTINE_STATUS,
} from '../../../shared/constants/domain';
import { formatDate } from '../../../shared/utils/formatDate';
import { confirmPayoutReceived, markPayoutSent } from '../services/roundService';
import { getRoundState } from '../logic/schedule';
import OrderEditor from './OrderEditor';
import PaymentMethodModal from './PaymentMethodModal';

export default function RoundsTab({ detail }) {
  const { tontine, rounds, currentRoundIndex, isOwner, uid, actor } = detail;
  const { run, isRunning } = useAsyncAction();
  const [modal, setModal] = useState(null);

  if (tontine.status === TONTINE_STATUS.DRAFT) return <OrderEditor detail={detail} />;
  if (rounds.length === 0) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="Aucun tour"
        message="Le calendrier n’a pas été créé."
      />
    );
  }

  const isActive = tontine.status === TONTINE_STATUS.ACTIVE;

  const onSendPayout = async ({ method, reference }) => {
    const { ok } = await run(
      () => markPayoutSent(actor, tontine, modal.round, { method, reference }),
      {
        success: 'Versement enregistré. Le bénéficiaire doit confirmer la réception.',
      },
    );
    if (ok) setModal(null);
  };

  const onConfirmReceived = async () => {
    const { ok } = await run(() => confirmPayoutReceived(actor, tontine, modal.round), {
      success: 'Réception du pot confirmée. Merci !',
    });
    if (ok) setModal(null);
  };

  return (
    <>
      <ListGroup className="shadow-sm">
        {rounds.map((round) => {
          const state = getRoundState(round, isActive ? currentRoundIndex : null);
          const isMine = round.beneficiaryId === uid;
          const isCurrent = state === ROUND_STATE.CURRENT;
          return (
            <ListGroup.Item
              key={round.index}
              className={`py-3 ${isCurrent ? 'round-current' : isMine ? 'round-mine' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
                <div>
                  <div className="small text-secondary">
                    Tour n° {round.index} · {formatDate(round.dueDate)}
                  </div>
                  <div className="fw-semibold">
                    {round.beneficiaryName}
                    {isMine && <span className="text-primary"> (vous)</span>}
                  </div>
                  <AmountDisplay amount={round.potAmount} className="fw-bold" />
                  {round.payoutStatus !== PAYOUT_STATUS.PENDING && round.payoutMethod && (
                    <div className="small text-secondary">
                      Versé par {PAYMENT_METHODS[round.payoutMethod]}
                      {round.payoutReference ? ` · réf. ${round.payoutReference}` : ''}
                    </div>
                  )}
                </div>
                <div className="d-flex flex-column align-items-end gap-2">
                  <StatusBadge kind="round" status={state} />
                  {round.payoutStatus !== PAYOUT_STATUS.PENDING && (
                    <StatusBadge kind="payout" status={round.payoutStatus} />
                  )}
                  {isActive &&
                    isOwner &&
                    round.payoutStatus === PAYOUT_STATUS.PENDING &&
                    state !== ROUND_STATE.UPCOMING && (
                      <Button size="sm" onClick={() => setModal({ type: 'send', round })}>
                        Verser le pot
                      </Button>
                    )}
                  {isActive && isMine && round.payoutStatus === PAYOUT_STATUS.SENT && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setModal({ type: 'received', round })}
                    >
                      J’ai reçu le pot
                    </Button>
                  )}
                </div>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>

      <PaymentMethodModal
        key={modal?.round?.index ?? 'none'}
        show={modal?.type === 'send'}
        title={`Verser le pot du tour n° ${modal?.round?.index ?? ''}`}
        description={
          modal
            ? `Bénéficiaire : ${modal.round.beneficiaryName}. Il devra confirmer la réception.`
            : ''
        }
        amount={modal?.round?.potAmount}
        confirmLabel="Enregistrer le versement"
        isProcessing={isRunning}
        onConfirm={onSendPayout}
        onCancel={() => setModal(null)}
      />
      <ConfirmModal
        show={modal?.type === 'received'}
        title="Confirmer la réception du pot ?"
        confirmLabel="Oui, j’ai reçu le pot"
        confirmVariant="success"
        isProcessing={isRunning}
        onConfirm={onConfirmReceived}
        onCancel={() => setModal(null)}
      >
        Confirmez seulement si vous avez bien reçu{' '}
        {modal?.round && <AmountDisplay amount={modal.round.potAmount} className="fw-bold" />}.
        Cette confirmation est inscrite dans l’historique.
      </ConfirmModal>
    </>
  );
}

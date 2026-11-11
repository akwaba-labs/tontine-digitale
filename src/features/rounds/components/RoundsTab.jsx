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
  isGuestId,
} from '../../../shared/constants/domain';
import { formatDate } from '../../../shared/utils/formatDate';
import { confirmPayoutReceived, handOverPayout, markPayoutSent } from '../services/roundService';
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

  // Pot de l'organisateur lui-même ou d'un membre sans compte : remis en une seule action.
  const isDirectHandOver = (round) => round.beneficiaryId === uid || isGuestId(round.beneficiaryId);

  const onSendPayout = async ({ method, reference }) => {
    const { round } = modal;
    const direct = isDirectHandOver(round);
    const { ok } = await run(
      () =>
        direct
          ? handOverPayout(actor, tontine, round, { method, reference })
          : markPayoutSent(actor, tontine, round, { method, reference }),
      {
        success: direct
          ? 'Pot remis. La tontine passe au tour suivant.'
          : 'Versement enregistré. Dès que le bénéficiaire confirme la réception, la tontine passe au tour suivant.',
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
          const isGuestBeneficiary = isGuestId(round.beneficiaryId);
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
                        {isMine
                          ? 'Je prends le pot'
                          : isGuestBeneficiary
                            ? 'Remettre le pot'
                            : 'Verser le pot'}
                      </Button>
                    )}
                  {isActive &&
                    isOwner &&
                    isGuestBeneficiary &&
                    round.payoutStatus === PAYOUT_STATUS.SENT && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => setModal({ type: 'received', round })}
                      >
                        Pot remis en main propre
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
        title={
          modal?.round?.beneficiaryId === uid
            ? `Je prends le pot du tour n° ${modal?.round?.index ?? ''}`
            : `Pot du tour n° ${modal?.round?.index ?? ''}`
        }
        description={
          !modal
            ? ''
            : modal.round.beneficiaryId === uid
              ? 'C’est votre tour : le pot est enregistré comme pris, et la tontine passe automatiquement au tour suivant.'
              : isGuestId(modal.round.beneficiaryId)
                ? `Vous remettez le pot à ${modal.round.beneficiaryName} (sans compte). La tontine passera automatiquement au tour suivant.`
                : `Bénéficiaire : ${modal.round.beneficiaryName}. Dès qu’il aura confirmé la réception, la tontine passera automatiquement au tour suivant.`
        }
        amount={modal?.round?.potAmount}
        confirmLabel={
          modal && isDirectHandOver(modal.round)
            ? 'Valider la remise du pot'
            : 'Enregistrer le versement'
        }
        isProcessing={isRunning}
        onConfirm={onSendPayout}
        onCancel={() => setModal(null)}
      />
      <ConfirmModal
        show={modal?.type === 'received'}
        title={
          isGuestId(modal?.round?.beneficiaryId)
            ? `Confirmer la remise du pot à ${modal.round.beneficiaryName} ?`
            : 'Confirmer la réception du pot ?'
        }
        confirmLabel={
          isGuestId(modal?.round?.beneficiaryId) ? 'Oui, le pot est remis' : 'Oui, j’ai reçu le pot'
        }
        confirmVariant="success"
        isProcessing={isRunning}
        onConfirm={onConfirmReceived}
        onCancel={() => setModal(null)}
      >
        Confirmez seulement si{' '}
        {isGuestId(modal?.round?.beneficiaryId) ? 'le pot a bien été remis' : 'vous avez bien reçu'}{' '}
        {modal?.round && <AmountDisplay amount={modal.round.potAmount} className="fw-bold" />}.
        Cette confirmation est inscrite dans l’historique.
      </ConfirmModal>
    </>
  );
}

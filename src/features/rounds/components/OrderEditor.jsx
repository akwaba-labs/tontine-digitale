import { useState } from 'react';
import { Alert, Button, ListGroup } from 'react-bootstrap';
import { ArrowDown, ArrowUp, Dices, Save } from 'lucide-react';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { ORDER_MODE } from '../../../shared/constants/domain';
import { formatDate } from '../../../shared/utils/formatDate';
import { activeMembers } from '../../contributions/logic/contributions';
import { performDraw, setManualOrder } from '../../tontines/services/tontineService';
import { buildSlots, getDueDate, sumShares } from '../logic/schedule';
import { moveSlot, validatePayoutOrder } from '../logic/order';

function slotLabel(slot, sharesByMember) {
  return sharesByMember.get(slot.memberId) > 1
    ? `${slot.memberName} (part ${slot.shareNumber})`
    : slot.memberName;
}

/** Ordre de passage en préparation : choix manuel (monter / descendre) ou tirage au sort. */
export default function OrderEditor({ detail }) {
  const { tontine, members, isOwner, actor } = detail;
  const active = activeMembers(members);
  const sharesByMember = new Map(active.map((m) => [m.userId, m.shares]));
  const currentOrderValid = !validatePayoutOrder(
    tontine.payoutOrder ?? [],
    active,
    tontine.totalShares,
  );
  const [draft, setDraft] = useState(null);
  const order = draft ?? (currentOrderValid ? tontine.payoutOrder : buildSlots(active));
  const [showDraw, setShowDraw] = useState(false);
  const { run, isRunning } = useAsyncAction();
  const sharesComplete = sumShares(active) === tontine.totalShares;
  const isDrawn = Boolean(tontine.drawAt);
  const canEdit = isOwner && !isDrawn && tontine.orderMode === ORDER_MODE.MANUAL;

  const onDraw = async () => {
    const { ok } = await run(() => performDraw(actor, tontine.id, members), {
      success: 'Tirage au sort effectué et enregistré.',
    });
    if (ok) setShowDraw(false);
  };

  const onSave = async () => {
    const { ok } = await run(() => setManualOrder(actor, tontine, order), {
      success: 'Ordre enregistré.',
    });
    if (ok) setDraft(null);
  };

  const showOrder = isDrawn || canEdit || currentOrderValid;

  return (
    <>
      {isDrawn && (
        <Alert variant="success">
          Ordre tiré au sort et enregistré. Il ne peut plus être modifié.
        </Alert>
      )}
      {!isDrawn && tontine.orderMode === ORDER_MODE.DRAW && (
        <Alert variant="info">
          L’ordre sera tiré au sort dans l’application, une seule fois, quand toutes les parts
          seront attribuées. Le résultat et sa date seront visibles par tous dans l’historique.
        </Alert>
      )}
      {!sharesComplete && !isDrawn && (
        <Alert variant="warning">
          {sumShares(active)} part(s) attribuée(s) sur {tontine.totalShares}. Acceptez des membres
          ou ajustez les parts avant de fixer l’ordre.
        </Alert>
      )}

      {isOwner && !isDrawn && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          <Button onClick={() => setShowDraw(true)} disabled={!sharesComplete || isRunning}>
            <Dices size={18} className="me-1" aria-hidden="true" />
            Faire le tirage au sort
          </Button>
          {canEdit && (
            <Button
              variant="outline-primary"
              onClick={onSave}
              disabled={!sharesComplete || isRunning}
            >
              <Save size={18} className="me-1" aria-hidden="true" />
              Enregistrer cet ordre
            </Button>
          )}
        </div>
      )}

      {showOrder && order.length > 0 && (
        <ListGroup className="shadow-sm">
          {order.map((slot, i) => (
            <ListGroup.Item
              key={`${slot.memberId}-${slot.shareNumber}`}
              className="d-flex align-items-center gap-2"
            >
              <span className="badge text-bg-light border fs-6">{i + 1}</span>
              <div className="flex-grow-1">
                <div className="fw-semibold">{slotLabel(slot, sharesByMember)}</div>
                <div className="small text-secondary">
                  {formatDate(getDueDate(tontine.startDate, tontine.frequency, i + 1))}
                </div>
              </div>
              {canEdit && (
                <div className="btn-group">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    aria-label={`Monter ${slot.memberName}`}
                    disabled={i === 0}
                    onClick={() => setDraft(moveSlot(order, i, i - 1))}
                  >
                    <ArrowUp size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    aria-label={`Descendre ${slot.memberName}`}
                    disabled={i === order.length - 1}
                    onClick={() => setDraft(moveSlot(order, i, i + 1))}
                  >
                    <ArrowDown size={16} aria-hidden="true" />
                  </Button>
                </div>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}

      <ConfirmModal
        show={showDraw}
        title="Faire le tirage au sort ?"
        confirmLabel="Tirer au sort"
        isProcessing={isRunning}
        onConfirm={onDraw}
        onCancel={() => setShowDraw(false)}
      >
        Le tirage est définitif : le résultat est enregistré avec sa date dans l’historique et ne
        pourra pas être relancé. Les membres et leurs parts ne pourront plus changer.
      </ConfirmModal>
    </>
  );
}

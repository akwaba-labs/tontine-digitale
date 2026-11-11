import { useState } from 'react';
import { Button, Form, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router';
import { Receipt } from 'lucide-react';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import StatusBadge from '../../../shared/components/StatusBadge';
import EmptyState from '../../../shared/components/EmptyState';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import {
  CONTRIBUTION_STATUS,
  PAYMENT_METHODS,
  TONTINE_STATUS,
} from '../../../shared/constants/domain';
import { formatDate, formatDateTime } from '../../../shared/utils/formatDate';
import { formatAmount } from '../../../shared/utils/formatAmount';
import { declarePaymentPath } from '../../../app/routePaths';
import { canApplyPenalty, canDeclare, graceDeadline, summarizeRound } from '../logic/contributions';
import {
  applyPenalty,
  confirmPayment,
  recordPayment,
  rejectPayment,
} from '../services/contributionService';
import PaymentMethodModal from '../../rounds/components/PaymentMethodModal';
import RoundCollectionCard from './RoundCollectionCard';
import { depositLabel } from '../../rounds/logic/schedule';
import RejectModal from './RejectModal';
import ProofLink from './ProofLink';

function ContributionLine({ line, round, detail, onAction }) {
  const { tontine, uid, isManager, isOwner, today } = detail;
  const { member, contribution, status, due } = line;
  const isMe = member.userId === uid;
  const isActive = tontine.status === TONTINE_STATUS.ACTIVE;

  return (
    <ListGroup.Item className="py-3">
      <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
        <div>
          <div className="fw-semibold">
            {member.displayName}
            {isMe && <span className="text-primary"> (vous)</span>}
          </div>
          <AmountDisplay amount={due} />
          {contribution?.penaltyAmount > 0 && (
            <span className="small text-danger">
              {' '}
              dont pénalité {formatAmount(contribution.penaltyAmount)}
            </span>
          )}
          {contribution?.method && (
            <div className="small text-secondary">
              {PAYMENT_METHODS[contribution.method]}
              {contribution.reference ? ` · réf. ${contribution.reference}` : ''}
              {contribution.declaredAt ? ` · ${formatDateTime(contribution.declaredAt)}` : ''}
            </div>
          )}
          {status === CONTRIBUTION_STATUS.REJECTED && contribution?.rejectionReason && (
            <div className="small text-danger">Motif du rejet : {contribution.rejectionReason}</div>
          )}
          {contribution?.proofPath && <ProofLink path={contribution.proofPath} />}
        </div>
        <div className="d-flex flex-column align-items-end gap-2">
          <StatusBadge status={status} />
          {isActive && (
            <div className="d-flex flex-wrap justify-content-end gap-2">
              {isManager && status === CONTRIBUTION_STATUS.DECLARED && (
                <>
                  <Button size="sm" variant="success" onClick={() => onAction('confirm', line)}>
                    Confirmer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => onAction('reject', line)}
                  >
                    Rejeter
                  </Button>
                </>
              )}
              {isManager && canDeclare(status) && (
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => onAction('record', line)}
                >
                  Paiement reçu
                </Button>
              )}
              {isOwner && canApplyPenalty(contribution, round, tontine, today) && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => onAction('penalty', line)}
                >
                  Pénalité
                </Button>
              )}
              {isMe && canDeclare(status) && (
                <Link
                  to={declarePaymentPath(tontine.id, round.index)}
                  className="btn btn-sm btn-primary"
                >
                  Déclarer
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </ListGroup.Item>
  );
}

export default function ContributionsTab({ detail }) {
  const {
    tontine,
    rounds,
    members,
    contributionsById,
    deposits,
    currentDepositIndex,
    today,
    actor,
    isManager,
  } = detail;
  const [selected, setSelected] = useState(null);
  const [action, setAction] = useState(null);
  const { run, isRunning } = useAsyncAction();

  if (tontine.status === TONTINE_STATUS.DRAFT || rounds.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Pas encore de cotisations"
        message="Les cotisations commencent quand l’organisateur démarre la tontine."
      />
    );
  }

  // Dépôts visibles : jusqu'au dépôt en cours (on peut aussi payer le suivant à l'avance),
  // du plus récent au plus ancien.
  const lastVisible = Math.min(deposits.length, (currentDepositIndex ?? 1) + 1);
  const visibleDeposits = deposits.filter((d) => d.index <= lastVisible).reverse();
  const depositIndex = selected ?? currentDepositIndex ?? 1;
  // `round` : le dépôt choisi (avec un dépôt par tour, c'est le tour).
  const round = deposits.find((d) => d.index === depositIndex) ?? deposits[0];
  const manyPerRound = round.depositsInRound > 1;
  const summary = summarizeRound({ round, tontine, members, contributionsById, today });

  const close = () => setAction(null);
  const params = (line) => ({
    tontine,
    member: line.member,
    round,
    existing: line.contribution,
  });

  const handlers = {
    confirm: () =>
      run(() => confirmPayment(actor, tontine, action.line.contribution, round), {
        success: 'Paiement confirmé.',
      }),
    penalty: () =>
      run(() => applyPenalty(actor, params(action.line)), { success: 'Pénalité appliquée.' }),
  };

  const runAndClose = async (fn) => {
    const { ok } = await fn();
    if (ok) close();
  };

  return (
    <>
      <Form.Group className="mb-3" controlId="round-select">
        <Form.Label className="fw-semibold">{manyPerRound ? 'Dépôt' : 'Tour'}</Form.Label>
        <Form.Select
          value={round.index}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {visibleDeposits.map((d) =>
            d.depositsInRound > 1 ? (
              <option key={d.index} value={d.index}>
                {formatDate(d.dueDate)} — dépôt {d.numberInRound}/{d.depositsInRound} du tour n°{' '}
                {d.roundIndex} ({d.beneficiaryName})
                {d.index === currentDepositIndex ? ' · en cours' : ''}
              </option>
            ) : (
              <option key={d.index} value={d.index}>
                Tour n° {d.index} — {formatDate(d.dueDate)} — {d.beneficiaryName}
                {d.index === currentDepositIndex ? ' (en cours)' : ''}
              </option>
            ),
          )}
        </Form.Select>
        <Form.Text>
          Échéance le {formatDate(round.dueDate)} · en retard après le{' '}
          {formatDate(graceDeadline(round.dueDate, tontine.graceDays))}
          {tontine.penaltyAmount > 0 && ` · pénalité ${formatAmount(tontine.penaltyAmount)}`}
        </Form.Text>
      </Form.Group>

      {isManager && <RoundCollectionCard detail={detail} round={round} />}

      <ListGroup className="shadow-sm">
        {summary.lines.map((line) => (
          <ContributionLine
            key={line.member.userId}
            line={line}
            round={round}
            detail={detail}
            onAction={(type, l) => setAction({ type, line: l })}
          />
        ))}
      </ListGroup>

      <ConfirmModal
        show={action?.type === 'confirm'}
        title="Confirmer ce paiement ?"
        confirmLabel="Confirmer"
        confirmVariant="success"
        isProcessing={isRunning}
        onCancel={close}
        onConfirm={() => runAndClose(handlers.confirm)}
      >
        Confirmez seulement si vous avez bien reçu{' '}
        {action?.line && <AmountDisplay amount={action.line.due} className="fw-bold" />} de{' '}
        {action?.line?.member.displayName}.
      </ConfirmModal>
      <RejectModal
        key={action?.type === 'reject' ? action.line.member.userId : 'none'}
        show={action?.type === 'reject'}
        memberName={action?.line?.member.displayName}
        isProcessing={isRunning}
        onCancel={close}
        onConfirm={(reason) =>
          runAndClose(() =>
            run(() => rejectPayment(actor, tontine, action.line.contribution, reason, round), {
              success: 'Paiement rejeté. Le membre est prévenu.',
            }),
          )
        }
      />
      <PaymentMethodModal
        key={action?.type === 'record' ? `record-${action.line.member.userId}` : 'record-none'}
        show={action?.type === 'record'}
        title={`Paiement reçu de ${action?.line?.member.displayName ?? ''}`}
        description="Le paiement vous a été remis directement : il sera enregistré et confirmé."
        amount={action?.line?.due}
        confirmLabel="Enregistrer et confirmer"
        isProcessing={isRunning}
        onCancel={close}
        onConfirm={({ method, reference }) =>
          runAndClose(() =>
            run(() => recordPayment(actor, { ...params(action.line), method, reference }), {
              success: 'Paiement enregistré.',
            }),
          )
        }
      />
      <ConfirmModal
        show={action?.type === 'penalty'}
        title="Appliquer la pénalité de retard ?"
        confirmLabel="Appliquer"
        confirmVariant="danger"
        isProcessing={isRunning}
        onCancel={close}
        onConfirm={() => runAndClose(handlers.penalty)}
      >
        {action?.line?.member.displayName} devra payer{' '}
        <AmountDisplay amount={tontine.penaltyAmount} className="fw-bold" /> en plus pour le{' '}
        {depositLabel(round)}. Cette pénalité ne peut être appliquée qu’une fois et sera inscrite
        dans l’historique.
      </ConfirmModal>
    </>
  );
}

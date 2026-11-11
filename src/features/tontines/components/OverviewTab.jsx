import { useState } from 'react';
import { Button, Card, Col, ProgressBar, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { Flag, LogOut } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import ConfirmModal from '../../../shared/components/ConfirmModal';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { PAYOUT_STATUS, TONTINE_STATUS } from '../../../shared/constants/domain';
import { formatDate } from '../../../shared/utils/formatDate';
import { activeMembers, summarizeMember } from '../../contributions/logic/contributions';
import { areAllPayoutsReceived, sumShares } from '../../rounds/logic/schedule';
import { leaveTontine } from '../../members/services/memberService';
import RoundCollectionCard from '../../contributions/components/RoundCollectionCard';
import MemberSummaryCard from '../../dashboard/components/MemberSummaryCard';
import { closeTontine } from '../services/tontineService';
import InvitePanel from './InvitePanel';
import StartPanel from './StartPanel';
import TontineInfoCard from './TontineInfoCard';
import ExportButtons from './ExportButtons';

function ProgressCard({ detail }) {
  const { tontine, rounds, currentRound } = detail;
  const done = rounds.filter((round) => round.payoutStatus === PAYOUT_STATUS.RECEIVED).length;
  return (
    <Card className="shadow-sm mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between mb-1">
          <h2 className="h6 fw-bold mb-0">Progression</h2>
          <span className="small fw-semibold">
            {done} tour{done > 1 ? 's' : ''} terminé{done > 1 ? 's' : ''} sur {tontine.totalShares}
          </span>
        </div>
        <ProgressBar
          now={(done / tontine.totalShares) * 100}
          className="mb-3"
          aria-label="Progression de la tontine"
        />
        {currentRound && tontine.status === TONTINE_STATUS.ACTIVE && (
          <div className="p-3 rounded round-current">
            <div className="small text-secondary">
              Tour en cours · n° {currentRound.index} · échéance {formatDate(currentRound.dueDate)}
            </div>
            <div className="fs-5">
              <strong>{currentRound.beneficiaryName}</strong> reçoit{' '}
              <AmountDisplay amount={currentRound.potAmount} className="fw-bold text-primary" />
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function DraftSharesCard({ detail }) {
  const { tontine, members } = detail;
  const used = sumShares(activeMembers(members));
  return (
    <Card className="shadow-sm mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between mb-1">
          <h2 className="h6 fw-bold mb-0">Parts attribuées</h2>
          <span className="small fw-semibold">
            {used} / {tontine.totalShares}
          </span>
        </div>
        <ProgressBar
          now={Math.min(100, (used / tontine.totalShares) * 100)}
          variant={used === tontine.totalShares ? 'success' : 'warning'}
          aria-label="Parts attribuées"
        />
      </Card.Body>
    </Card>
  );
}

export default function OverviewTab({ detail }) {
  const { tontine, me, isOwner, isManager, rounds, currentRound, actor } = detail;
  const { run, isRunning } = useAsyncAction();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const isDraft = tontine.status === TONTINE_STATUS.DRAFT;
  const isActive = tontine.status === TONTINE_STATUS.ACTIVE;
  const canComplete = isOwner && isActive && areAllPayoutsReceived(rounds, tontine.totalShares);

  const memberSummary =
    me && !isDraft
      ? summarizeMember({
          userId: detail.uid,
          tontine,
          member: me,
          rounds,
          contributionsById: detail.contributionsById,
          currentRoundIndex: detail.currentRoundIndex,
          today: detail.today,
        })
      : null;

  return (
    <Row className="g-3">
      <Col lg={7}>
        {isDraft && <DraftSharesCard detail={detail} />}
        {isDraft && isOwner && <StartPanel detail={detail} />}
        {isDraft && !isOwner && (
          <Card className="shadow-sm mb-3">
            <Card.Body>
              La tontine est en préparation. L’organisateur la démarrera quand toutes les parts
              seront attribuées et l’ordre de passage fixé.
            </Card.Body>
          </Card>
        )}
        {!isDraft && <ProgressCard detail={detail} />}
        {canComplete && (
          <Card className="shadow-sm mb-3 border-success">
            <Card.Body className="d-flex flex-wrap justify-content-between align-items-center gap-2">
              <span>Tous les pots ont été reçus. Vous pouvez clôturer la tontine.</span>
              <Button variant="success" onClick={() => setModal('complete')}>
                <Flag size={18} className="me-1" aria-hidden="true" />
                Clôturer
              </Button>
            </Card.Body>
          </Card>
        )}
        {memberSummary && isActive && (
          <MemberSummaryCard tontine={tontine} summary={memberSummary} />
        )}
        {isManager && isActive && currentRound && (
          <RoundCollectionCard detail={detail} round={currentRound} />
        )}
        {memberSummary && !isActive && (
          <MemberSummaryCard tontine={tontine} summary={memberSummary} title="Mon bilan" />
        )}
      </Col>
      <Col lg={5}>
        {isDraft && <InvitePanel tontine={tontine} />}
        <TontineInfoCard tontine={tontine} />
        {!isDraft && <ExportButtons detail={detail} />}
        {isDraft && me && !isOwner && !tontine.drawAt && (
          <Button variant="outline-danger" className="w-100" onClick={() => setModal('leave')}>
            <LogOut size={18} className="me-1" aria-hidden="true" />
            Quitter la tontine
          </Button>
        )}
      </Col>

      <ConfirmModal
        show={modal === 'complete'}
        title="Clôturer la tontine ?"
        confirmLabel="Clôturer"
        confirmVariant="success"
        isProcessing={isRunning}
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          const { ok } = await run(() => closeTontine(actor, tontine, TONTINE_STATUS.COMPLETED), {
            success: 'Tontine clôturée. Bravo à tous !',
          });
          if (ok) setModal(null);
        }}
      >
        Tous les tours sont terminés. La tontine passera au statut « Terminée » ; l’historique reste
        consultable par tous les membres.
      </ConfirmModal>
      <ConfirmModal
        show={modal === 'leave'}
        title="Quitter la tontine ?"
        confirmLabel="Quitter"
        confirmVariant="danger"
        isProcessing={isRunning}
        onCancel={() => setModal(null)}
        onConfirm={async () => {
          const { ok } = await run(() => leaveTontine(actor, tontine, me), {
            success: 'Vous avez quitté la tontine.',
          });
          if (ok) navigate(ROUTES.tontines);
        }}
      >
        Vous ne ferez plus partie de « {tontine.name} ». Pour revenir, il faudra refaire une
        demande.
      </ConfirmModal>
    </Row>
  );
}

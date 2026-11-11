import { Card, Col, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import StatusBadge from '../../../shared/components/StatusBadge';
import { formatDate } from '../../../shared/utils/formatDate';
import { declarePaymentPath } from '../../../app/routePaths';
import { CONTRIBUTION_STATUS } from '../../../shared/constants/domain';
import { depositLabel } from '../../rounds/logic/schedule';

/** Situation personnelle d'un membre dans une tontine. `summary` = summarizeMember(). */
export default function MemberSummaryCard({ tontine, summary, title = 'Ma situation' }) {
  const { nextDue, nextPayout, totalPaid, totalReceived, lateCount } = summary;
  return (
    <Card className="shadow-sm mb-3">
      <Card.Body>
        <h2 className="h6 fw-bold mb-3">{title}</h2>
        {nextDue ? (
          <div
            className={`p-3 rounded mb-3 ${nextDue.status === CONTRIBUTION_STATUS.LATE ? 'bg-danger-subtle' : 'bg-light'}`}
          >
            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <div>
                <div className="small text-secondary">
                  Prochaine cotisation · {depositLabel(nextDue.round)}
                </div>
                <div className="fs-5 fw-bold">
                  <AmountDisplay amount={nextDue.amount} />
                </div>
                <div className="small">avant le {formatDate(nextDue.round.dueDate)}</div>
              </div>
              <div className="d-flex flex-column align-items-end gap-2">
                <StatusBadge status={nextDue.status} />
                <Link
                  to={declarePaymentPath(tontine.id, nextDue.round.index)}
                  className="btn btn-primary btn-sm"
                >
                  Déclarer
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-success fw-semibold">Vous êtes à jour de vos cotisations.</p>
        )}
        {nextPayout && (
          <p className="mb-3">
            Votre tour : n° {nextPayout.index}, le <strong>{formatDate(nextPayout.dueDate)}</strong>{' '}
            — <AmountDisplay amount={nextPayout.potAmount} className="fw-bold text-primary" />
          </p>
        )}
        <Row xs={3} className="text-center g-2">
          <Col>
            <div className="small text-secondary">Versé</div>
            <AmountDisplay amount={totalPaid} className="fw-semibold" />
          </Col>
          <Col>
            <div className="small text-secondary">Reçu</div>
            <AmountDisplay amount={totalReceived} className="fw-semibold" />
          </Col>
          <Col>
            <div className="small text-secondary">Retards</div>
            <span className={`fw-semibold ${lateCount ? 'text-danger' : ''}`}>{lateCount}</span>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

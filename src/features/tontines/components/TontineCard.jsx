import { Card } from 'react-bootstrap';
import { Link } from 'react-router';
import { ChevronRight, Crown, Users } from 'lucide-react';
import StatusBadge from '../../../shared/components/StatusBadge';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import { FREQUENCY_LABELS } from '../../../shared/constants/domain';
import { tontineDetailPath } from '../../../app/routePaths';

export default function TontineCard({ tontine, uid, children }) {
  const isOwner = tontine.ownerId === uid;
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h3 className="h6 fw-bold mb-0">
            <Link
              to={tontineDetailPath(tontine.id)}
              className="stretched-link text-reset text-decoration-none"
            >
              {tontine.name}
            </Link>
          </h3>
          <StatusBadge kind="tontine" status={tontine.status} />
        </div>
        <p className="mb-1">
          <AmountDisplay amount={tontine.amount} className="fw-semibold" /> ·{' '}
          {FREQUENCY_LABELS[tontine.frequency].toLowerCase()}
        </p>
        <p className="small text-secondary mb-0 d-flex align-items-center gap-3">
          <span className="d-inline-flex align-items-center gap-1">
            <Users size={16} aria-hidden="true" /> {tontine.memberIds.length} membre(s) ·{' '}
            {tontine.totalShares} tours
          </span>
          {isOwner && (
            <span className="d-inline-flex align-items-center gap-1 text-warning-emphasis">
              <Crown size={16} aria-hidden="true" /> Organisateur
            </span>
          )}
        </p>
        {children}
      </Card.Body>
      <ChevronRight
        className="position-absolute end-0 bottom-0 m-3 text-secondary"
        size={20}
        aria-hidden="true"
      />
    </Card>
  );
}

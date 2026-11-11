import { Badge } from 'react-bootstrap';
import { getStatusDisplay } from '../utils/statusLabels';

/**
 * Pastille de statut avec libellé en français.
 * `kind` : contribution (défaut), tontine, member, round ou payout.
 */
export default function StatusBadge({ status, kind = 'contribution', className = '' }) {
  const { label, variant } = getStatusDisplay(status, kind);
  const textColor = variant === 'warning' ? 'dark' : undefined;
  return (
    <Badge bg={variant} text={textColor} pill className={`px-3 py-2 ${className}`.trim()}>
      {label}
    </Badge>
  );
}

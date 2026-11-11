import { Badge } from 'react-bootstrap';
import { getStatusDisplay } from '../utils/statusLabels';

/** Pastille de statut (cotisation ou tontine) avec libellé en français. */
export default function StatusBadge({ status }) {
  const { label, variant } = getStatusDisplay(status);
  const textColor = variant === 'warning' ? 'dark' : undefined;
  return (
    <Badge bg={variant} text={textColor} pill className="px-3 py-2">
      {label}
    </Badge>
  );
}

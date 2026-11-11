import { Fragment } from 'react';
import { Card } from 'react-bootstrap';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import { FREQUENCY_LABELS, ORDER_MODE } from '../../../shared/constants/domain';
import { formatDate, formatDateTime } from '../../../shared/utils/formatDate';
import { payoutRhythmLabel, potAmountOf } from '../../rounds/logic/schedule';

export default function TontineInfoCard({ tontine }) {
  const rows = [
    ['Dépôt par part', <AmountDisplay key="a" amount={tontine.amount} />],
    ['Fréquence des dépôts', FREQUENCY_LABELS[tontine.frequency]],
    ['Remise du pot', payoutRhythmLabel(tontine)],
    ['Premier dépôt', formatDate(tontine.startDate)],
    ['Nombre de tours', tontine.totalShares],
    ['Pot de chaque tour', <AmountDisplay key="p" amount={potAmountOf(tontine)} />],
    ['Délai de grâce', `${tontine.graceDays} jour${tontine.graceDays > 1 ? 's' : ''}`],
    [
      'Pénalité de retard',
      tontine.penaltyAmount ? <AmountDisplay key="r" amount={tontine.penaltyAmount} /> : 'Aucune',
    ],
    [
      'Ordre des tours',
      tontine.drawAt
        ? `Tiré au sort le ${formatDateTime(tontine.drawAt)}`
        : tontine.orderMode === ORDER_MODE.DRAW
          ? 'Tirage au sort (pas encore fait)'
          : 'Choisi par l’organisateur',
    ],
    ['Organisateur', tontine.ownerName],
  ];
  return (
    <Card className="shadow-sm mb-3">
      <Card.Body>
        <h2 className="h6 fw-bold mb-3">Règles de la tontine</h2>
        {tontine.description && <p className="text-secondary">{tontine.description}</p>}
        <dl className="row mb-0 small">
          {rows.map(([label, value]) => (
            <Fragment key={label}>
              <dt className="col-6 fw-normal text-secondary">{label}</dt>
              <dd className="col-6">{value}</dd>
            </Fragment>
          ))}
        </dl>
      </Card.Body>
    </Card>
  );
}

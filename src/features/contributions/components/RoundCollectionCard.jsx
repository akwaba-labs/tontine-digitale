import { Card, ListGroup, ProgressBar } from 'react-bootstrap';
import { MessageCircle } from 'lucide-react';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import { formatDate } from '../../../shared/utils/formatDate';
import { buildReminderMessage, whatsappShareLink } from '../../../shared/utils/whatsapp';
import { tontineDetailPath } from '../../../app/routePaths';
import { summarizeRound } from '../logic/contributions';

/** Vue organisateur d'un tour : taux de paiement, pot collecté / attendu, retardataires. */
export default function RoundCollectionCard({ detail, round }) {
  const { tontine, members, contributionsById, today, isManager } = detail;
  const summary = summarizeRound({ round, tontine, members, contributionsById, today });
  const tontineUrl = `${window.location.origin}${tontineDetailPath(tontine.id)}`;

  return (
    <Card className="shadow-sm mb-3">
      <Card.Body>
        <div className="d-flex justify-content-between flex-wrap gap-2 mb-2">
          <h2 className="h6 fw-bold mb-0">
            Tour n° {round.index} sur {tontine.totalShares} · {formatDate(round.dueDate)}
          </h2>
          <span className="small">
            Bénéficiaire : <strong>{round.beneficiaryName}</strong>
          </span>
        </div>
        <div className="d-flex justify-content-between small mb-1">
          <span>
            Collecté : <AmountDisplay amount={summary.collectedContributions} className="fw-bold" />{' '}
            / <AmountDisplay amount={summary.expected} />
          </span>
          <span className="fw-semibold">{summary.paymentRate} %</span>
        </div>
        <ProgressBar
          now={summary.paymentRate}
          variant={summary.paymentRate === 100 ? 'success' : 'warning'}
          aria-label={`Taux de paiement ${summary.paymentRate} %`}
          className="mb-2"
          style={{ height: '0.75rem' }}
        />
        <p className="small text-secondary mb-2">
          {summary.confirmedCount} confirmé(s) · {summary.declaredCount} à confirmer ·{' '}
          {summary.lateLines.length} en retard · {summary.memberCount} membres
        </p>

        {summary.lateLines.length > 0 && (
          <>
            <h3 className="h6 text-danger mt-3">Retardataires</h3>
            <ListGroup variant="flush" className="mb-3">
              {summary.lateLines.map((line) => (
                <ListGroup.Item
                  key={line.member.userId}
                  className="d-flex justify-content-between px-0"
                >
                  <span>{line.member.displayName}</span>
                  <AmountDisplay amount={line.due} className="text-danger fw-semibold" />
                </ListGroup.Item>
              ))}
            </ListGroup>
            {isManager && (
              <a
                className="btn btn-success w-100"
                href={whatsappShareLink(
                  buildReminderMessage({
                    tontine,
                    round,
                    lateLines: summary.lateLines,
                    tontineUrl,
                  }),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={18} className="me-1" aria-hidden="true" />
                Relancer sur WhatsApp
              </a>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
}

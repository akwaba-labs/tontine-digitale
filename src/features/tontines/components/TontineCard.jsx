import { Link } from 'react-router';
import { ArrowUpRight, CalendarDays, Crown, Users } from 'lucide-react';
import StatusBadge from '../../../shared/components/StatusBadge';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import { FREQUENCY_LABELS } from '../../../shared/constants/domain';
import { tontineDetailPath } from '../../../app/routePaths';
import { potAmountOf } from '../../rounds/logic/schedule';

/**
 * Carte d'une tontine : statut, rôle, dépôt, pot et progression des tours.
 * `progress` (facultatif) : { completed, total } ; `children` : situation de l'utilisateur.
 */
export default function TontineCard({ tontine, uid, progress, children }) {
  const isOwner = tontine.ownerId === uid;
  const isCoOrganizer = (tontine.coOrganizerIds ?? []).includes(uid);
  const percent = progress?.total ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <article className={`tontine-card tontine-card--${tontine.status.toLowerCase()}`}>
      <div className="tontine-card__top">
        <StatusBadge kind="tontine" status={tontine.status} />
        <span className="tontine-card__role">
          {isOwner ? (
            <>
              <Crown size={14} aria-hidden="true" /> Organisateur
            </>
          ) : isCoOrganizer ? (
            'Co-organisateur'
          ) : (
            'Membre'
          )}
        </span>
      </div>
      <h3 className="tontine-card__title">
        <Link to={tontineDetailPath(tontine.id)} className="stretched-link">
          {tontine.name}
        </Link>
      </h3>
      <div className="tontine-card__figures">
        <div>
          <div className="tontine-card__label">Dépôt</div>
          <AmountDisplay amount={tontine.amount} className="fw-bold" />
          <div className="tontine-card__sub">{FREQUENCY_LABELS[tontine.frequency]}</div>
        </div>
        <div>
          <div className="tontine-card__label">Pot</div>
          <AmountDisplay amount={potAmountOf(tontine)} className="fw-bold text-primary" />
          <div className="tontine-card__sub">par tour</div>
        </div>
      </div>
      <div className="tontine-card__meta">
        <span>
          <Users size={15} aria-hidden="true" /> {tontine.memberIds.length} membre
          {tontine.memberIds.length > 1 ? 's' : ''}
        </span>
        <span>
          <CalendarDays size={15} aria-hidden="true" /> {tontine.totalShares} tours
        </span>
      </div>
      {progress && (
        <div className="tontine-card__progress">
          <div className="d-flex justify-content-between small mb-1">
            <span>Tours terminés</span>
            <span className="fw-semibold">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <div className="mini-progress" aria-hidden="true">
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
      {children && <div className="tontine-card__footer">{children}</div>}
      <ArrowUpRight className="tontine-card__arrow" size={18} aria-hidden="true" />
    </article>
  );
}

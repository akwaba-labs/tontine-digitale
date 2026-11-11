import { useState } from 'react';
import { Button, Card } from 'react-bootstrap';
import { Copy, Share2, UserPlus } from 'lucide-react';
import { useInviteLink } from '../../tontines/hooks/useInviteLink';
import { activeMembers } from '../../contributions/logic/contributions';
import { sumShares } from '../../rounds/logic/schedule';
import AddGuestModal from './AddGuestModal';

/**
 * Les deux façons d'ajouter des membres, réunies : inviter (la personne crée son compte)
 * ou ajouter directement quelqu'un qui n'a pas de compte.
 */
export default function AddMembersBar({ detail, compact = false }) {
  const { tontine, members, actor } = detail;
  const { whatsappHref, copy } = useInviteLink(tontine);
  const [showGuest, setShowGuest] = useState(false);
  const freeShares = tontine.totalShares - sumShares(activeMembers(members));
  const isFull = freeShares <= 0;

  const buttons = (
    <div className="d-grid d-sm-flex flex-wrap gap-2">
      <a
        className={`btn btn-success ${isFull ? 'disabled' : ''}`}
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-disabled={isFull}
      >
        <Share2 size={18} className="me-1" aria-hidden="true" />
        Inviter sur WhatsApp
      </a>
      {!compact && (
        <Button variant="outline-primary" onClick={copy} disabled={isFull}>
          <Copy size={18} className="me-1" aria-hidden="true" />
          Copier le lien
        </Button>
      )}
      <Button variant="outline-primary" onClick={() => setShowGuest(true)} disabled={isFull}>
        <UserPlus size={18} className="me-1" aria-hidden="true" />
        Ajouter sans compte
      </Button>
    </div>
  );

  return (
    <>
      {compact ? (
        buttons
      ) : (
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <h2 className="h6 fw-bold mb-1">Ajouter des membres</h2>
            <p className="small text-secondary mb-3">
              {isFull
                ? 'Toutes les parts sont attribuées.'
                : `${freeShares} part${freeShares > 1 ? 's' : ''} encore libre${freeShares > 1 ? 's' : ''}. Invitez les personnes qui ont un téléphone : elles créent leur compte avec le code ${tontine.inviteCode}. Pour les autres, ajoutez-les vous-même.`}
            </p>
            {buttons}
          </Card.Body>
        </Card>
      )}
      {showGuest && (
        <AddGuestModal
          show
          onHide={() => setShowGuest(false)}
          tontine={tontine}
          members={members}
          actor={actor}
          freeShares={freeShares}
        />
      )}
    </>
  );
}

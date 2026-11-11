import { Button, Card } from 'react-bootstrap';
import { Copy, Share2 } from 'lucide-react';
import { useToast } from '../../../shared/hooks/useToast';
import { buildInviteMessage, whatsappShareLink } from '../../../shared/utils/whatsapp';
import { joinPath } from '../../../app/routePaths';

export default function InvitePanel({ tontine }) {
  const { showSuccess, showError } = useToast();
  const inviteUrl = `${window.location.origin}${joinPath(tontine.inviteCode)}`;
  const message = buildInviteMessage({ tontine, inviteUrl });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showSuccess('Lien copié.');
    } catch {
      showError('Copie impossible : sélectionnez le lien à la main.');
    }
  };

  return (
    <Card className="shadow-sm mb-3 border-primary">
      <Card.Body>
        <h2 className="h6 fw-bold">Inviter des membres</h2>
        <p className="small text-secondary mb-2">
          Partagez le code ou le lien. Vous accepterez chaque demande.
        </p>
        <p
          className="display-6 fw-bold text-primary text-center letter-spacing mb-2"
          aria-label={`Code ${tontine.inviteCode.split('').join(' ')}`}
        >
          {tontine.inviteCode}
        </p>
        <p className="small text-center text-break mb-3">{inviteUrl}</p>
        <div className="d-grid d-sm-flex gap-2">
          <a
            className="btn btn-success flex-grow-1"
            href={whatsappShareLink(message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Share2 size={18} className="me-1" aria-hidden="true" />
            Partager sur WhatsApp
          </a>
          <Button variant="outline-primary" onClick={copy}>
            <Copy size={18} className="me-1" aria-hidden="true" />
            Copier le lien
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

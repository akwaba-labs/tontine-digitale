import { useToast } from '../../../shared/hooks/useToast';
import { buildInviteMessage, whatsappShareLink } from '../../../shared/utils/whatsapp';
import { joinPath } from '../../../app/routePaths';

/** Lien d'invitation d'une tontine : URL, partage WhatsApp et copie. */
export function useInviteLink(tontine) {
  const { showSuccess, showError } = useToast();
  const inviteUrl = `${window.location.origin}${joinPath(tontine.inviteCode)}`;
  const whatsappHref = whatsappShareLink(buildInviteMessage({ tontine, inviteUrl }));

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showSuccess('Lien copié.');
    } catch {
      showError('Copie impossible : sélectionnez le lien à la main.');
    }
  };

  return { inviteUrl, whatsappHref, copy };
}

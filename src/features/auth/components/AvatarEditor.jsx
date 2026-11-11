import { useRef } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { Camera, Trash2, UserRound } from 'lucide-react';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { useToast } from '../../../shared/hooks/useToast';
import { removeAvatar, uploadAvatar } from '../services/userService';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function AvatarEditor({ uid, photoURL }) {
  const inputRef = useRef(null);
  const { run, isRunning } = useAsyncAction();
  const { showError } = useToast();

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      showError('Choisissez une image (JPEG, PNG ou WebP).');
      return;
    }
    run(() => uploadAvatar(uid, file), { success: 'Photo mise à jour.' });
  };

  return (
    <div className="d-flex align-items-center gap-3 mb-4">
      <div
        className="rounded-circle bg-light border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0"
        style={{ width: 80, height: 80 }}
      >
        {isRunning ? (
          <Spinner animation="border" variant="primary" size="sm" />
        ) : photoURL ? (
          <img
            src={photoURL}
            alt="Votre photo de profil"
            width="80"
            height="80"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <UserRound size={40} className="text-secondary" aria-hidden="true" />
        )}
      </div>
      <div className="d-flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          className="d-none"
          onChange={onFileChange}
          aria-label="Choisir une photo de profil"
        />
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={isRunning}
        >
          <Camera size={16} className="me-1" aria-hidden="true" />
          {photoURL ? 'Changer la photo' : 'Ajouter une photo'}
        </Button>
        {photoURL && (
          <Button
            variant="outline-danger"
            size="sm"
            disabled={isRunning}
            onClick={() => run(() => removeAvatar(uid), { success: 'Photo supprimée.' })}
          >
            <Trash2 size={16} className="me-1" aria-hidden="true" />
            Retirer
          </Button>
        )}
      </div>
    </div>
  );
}

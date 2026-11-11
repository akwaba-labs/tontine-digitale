import { useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import TextField from '../../../shared/components/form/TextField';
import SubmitButton from '../../../shared/components/form/SubmitButton';
import FormError from '../../../shared/components/FormError';
import { useToast } from '../../../shared/hooks/useToast';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { normalizePhone } from '../../../shared/utils/formatPhone';
import { LIMITS } from '../../../shared/constants/domain';
import { guestSchema } from '../logic/guestSchema';
import { addGuestMember } from '../services/memberService';

/** L'organisateur ajoute une personne qui n'a pas de compte (ni smartphone, parfois). */
export default function AddGuestModal({ show, onHide, tontine, members, actor, freeShares }) {
  const { showSuccess } = useToast();
  const [formError, setFormError] = useState('');
  const maxShares = Math.max(1, Math.min(LIMITS.maxSharesPerMember, freeShares));
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(guestSchema(maxShares)),
    defaultValues: { displayName: '', phone: '', email: '', shares: 1 },
  });

  const close = () => {
    if (isSubmitting) return;
    reset();
    setFormError('');
    onHide();
  };

  const onSubmit = async ({ displayName, phone, email, shares }) => {
    setFormError('');
    try {
      await addGuestMember(actor, tontine, members, {
        displayName: displayName.trim(),
        phone: phone ? normalizePhone(phone) : '',
        email: email?.trim().toLowerCase() || '',
        shares: Number(shares),
      });
      showSuccess(`${displayName.trim()} fait maintenant partie de la tontine.`);
      reset();
      onHide();
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <Modal show={show} onHide={close} centered>
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton={!isSubmitting}>
          <Modal.Title as="h2" className="h5">
            Ajouter un membre sans compte
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="light" className="small border">
            Pour une personne qui n’utilisera pas l’application (pas de smartphone, pas
            d’internet…). Vous enregistrerez vous-même ses paiements quand elle vous les remet.
          </Alert>
          <FormError message={formError} />
          <TextField
            label="Nom complet"
            registration={register('displayName')}
            error={errors.displayName}
            autoComplete="off"
            autoFocus
          />
          <TextField
            label="Téléphone (facultatif)"
            type="tel"
            inputMode="tel"
            placeholder="07 07 07 07 07"
            registration={register('phone')}
            error={errors.phone}
            help="Visible par les membres de la tontine."
          />
          <TextField
            label="E-mail (facultatif)"
            type="email"
            inputMode="email"
            registration={register('email')}
            error={errors.email}
            help="Pour qu’elle reçoive les nouvelles de la tontine par e-mail. Visible par vous seul."
          />
          <TextField
            label="Nombre de parts"
            as="select"
            registration={register('shares')}
            error={errors.shares}
            className="mb-0"
          >
            {Array.from({ length: maxShares }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} part{n > 1 ? 's' : ''}
              </option>
            ))}
          </TextField>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={close} disabled={isSubmitting}>
            Annuler
          </Button>
          <SubmitButton isSubmitting={isSubmitting} className="">
            Ajouter
          </SubmitButton>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

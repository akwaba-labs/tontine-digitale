import { useState } from 'react';
import { Button, Card, Col, Form, Modal, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { LogOut, Trash2 } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import PasswordField from '../../../shared/components/form/PasswordField';
import SubmitButton from '../../../shared/components/form/SubmitButton';
import FormError from '../../../shared/components/FormError';
import { useToast } from '../../../shared/hooks/useToast';
import { useAuth } from '../../../shared/hooks/useAuth';
import { setEmailNotifications } from '../services/userService';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { changePasswordSchema, deleteAccountSchema } from '../logic/schemas';
import { changePassword, deleteAccount, logout } from '../services/authService';
import PrivacyNotice from '../components/PrivacyNotice';

function ChangePasswordForm() {
  const { showSuccess } = useToast();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', newPasswordConfirmation: '' },
  });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await changePassword(values);
      reset();
      showSuccess('Mot de passe modifié.');
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <Form noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormError message={formError} />
      <PasswordField
        label="Mot de passe actuel"
        registration={register('currentPassword')}
        error={errors.currentPassword}
      />
      <PasswordField
        label="Nouveau mot de passe"
        autoComplete="new-password"
        registration={register('newPassword')}
        error={errors.newPassword}
      />
      <PasswordField
        label="Confirmer le nouveau mot de passe"
        autoComplete="new-password"
        registration={register('newPasswordConfirmation')}
        error={errors.newPasswordConfirmation}
      />
      <SubmitButton isSubmitting={isSubmitting} className="">
        Modifier le mot de passe
      </SubmitButton>
    </Form>
  );
}

function DeleteAccountModal({ show, onHide }) {
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(deleteAccountSchema), defaultValues: { password: '' } });

  const onSubmit = async ({ password }) => {
    setFormError('');
    try {
      await deleteAccount(password);
      navigate(ROUTES.home, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <Modal show={show} onHide={isSubmitting ? undefined : onHide} centered>
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton={!isSubmitting}>
          <Modal.Title as="h2" className="h5">
            Supprimer mon compte
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Votre profil (nom, téléphone, e-mail, photo) sera définitivement effacé et vous ne
            pourrez plus vous connecter. L’historique de vos tontines reste visible par les autres
            membres.
          </p>
          <FormError message={formError} />
          <PasswordField
            label="Mot de passe"
            registration={register('password')}
            error={errors.password}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide} disabled={isSubmitting}>
            Annuler
          </Button>
          <SubmitButton isSubmitting={isSubmitting} variant="danger" className="">
            Supprimer définitivement
          </SubmitButton>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function EmailPreference() {
  const { user, profile } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const enabled = profile?.emailNotifications !== false;

  const onChange = async (event) => {
    setIsSaving(true);
    try {
      await setEmailNotifications(user.uid, event.target.checked);
      showSuccess(event.target.checked ? 'E-mails activés.' : 'E-mails désactivés.');
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Form.Check
        type="switch"
        id="email-notifications"
        label="Recevoir un e-mail à chaque nouvelle activité"
        checked={enabled}
        disabled={isSaving || !profile}
        onChange={onChange}
      />
      <Form.Text>
        Paiements déclarés ou confirmés, nouveaux membres, tirage au sort, versement du pot… Envoyé
        à {user?.email}.
      </Form.Text>
    </>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [showDelete, setShowDelete] = useState(false);

  const onLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.home, { replace: true });
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader title="Paramètres" />
      <Row className="g-4">
        <Col lg={6}>
          <Card className="shadow-sm h-100">
            <Card.Body className="p-4">
              <h2 className="h5 mb-3">Mot de passe</h2>
              <ChangePasswordForm />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="shadow-sm mb-4">
            <Card.Body className="p-4">
              <h2 className="h5 mb-3">E-mails</h2>
              <EmailPreference />
            </Card.Body>
          </Card>
          <Card className="shadow-sm mb-4">
            <Card.Body className="p-4">
              <h2 className="h5 mb-3">Session</h2>
              <Button variant="outline-primary" onClick={onLogout}>
                <LogOut size={18} className="me-2" aria-hidden="true" />
                Se déconnecter
              </Button>
            </Card.Body>
          </Card>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="h5 mb-3">Mes données personnelles</h2>
              <PrivacyNotice />
              <Button variant="outline-danger" onClick={() => setShowDelete(true)}>
                <Trash2 size={18} className="me-2" aria-hidden="true" />
                Supprimer mon compte
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <DeleteAccountModal show={showDelete} onHide={() => setShowDelete(false)} />
    </>
  );
}

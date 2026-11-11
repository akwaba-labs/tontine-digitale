import { useState } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ROUTES, safeRedirect } from '../../../app/routePaths';
import TextField from '../../../shared/components/form/TextField';
import PasswordField from '../../../shared/components/form/PasswordField';
import SubmitButton from '../../../shared/components/form/SubmitButton';
import FormError from '../../../shared/components/FormError';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { useToast } from '../../../shared/hooks/useToast';
import { registerSchema } from '../logic/schemas';
import { register as registerAccount } from '../services/authService';
import AuthCard from '../components/AuthCard';
import PrivacyNotice from '../components/PrivacyNotice';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess } = useToast();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      acceptPrivacy: false,
    },
  });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await registerAccount(values);
      showSuccess(`Bienvenue ${values.firstName} ! Votre compte est créé.`);
      navigate(safeRedirect(searchParams.get('redirect')), { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <AuthCard
      title="Créer un compte"
      subtitle="Gratuit, en moins d’une minute."
      footer={
        <>
          Déjà inscrit ? <Link to={ROUTES.login}>Se connecter</Link>
        </>
      }
    >
      <FormError message={formError} />
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Row xs={1} sm={2}>
          <Col>
            <TextField
              label="Prénom"
              autoComplete="given-name"
              registration={register('firstName')}
              error={errors.firstName}
            />
          </Col>
          <Col>
            <TextField
              label="Nom"
              autoComplete="family-name"
              registration={register('lastName')}
              error={errors.lastName}
            />
          </Col>
        </Row>
        <TextField
          label="Téléphone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="07 07 07 07 07"
          help="Visible par les membres de vos tontines."
          registration={register('phone')}
          error={errors.phone}
        />
        <TextField
          label="E-mail"
          type="email"
          inputMode="email"
          autoComplete="email"
          registration={register('email')}
          error={errors.email}
        />
        <PasswordField
          label="Mot de passe (8 caractères minimum)"
          autoComplete="new-password"
          registration={register('password')}
          error={errors.password}
        />
        <PasswordField
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          registration={register('passwordConfirmation')}
          error={errors.passwordConfirmation}
        />
        <PrivacyNotice compact />
        <Form.Check
          id="acceptPrivacy"
          className="mb-3"
          label="J’ai lu et j’accepte l’utilisation de mes données décrite ci-dessus."
          isInvalid={Boolean(errors.acceptPrivacy)}
          feedback={errors.acceptPrivacy?.message}
          feedbackType="invalid"
          {...register('acceptPrivacy')}
        />
        <SubmitButton isSubmitting={isSubmitting}>Créer mon compte</SubmitButton>
      </Form>
    </AuthCard>
  );
}

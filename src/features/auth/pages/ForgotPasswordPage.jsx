import { useState } from 'react';
import { Alert, Form } from 'react-bootstrap';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ROUTES } from '../../../app/routePaths';
import TextField from '../../../shared/components/form/TextField';
import SubmitButton from '../../../shared/components/form/SubmitButton';
import FormError from '../../../shared/components/FormError';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { forgotPasswordSchema } from '../logic/schemas';
import { resetPassword } from '../services/authService';
import AuthCard from '../components/AuthCard';

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setFormError('');
    try {
      await resetPassword(email);
      setSentTo(email);
    } catch (error) {
      // On ne révèle pas si un compte existe pour cet e-mail.
      if (error.code === 'auth/user-not-found') setSentTo(email);
      else setFormError(getErrorMessage(error));
    }
  };

  return (
    <AuthCard
      title="Mot de passe oublié"
      subtitle="Nous vous envoyons un lien pour en choisir un nouveau."
      footer={<Link to={ROUTES.login}>Retour à la connexion</Link>}
    >
      {sentTo ? (
        <Alert variant="success">
          Si un compte existe pour <strong>{sentTo}</strong>, un e-mail vient d’être envoyé. Pensez
          à regarder dans les courriers indésirables.
        </Alert>
      ) : (
        <>
          <FormError message={formError} />
          <Form noValidate onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="E-mail"
              type="email"
              inputMode="email"
              autoComplete="email"
              registration={register('email')}
              error={errors.email}
            />
            <SubmitButton isSubmitting={isSubmitting}>Envoyer le lien</SubmitButton>
          </Form>
        </>
      )}
    </AuthCard>
  );
}

import { useState } from 'react';
import { Form } from 'react-bootstrap';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ROUTES, safeRedirect } from '../../../app/routePaths';
import TextField from '../../../shared/components/form/TextField';
import PasswordField from '../../../shared/components/form/PasswordField';
import SubmitButton from '../../../shared/components/form/SubmitButton';
import FormError from '../../../shared/components/FormError';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { loginSchema } from '../logic/schemas';
import { login } from '../services/authService';
import AuthCard from '../components/AuthCard';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const redirect = searchParams.get('redirect');
  const registerLink = redirect
    ? `${ROUTES.register}?redirect=${encodeURIComponent(redirect)}`
    : ROUTES.register;

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await login(values);
      navigate(safeRedirect(redirect), { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <AuthCard
      title="Connexion"
      subtitle="Heureux de vous revoir !"
      footer={
        <>
          Pas encore de compte ? <Link to={registerLink}>Créer un compte</Link>
        </>
      }
    >
      <FormError message={formError} />
      <Form noValidate onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          registration={register('email')}
          error={errors.email}
        />
        <PasswordField
          label="Mot de passe"
          registration={register('password')}
          error={errors.password}
        />
        <div className="text-end mb-3">
          <Link to={ROUTES.forgotPassword}>Mot de passe oublié ?</Link>
        </div>
        <SubmitButton isSubmitting={isSubmitting}>Se connecter</SubmitButton>
      </Form>
    </AuthCard>
  );
}

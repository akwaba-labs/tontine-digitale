import { useState } from 'react';
import { Alert, Card, Col, Form, Row } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Settings } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import PageHeader from '../../../shared/components/PageHeader';
import TextField from '../../../shared/components/form/TextField';
import SubmitButton from '../../../shared/components/form/SubmitButton';
import FormError from '../../../shared/components/FormError';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { formatPhone } from '../../../shared/utils/formatPhone';
import { profileSchema } from '../logic/schemas';
import { createUserProfile, updateUserProfile } from '../services/userService';
import AvatarEditor from '../components/AvatarEditor';

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [formError, setFormError] = useState('');
  const isCompleting = !profile;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(profileSchema),
    values: {
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ? formatPhone(profile.phone) : '',
    },
  });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      if (isCompleting) {
        await createUserProfile(user.uid, { ...values, email: user.email });
        showSuccess('Profil enregistré. Bienvenue !');
        navigate(ROUTES.dashboard);
      } else {
        await updateUserProfile(user.uid, values);
        showSuccess('Profil mis à jour.');
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title="Mon profil"
        actions={
          <Link to={ROUTES.settings} className="btn btn-outline-secondary">
            <Settings size={18} className="me-1" aria-hidden="true" />
            Paramètres
          </Link>
        }
      />
      <Row>
        <Col lg={7}>
          {isCompleting && (
            <Alert variant="warning">
              Complétez votre profil pour continuer : les membres de vos tontines doivent pouvoir
              vous reconnaître.
            </Alert>
          )}
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {!isCompleting && <AvatarEditor uid={user.uid} photoURL={profile.photoURL} />}
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
                  registration={register('phone')}
                  error={errors.phone}
                  help="Le changement s’appliquera aux prochaines tontines que vous rejoindrez."
                />
                <TextField label="E-mail" value={user.email ?? ''} readOnly plaintext />
                <SubmitButton isSubmitting={isSubmitting}>
                  {isCompleting ? 'Enregistrer mon profil' : 'Enregistrer'}
                </SubmitButton>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

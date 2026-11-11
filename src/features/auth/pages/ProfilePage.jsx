import { useState } from 'react';
import { Alert, Card, Col, Form, Row } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { CalendarDays, ChevronRight, KeyRound, Mail, Phone, ShieldAlert } from 'lucide-react';
import { ROUTES } from '../../../app/routePaths';
import UserAvatar from '../../../shared/components/UserAvatar';
import { APP_NAME } from '../../../config/app';
import { formatDate } from '../../../shared/utils/formatDate';
import { useMyTontines } from '../../tontines/hooks/useMyTontines';
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
  const { user, profile, displayName } = useAuth();
  const { data: myTontines } = useMyTontines();
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

  const tontineCount = myTontines?.length ?? 0;
  const organizedCount = (myTontines ?? []).filter((t) => t.ownerId === user.uid).length;

  return (
    <>
      <title>{`Mon profil · ${APP_NAME}`}</title>
      {isCompleting ? (
        <div className="page-intro">
          <div>
            <h1>Bienvenue !</h1>
            <div className="page-intro__sub">Encore une étape avant de commencer.</div>
          </div>
        </div>
      ) : (
        <section className="profile-hero">
          <UserAvatar name={displayName} photoURL={profile.photoURL} size={96} />
          <div className="flex-grow-1 min-w-0">
            <h1>{displayName}</h1>
            <div className="profile-hero__meta">
              <span>
                <Mail size={16} aria-hidden="true" /> {user.email}
              </span>
              <span>
                <Phone size={16} aria-hidden="true" /> {formatPhone(profile.phone)}
              </span>
              {profile.createdAt && (
                <span>
                  <CalendarDays size={16} aria-hidden="true" /> Membre depuis le{' '}
                  {formatDate(profile.createdAt)}
                </span>
              )}
            </div>
          </div>
          <div className="dash-hero__stats">
            <span className="hero-chip">
              <strong>{tontineCount}</strong> tontine{tontineCount > 1 ? 's' : ''}
            </span>
            <span className="hero-chip">
              <strong>{organizedCount}</strong> organisée{organizedCount > 1 ? 's' : ''}
            </span>
          </div>
        </section>
      )}
      <Row className="g-4">
        <Col lg={7}>
          {isCompleting && (
            <Alert variant="warning">
              Complétez votre profil pour continuer : les membres de vos tontines doivent pouvoir
              vous reconnaître.
            </Alert>
          )}
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <h2 className="h5 mb-3">Informations personnelles</h2>
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
        {!isCompleting && (
          <Col lg={5}>
            <section className="panel mb-4">
              <div className="panel__head">
                <h2 className="panel__title">Compte et sécurité</h2>
              </div>
              <Link to={ROUTES.settings} className="todo-item mb-2">
                <span className="icon-bubble icon-bubble--neutral">
                  <KeyRound size={18} aria-hidden="true" />
                </span>
                <span className="flex-grow-1">
                  <span className="todo-item__text fw-semibold">Mot de passe</span>
                  <span className="todo-item__tontine">Changer votre mot de passe</span>
                </span>
                <ChevronRight size={18} className="text-secondary" aria-hidden="true" />
              </Link>
              <Link to={ROUTES.settings} className="todo-item mb-2">
                <span className="icon-bubble icon-bubble--neutral">
                  <Mail size={18} aria-hidden="true" />
                </span>
                <span className="flex-grow-1">
                  <span className="todo-item__text fw-semibold">Résumé quotidien</span>
                  <span className="todo-item__tontine">
                    {profile.emailNotifications === false ? 'Désactivé' : 'Activé, vers 19 h'}
                  </span>
                </span>
                <ChevronRight size={18} className="text-secondary" aria-hidden="true" />
              </Link>
              <Link to={ROUTES.settings} className="todo-item">
                <span className="icon-bubble icon-bubble--danger">
                  <ShieldAlert size={18} aria-hidden="true" />
                </span>
                <span className="flex-grow-1">
                  <span className="todo-item__text fw-semibold">Mes données</span>
                  <span className="todo-item__tontine">Consulter ou supprimer mon compte</span>
                </span>
                <ChevronRight size={18} className="text-secondary" aria-hidden="true" />
              </Link>
            </section>
            <section className="panel">
              <div className="panel__head">
                <h2 className="panel__title">Mes tontines</h2>
                <Link to={ROUTES.tontines} className="section-head__link small">
                  Voir
                </Link>
              </div>
              <p className="text-secondary mb-0">
                Vous participez à {tontineCount} tontine{tontineCount > 1 ? 's' : ''}, dont{' '}
                {organizedCount} que vous organisez.
              </p>
            </section>
          </Col>
        )}
      </Row>
    </>
  );
}

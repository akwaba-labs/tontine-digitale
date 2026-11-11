import { Card, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import { CalendarCheck, Eye, HandCoins, KeyRound } from 'lucide-react';
import { APP_NAME } from '../../../config/app';
import { ROUTES } from '../../../app/routePaths';

const BENEFITS = [
  {
    icon: HandCoins,
    title: 'Qui a payé ? Tout le monde le sait',
    text: 'Chaque membre déclare sa cotisation, l’organisateur la confirme. Plus de cahier perdu ni de messages oubliés.',
  },
  {
    icon: CalendarCheck,
    title: 'Un calendrier clair',
    text: 'Les dates des tours et les bénéficiaires sont fixés à l’avance, ou tirés au sort devant tous.',
  },
  {
    icon: Eye,
    title: 'La même information pour tous',
    text: 'Chaque opération est inscrite dans un historique que personne ne peut modifier.',
  },
];

export default function HomePage() {
  return (
    <>
      <title>{`${APP_NAME} · Gérez votre tontine en toute confiance`}</title>

      <section className="hero py-5">
        <Container className="py-md-4">
          <Row className="align-items-center">
            <Col lg={7}>
              <h1 className="display-6 fw-bold mb-3">Votre tontine, claire pour tout le monde.</h1>
              <p className="lead mb-4">
                Membres, calendrier des tours, cotisations et retards : tout est suivi au même
                endroit, visible par chaque membre.
              </p>
              <div className="d-grid d-sm-flex gap-2">
                <Link to={ROUTES.register} className="btn btn-warning btn-lg fw-bold">
                  Créer mon compte
                </Link>
                <Link to={ROUTES.login} className="btn btn-outline-light btn-lg">
                  J’ai déjà un compte
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <Container className="py-5">
        <h2 className="h4 mb-4 text-center">Pourquoi utiliser {APP_NAME} ?</h2>
        <Row xs={1} md={3} className="g-3">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <Col key={title}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Icon size={36} className="text-primary mb-3" aria-hidden="true" />
                  <h3 className="h6 fw-bold">{title}</h3>
                  <p className="mb-0 text-secondary">{text}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Card className="mt-5 border-warning">
          <Card.Body className="d-flex flex-column flex-md-row align-items-md-center gap-3">
            <KeyRound size={36} className="text-warning flex-shrink-0" aria-hidden="true" />
            <div className="flex-grow-1">
              <h2 className="h5 mb-1">On vous a donné un code d’invitation ?</h2>
              <p className="mb-0 text-secondary">
                Rejoignez la tontine de votre groupe en quelques secondes.
              </p>
            </div>
            <Link to={ROUTES.join} className="btn btn-outline-primary">
              Rejoindre une tontine
            </Link>
          </Card.Body>
        </Card>

        <p className="text-center text-secondary small mt-5 mb-0">
          {APP_NAME} ne transporte pas votre argent : les versements se font en espèces ou par
          Mobile Money (Wave, Orange Money, MTN, Moov). L’application sert à les déclarer, les
          confirmer et garder une trace.
        </p>
      </Container>
    </>
  );
}

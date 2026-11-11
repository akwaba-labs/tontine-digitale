import { Accordion, Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router';
import { ArrowRight, Check, Smartphone, Wallet, WifiOff } from 'lucide-react';
import { APP_NAME } from '../../../config/app';
import { ROUTES } from '../../../app/routePaths';

/** Trait « au feutre » sous un mot du titre. */
function Scribble({ children }) {
  return (
    <span className="scribble">
      {children}
      <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M3 8.5C38 3 79 2.5 118 5.5s62 4 79-1.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

// Exemple fictif affiché dans le téléphone d'illustration.
const DEMO_MEMBERS = [
  { initials: 'AK', name: 'Awa K.', color: '#136f47', status: 'paid', label: 'Payé' },
  { initials: 'FD', name: 'Fatou D.', color: '#c8553d', status: 'paid', label: 'Payé' },
  { initials: 'KY', name: 'Koffi Y.', color: '#2f5d8a', status: 'declared', label: 'À confirmer' },
  { initials: 'MS', name: 'Mariam S.', color: '#8a5a2f', status: 'paid', label: 'Payé' },
  { initials: 'YB', name: 'Yao B.', color: '#5f6b64', status: 'late', label: 'En retard' },
];

function PhoneMockup() {
  return (
    <div className="phone-stage">
      <p className="visually-hidden">
        Exemple d’écran : une tontine de cinq membres, trois cotisations payées, une à confirmer et
        une en retard.
      </p>
      <div className="phone" aria-hidden="true">
        <div className="phone__screen">
          <div className="phone__head">
            <div className="phone__notch mb-2" />
            <div className="small opacity-75">Tour 4 sur 10 · samedi</div>
            <div className="phone__title">Tontine du marché</div>
            <div className="d-flex justify-content-between small mt-1">
              <span>3 sur 5 ont payé</span>
              <span className="fw-bold">75 000 / 125 000</span>
            </div>
            <div className="phone__progress">
              <span style={{ width: '60%' }} />
            </div>
          </div>
          <ul className="phone__list">
            {DEMO_MEMBERS.map((m) => (
              <li key={m.initials} className="phone__row">
                <span className="phone__avatar" style={{ background: m.color }}>
                  {m.initials}
                </span>
                <span className="fw-semibold">{m.name}</span>
                <span className={`pill pill--${m.status}`}>{m.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="payout-card" aria-hidden="true">
        Samedi, c’est le tour de Mariam
        <strong>125 000 FCFA</strong>
      </div>
      <div className="sticker" aria-hidden="true">
        Fini
        <br />
        le cahier !
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: 'Créez la tontine',
    text: 'Montant, rythme (chaque semaine, chaque mois…), nombre de tours. Puis envoyez le code d’invitation dans le groupe WhatsApp.',
  },
  {
    title: 'Chacun déclare sa part',
    text: 'Le membre indique qu’il a payé, en espèces ou par Mobile Money, avec une photo du reçu s’il veut. L’organisateur confirme.',
  },
  {
    title: 'Tout le monde suit',
    text: 'Qui a payé, qui est en retard, à qui le tour : la même information sur le téléphone de chaque membre.',
  },
];

const FAQ = [
  {
    q: 'L’argent passe-t-il par l’application ?',
    a: `Non. Vous continuez à payer comme avant : en main propre, par Wave, Orange Money, MTN ou Moov. ${APP_NAME} sert à noter chaque versement, à le faire confirmer par l’organisateur et à garder une trace que tout le monde peut consulter.`,
  },
  {
    q: 'Comment les membres rejoignent-ils la tontine ?',
    a: 'L’organisateur partage un code d’invitation (ou un lien, directement sur WhatsApp). La personne crée son compte, saisit le code, et l’organisateur accepte sa demande.',
  },
  {
    q: 'Qui décide de l’ordre des tours ?',
    a: 'L’organisateur fixe l’ordre lui-même, ou fait un tirage au sort une seule fois, visible par tous. L’ordre ne peut plus être changé en cachette ensuite.',
  },
  {
    q: 'Et si quelqu’un ne paie pas à temps ?',
    a: 'Sa cotisation passe en retard et apparaît en rouge pour tout le monde. Si votre règlement prévoit une pénalité, l’organisateur l’applique en un clic.',
  },
  {
    q: 'Ça marche avec une petite connexion ?',
    a: 'Oui. L’application est légère, s’installe sur l’écran d’accueil du téléphone et garde les dernières informations reçues même sans réseau.',
  },
];

export default function HomePage() {
  return (
    <>
      <title>{`${APP_NAME} · Votre tontine, sans le cahier`}</title>

      <section className="home-hero">
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={6}>
              <span className="home-kicker">
                <span className="home-kicker__dot" />
                Tontines de famille, de marché, de bureau
              </span>
              <h1 className="home-title">
                Votre tontine, <Scribble>sans le cahier.</Scribble>
              </h1>
              <p className="home-lead mb-4">
                Les cotisations, les tours, les retards : tout est noté au même endroit, et chaque
                membre voit la même chose sur son téléphone. Plus de « j’ai déjà payé ! » à
                vérifier.
              </p>
              <div className="d-grid d-sm-flex gap-3">
                <Link
                  to={ROUTES.register}
                  className="btn btn-warning btn-lg btn-stamp d-inline-flex align-items-center justify-content-center gap-2"
                >
                  Créer mon compte <ArrowRight size={20} aria-hidden="true" />
                </Link>
                <Link to={ROUTES.join} className="btn btn-outline-primary btn-lg">
                  J’ai un code d’invitation
                </Link>
              </div>
              <ul className="home-reassure">
                <li>
                  <Wallet size={18} aria-hidden="true" /> Votre argent ne passe pas par nous
                </li>
                <li>
                  <Smartphone size={18} aria-hidden="true" /> S’installe sur le téléphone
                </li>
                <li>
                  <WifiOff size={18} aria-hidden="true" /> Marche même hors connexion
                </li>
              </ul>
            </Col>
            <Col lg={{ span: 5, offset: 1 }}>
              <PhoneMockup />
            </Col>
          </Row>
        </Container>
      </section>

      <section className="home-section home-section--sand">
        <Container>
          <Row className="align-items-center g-5">
            <Col lg={5}>
              <span className="section-eyebrow">Ça vous dit quelque chose ?</span>
              <h2 className="section-title mb-3">
                La tontine, on sait faire. C’est le suivi qui fatigue.
              </h2>
              <p className="text-secondary mb-0">
                Le cahier qui reste chez la trésorière, les captures d’écran perdues dans le groupe,
                les comptes refaits à chaque réunion… {APP_NAME} garde tout ça propre, pour que la
                confiance reste entière.
              </p>
            </Col>
            <Col lg={{ span: 6, offset: 1 }}>
              <div className="d-grid gap-3">
                <div className="bubble">« Je t’ai envoyé par Wave depuis mardi hein ! »</div>
                <div className="bubble ms-auto">« C’est le tour de qui samedi déjà ? »</div>
                <div className="bubble">« Qui a le cahier ? Il manque une page… »</div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="home-section">
        <Container>
          <span className="section-eyebrow">Comment ça marche</span>
          <h2 className="section-title mb-5">Trois étapes, et la tontine tourne toute seule.</h2>
          <Row xs={1} md={3} className="g-5">
            {STEPS.map((step, index) => (
              <Col key={step.title} className="step">
                <span className="step__number" aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="home-section home-section--sand">
        <Container>
          <Row className="feature-row align-items-center g-4 g-lg-5">
            <Col lg={6}>
              <span className="section-eyebrow">Le tirage</span>
              <h2 className="section-title h3 mb-3">Un tirage au sort que personne ne conteste.</h2>
              <p className="text-secondary mb-0">
                Fixez l’ordre des tours à la main, ou laissez le hasard décider une bonne fois pour
                toutes. Le résultat est enregistré et visible par tous les membres.
              </p>
            </Col>
            <Col lg={6}>
              <div
                className="feature-visual feature-visual--green d-flex align-items-center justify-content-center gap-3 py-5"
                aria-hidden="true"
              >
                <span className="draw-ball">3</span>
                <span className="draw-ball">7</span>
                <span className="draw-ball draw-ball--picked">1</span>
                <span className="draw-ball">5</span>
                <span className="draw-ball d-none d-sm-grid">2</span>
              </div>
            </Col>
          </Row>

          <Row className="feature-row align-items-center g-4 g-lg-5 flex-lg-row-reverse">
            <Col lg={6}>
              <span className="section-eyebrow">L’historique</span>
              <h2 className="section-title h3 mb-3">Ce qui est écrit reste écrit.</h2>
              <p className="text-secondary">
                Chaque paiement, chaque confirmation, chaque changement est inscrit dans un
                historique que personne ne peut effacer, pas même l’organisateur.
              </p>
              <ul className="check-list">
                <li>
                  <Check size={18} aria-hidden="true" /> Preuve de paiement en photo
                </li>
                <li>
                  <Check size={18} aria-hidden="true" /> Retards signalés, pénalités en un clic
                </li>
                <li>
                  <Check size={18} aria-hidden="true" /> Récapitulatif PDF pour la réunion
                </li>
              </ul>
            </Col>
            <Col lg={6}>
              <div className="feature-visual" aria-hidden="true">
                <div className="log-line">
                  <time>09:14</time>
                  <span>
                    <strong>Koffi</strong> a déclaré 25 000 FCFA (Orange Money)
                  </span>
                </div>
                <div className="log-line">
                  <time>09:40</time>
                  <span>
                    <strong>Awa</strong> a confirmé le paiement de Koffi
                  </span>
                </div>
                <div className="log-line">
                  <time>18:02</time>
                  <span>
                    <strong>Mariam</strong> a reçu son tour : 125 000 FCFA
                  </span>
                </div>
                <div className="log-line">
                  <time>18:05</time>
                  <span className="text-danger">
                    <strong>Yao</strong> : cotisation en retard
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="home-section">
        <Container>
          <div className="invite-ticket text-center mx-auto" style={{ maxWidth: '40rem' }}>
            <h2 className="h3 fw-bold mb-2">On vous a envoyé un code ?</h2>
            <p className="text-secondary mb-3">
              Il ressemble à ça. Saisissez-le pour rejoindre la tontine de votre groupe.
            </p>
            <div className="invite-ticket__code mb-4" aria-hidden="true">
              K7P2QX
            </div>
            <div>
              <Link to={ROUTES.join} className="btn btn-primary">
                Rejoindre une tontine
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <section className="home-section home-section--sand">
        <Container>
          <div className="home-faq mx-auto">
            <span className="section-eyebrow text-center">Questions fréquentes</span>
            <h2 className="section-title text-center mx-auto mb-4">Vous vous demandez sûrement…</h2>
            <Accordion>
              {FAQ.map((item, index) => (
                <Accordion.Item key={item.q} eventKey={String(index)}>
                  <Accordion.Header as="h3">{item.q}</Accordion.Header>
                  <Accordion.Body className="text-secondary">{item.a}</Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        </Container>
      </section>

      <section className="home-cta">
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={8}>
              <h2 className="mb-2">Votre prochaine réunion de tontine, sans prise de tête.</h2>
              <p className="mb-0 opacity-75">
                Créez la tontine ce soir, envoyez le code au groupe demain matin.
              </p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Link to={ROUTES.register} className="btn btn-warning btn-lg btn-stamp">
                Je me lance
              </Link>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
}

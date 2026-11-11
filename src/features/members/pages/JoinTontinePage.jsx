import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router';
import { Ticket } from 'lucide-react';
import PageHeader from '../../../shared/components/PageHeader';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import FormError from '../../../shared/components/FormError';
import Loader from '../../../shared/components/Loader';
import { useActor, useAuth } from '../../../shared/hooks/useAuth';
import { useAsyncAction } from '../../../shared/hooks/useAsyncAction';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { FREQUENCY_LABELS, LIMITS, MEMBER_STATUS } from '../../../shared/constants/domain';
import { payoutRhythmLabel } from '../../rounds/logic/schedule';
import { ROUTES, joinPath, tontineDetailPath } from '../../../app/routePaths';
import { isValidInviteCode, normalizeInviteCode } from '../../tontines/logic/inviteCode';
import { findInvite, getMyMembership, requestToJoin } from '../services/memberService';

function CodeForm({ initialCode }) {
  const navigate = useNavigate();
  const [code, setCode] = useState(initialCode ?? '');
  const normalized = normalizeInviteCode(code);
  return (
    <Form
      onSubmit={(event) => {
        event.preventDefault();
        if (isValidInviteCode(normalized)) navigate(joinPath(normalized));
      }}
    >
      <Form.Group className="mb-3" controlId="invite-code">
        <Form.Label className="fw-semibold">Code d’invitation (6 caractères)</Form.Label>
        <Form.Control
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Ex. K7M2QX"
          autoCapitalize="characters"
          autoComplete="off"
          className="text-uppercase fs-4 text-center"
          maxLength={10}
          isInvalid={code.length >= 6 && !isValidInviteCode(normalized)}
        />
        <Form.Control.Feedback type="invalid">Ce code n’est pas valide.</Form.Control.Feedback>
      </Form.Group>
      <Button type="submit" size="lg" className="w-100" disabled={!isValidInviteCode(normalized)}>
        Rechercher la tontine
      </Button>
    </Form>
  );
}

function useInvite(code) {
  const { user } = useAuth();
  const [state, setState] = useState({ code: null, invite: null, membership: null, error: null });
  useEffect(() => {
    if (!code) return undefined;
    let cancelled = false;
    findInvite(code)
      .then(async (invite) => {
        const membership = await getMyMembership(invite.tontineId, user.uid);
        if (!cancelled) setState({ code, invite, membership, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ code, invite: null, membership: null, error });
      });
    return () => {
      cancelled = true;
    };
  }, [code, user.uid]);
  return { ...state, isLoading: Boolean(code) && state.code !== code };
}

export default function JoinTontinePage() {
  const { inviteCode } = useParams();
  const code = inviteCode ? normalizeInviteCode(inviteCode) : null;
  const { profile } = useAuth();
  const actor = useActor();
  const { run, isRunning } = useAsyncAction();
  const [shares, setShares] = useState(1);
  const [sent, setSent] = useState(false);
  const { invite, membership, error, isLoading } = useInvite(code);

  const onRequest = async () => {
    const { ok } = await run(() => requestToJoin(actor, profile, invite, shares), {
      success: 'Demande envoyée à l’organisateur.',
    });
    if (ok) setSent(true);
  };

  return (
    <>
      <PageHeader title="Rejoindre une tontine" />
      <Row>
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {!code && <CodeForm />}
              {isLoading && <Loader label="Recherche de la tontine…" />}
              {code && error && (
                <>
                  <FormError message={getErrorMessage(error)} />
                  <CodeForm initialCode={code} />
                </>
              )}
              {invite && (
                <>
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <Ticket className="text-primary" aria-hidden="true" />
                    <h2 className="h5 mb-0">{invite.tontineName}</h2>
                  </div>
                  <dl className="row mb-3">
                    <dt className="col-6 fw-normal text-secondary">Organisateur</dt>
                    <dd className="col-6">{invite.ownerName}</dd>
                    <dt className="col-6 fw-normal text-secondary">Dépôt par part</dt>
                    <dd className="col-6">
                      <AmountDisplay amount={invite.amount} />
                    </dd>
                    <dt className="col-6 fw-normal text-secondary">Fréquence des dépôts</dt>
                    <dd className="col-6">{FREQUENCY_LABELS[invite.frequency]}</dd>
                    <dt className="col-6 fw-normal text-secondary">Remise du pot</dt>
                    <dd className="col-6">{payoutRhythmLabel(invite)}</dd>
                    <dt className="col-6 fw-normal text-secondary">Nombre de tours</dt>
                    <dd className="col-6">{invite.totalShares}</dd>
                  </dl>

                  {membership?.status === MEMBER_STATUS.ACTIVE ? (
                    <Alert variant="success">
                      Vous êtes déjà membre.{' '}
                      <Link to={tontineDetailPath(invite.tontineId)}>Ouvrir la tontine</Link>
                    </Alert>
                  ) : membership?.status === MEMBER_STATUS.PENDING || sent ? (
                    <Alert variant="warning">
                      Demande envoyée. Vous recevrez une notification dès que l’organisateur aura
                      répondu.
                    </Alert>
                  ) : (
                    <>
                      {membership?.status === MEMBER_STATUS.REFUSED && (
                        <Alert variant="info">
                          Votre précédente demande a été refusée. Vous pouvez en refaire une.
                        </Alert>
                      )}
                      <Form.Group className="mb-3" controlId="shares">
                        <Form.Label className="fw-semibold">Nombre de parts (« mains »)</Form.Label>
                        <Form.Select
                          value={shares}
                          onChange={(event) => setShares(Number(event.target.value))}
                        >
                          {Array.from(
                            { length: Math.min(LIMITS.maxSharesPerMember, invite.totalShares) },
                            (_, i) => i + 1,
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n} part{n > 1 ? 's' : ''} — {n} × cotisation, {n} tour
                              {n > 1 ? 's' : ''} de réception
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text>
                          À chaque tour vous verserez{' '}
                          <AmountDisplay amount={invite.amount * shares} />.
                        </Form.Text>
                      </Form.Group>
                      <Button size="lg" className="w-100" onClick={onRequest} disabled={isRunning}>
                        Envoyer ma demande
                      </Button>
                    </>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
          <p className="text-center mt-3">
            <Link to={ROUTES.tontines}>Retour à mes tontines</Link>
          </p>
        </Col>
      </Row>
    </>
  );
}

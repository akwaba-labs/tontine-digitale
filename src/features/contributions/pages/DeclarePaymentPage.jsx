import { useState } from 'react';
import { Alert, Card, Col, Form, Row } from 'react-bootstrap';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { HandCoins } from 'lucide-react';
import PageHeader from '../../../shared/components/PageHeader';
import Loader from '../../../shared/components/Loader';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import StatusBadge from '../../../shared/components/StatusBadge';
import EmptyState from '../../../shared/components/EmptyState';
import TextField from '../../../shared/components/form/TextField';
import SubmitButton from '../../../shared/components/form/SubmitButton';
import FormError from '../../../shared/components/FormError';
import { useToast } from '../../../shared/hooks/useToast';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { formatDate } from '../../../shared/utils/formatDate';
import { PAYMENT_METHODS, TONTINE_STATUS } from '../../../shared/constants/domain';
import { tontineDetailPath, tontineTabPath } from '../../../app/routePaths';
import { useTontineDetail } from '../../tontines/hooks/useTontineDetail';
import TontineLoadError from '../../tontines/components/TontineLoadError';
import { amountDue, canDeclare, contributionId, getEffectiveStatus } from '../logic/contributions';
import { declarePayment } from '../services/contributionService';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ORIGINAL_SIZE = 15 * 1024 * 1024;

const schema = yup.object({
  roundIndex: yup.number().required('Choisissez le dépôt.'),
  method: yup
    .string()
    .oneOf(Object.keys(PAYMENT_METHODS), 'Choisissez le moyen de paiement.')
    .required(),
  reference: yup
    .string()
    .trim()
    .max(100, '100 caractères maximum.')
    .when('method', {
      is: (method) => method && method !== 'CASH',
      then: (s) => s.required('Indiquez la référence de la transaction (reçue par SMS).'),
    }),
});

export default function DeclarePaymentPage() {
  const { tontineId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const detail = useTontineDetail(tontineId);
  const [proofFile, setProofFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');

  const { tontine, me, deposits, contributionsById, currentDepositIndex, today, actor } = detail;

  // `round` : un dépôt (avec un dépôt par tour, c'est le tour).
  const declarable =
    me && tontine
      ? deposits
          .filter((round) => round.index <= (currentDepositIndex ?? 1) + 1)
          .map((round) => {
            const contribution =
              contributionsById.get(contributionId(round.index, me.userId)) ?? null;
            return {
              round,
              contribution,
              status: getEffectiveStatus(contribution, round, tontine.graceDays, today),
              due: amountDue(contribution, tontine.amount, me.shares),
            };
          })
          .filter((item) => canDeclare(item.status))
      : [];

  const requested = Number(searchParams.get('tour'));
  const defaultRound =
    declarable.find((item) => item.round.index === requested)?.round.index ??
    declarable[0]?.round.index;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    values: { roundIndex: defaultRound ?? '', method: 'WAVE', reference: '' },
    resetOptions: { keepDirtyValues: true },
  });
  const watchedRound = useWatch({ control, name: 'roundIndex' });
  const isCash = useWatch({ control, name: 'method' }) === 'CASH';

  if (detail.isLoading) return <Loader />;
  if (detail.error || detail.notFound) return <TontineLoadError error={detail.error} />;
  if (tontine.status !== TONTINE_STATUS.ACTIVE || !me)
    return <Navigate to={tontineDetailPath(tontineId)} replace />;

  const selected = declarable.find((item) => item.round.index === Number(watchedRound));

  const onFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setFileError('');
    if (file && !ACCEPTED_TYPES.includes(file.type)) {
      setFileError('Choisissez une image (JPEG, PNG ou WebP).');
      setProofFile(null);
      return;
    }
    if (file && file.size > MAX_ORIGINAL_SIZE) {
      setFileError('Image trop lourde.');
      setProofFile(null);
      return;
    }
    setProofFile(file);
  };

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await declarePayment(actor, {
        tontine,
        member: me,
        round: selected.round,
        existing: selected.contribution,
        method: values.method,
        reference: values.reference ?? '',
        proofFile,
      });
      showSuccess('Paiement déclaré. L’organisateur va le confirmer.');
      navigate(tontineTabPath(tontineId, 'cotisations'));
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <>
      <PageHeader title="Déclarer un paiement" subtitle={tontine.name} />
      <Row>
        <Col lg={7}>
          {declarable.length === 0 ? (
            <EmptyState
              title="Rien à déclarer"
              message="Vos cotisations sont déclarées ou confirmées jusqu’au prochain dépôt."
              action={{ label: 'Retour à la tontine', to: tontineDetailPath(tontineId) }}
            />
          ) : (
            <Card className="shadow-sm">
              <Card.Body className="p-4">
                <Alert variant="info" className="small">
                  Payez d’abord en espèces ou par Mobile Money, puis déclarez votre paiement ici.
                  L’application ne transfère pas d’argent.
                </Alert>
                <FormError message={formError} />
                <Form noValidate onSubmit={handleSubmit(onSubmit)}>
                  <TextField
                    label={(tontine.depositsPerRound ?? 1) > 1 ? 'Dépôt' : 'Tour'}
                    as="select"
                    registration={register('roundIndex')}
                    error={errors.roundIndex}
                  >
                    {declarable.map(({ round, status }) => (
                      <option key={round.index} value={round.index}>
                        {round.depositsInRound > 1
                          ? `${formatDate(round.dueDate)} — dépôt ${round.numberInRound}/${round.depositsInRound} du tour n° ${round.roundIndex}`
                          : `Tour n° ${round.index} — ${formatDate(round.dueDate)}`}
                        {status === 'LATE'
                          ? ' (en retard)'
                          : status === 'REJECTED'
                            ? ' (rejeté)'
                            : ''}
                      </option>
                    ))}
                  </TextField>
                  {selected && (
                    <div className="p-3 bg-light rounded mb-3 d-flex justify-content-between align-items-center">
                      <div>
                        <div className="small text-secondary">Montant à verser</div>
                        <AmountDisplay amount={selected.due} className="fs-4 fw-bold" />
                      </div>
                      <StatusBadge status={selected.status} />
                    </div>
                  )}
                  {selected?.contribution?.rejectionReason && selected.status !== 'PENDING' && (
                    <Alert variant="danger" className="small">
                      Déclaration précédente rejetée : {selected.contribution.rejectionReason}
                    </Alert>
                  )}
                  <TextField
                    label="Moyen de paiement"
                    as="select"
                    registration={register('method')}
                    error={errors.method}
                  >
                    {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </TextField>
                  {isCash && (
                    <Alert variant="light" className="small border d-flex gap-2">
                      <HandCoins
                        size={20}
                        className="text-primary flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>
                        <strong>Paiement en espèces : la preuve, c’est la confirmation.</strong>{' '}
                        Remettez l’argent à l’organisateur (ou à la personne désignée) : il confirme
                        l’avoir reçu dans l’application, et c’est inscrit dans l’historique que
                        personne ne peut modifier. Si vous avez un reçu signé, ajoutez-en la photo.
                      </span>
                    </Alert>
                  )}
                  <TextField
                    label={isCash ? 'Remis à (facultatif)' : 'Référence de la transaction'}
                    placeholder={isCash ? 'Ex. Aminata, la trésorière' : 'Ex. MP231111.1234.A56789'}
                    help={
                      isCash
                        ? 'La personne à qui vous avez donné l’argent, et quand si besoin.'
                        : 'Le numéro reçu par SMS après le paiement Mobile Money.'
                    }
                    registration={register('reference')}
                    error={errors.reference}
                  />
                  <Form.Group className="mb-3" controlId="proof">
                    <Form.Label className="fw-semibold">
                      {isCash
                        ? 'Photo du reçu signé (facultatif)'
                        : 'Capture d’écran du SMS (facultatif)'}
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept={ACCEPTED_TYPES.join(',')}
                      onChange={onFileChange}
                      isInvalid={Boolean(fileError)}
                    />
                    <Form.Control.Feedback type="invalid">{fileError}</Form.Control.Feedback>
                    <Form.Text>
                      Image réduite automatiquement avant l’envoi. Visible par les membres.
                    </Form.Text>
                  </Form.Group>
                  <SubmitButton isSubmitting={isSubmitting}>Déclarer mon paiement</SubmitButton>
                </Form>
              </Card.Body>
            </Card>
          )}
          <p className="text-center mt-3">
            <Link to={tontineDetailPath(tontineId)}>Retour à la tontine</Link>
          </p>
        </Col>
      </Row>
    </>
  );
}

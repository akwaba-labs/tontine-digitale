import { useState } from 'react';
import { Alert, Card, Col, Form, Row } from 'react-bootstrap';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { HandCoins, ShieldCheck } from 'lucide-react';
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
import { PAYMENT_METHODS, TONTINE_STATUS, isGuestId } from '../../../shared/constants/domain';
import { tontineDetailPath, tontineTabPath } from '../../../app/routePaths';
import { useTontineDetail } from '../../tontines/hooks/useTontineDetail';
import TontineLoadError from '../../tontines/components/TontineLoadError';
import {
  activeMembers,
  amountDue,
  canDeclare,
  contributionId,
  getEffectiveStatus,
} from '../logic/contributions';
import { declarePayment, recordPayment } from '../services/contributionService';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_ORIGINAL_SIZE = 15 * 1024 * 1024;

// L'organisateur qui enregistre un paiement n'a pas toujours la référence du SMS.
const schemaFor = (isRecording) =>
  yup.object({
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
        is: (method) => !isRecording && method && method !== 'CASH',
        then: (s) => s.required('Indiquez la référence de la transaction (reçue par SMS).'),
      }),
  });

/** Dépôts que ce membre peut encore payer : jusqu'au dépôt en cours + le suivant. */
function declarableFor(member, detail) {
  const { tontine, deposits, contributionsById, currentDepositIndex, today } = detail;
  return deposits
    .filter((deposit) => deposit.index <= (currentDepositIndex ?? 1) + 1)
    .map((deposit) => {
      const contribution =
        contributionsById.get(contributionId(deposit.index, member.userId)) ?? null;
      return {
        round: deposit,
        contribution,
        status: getEffectiveStatus(contribution, deposit, tontine.graceDays, today),
        due: amountDue(contribution, tontine.amount, member.shares),
      };
    })
    .filter((item) => canDeclare(item.status));
}

function depositOptionLabel(round) {
  return round.depositsInRound > 1
    ? `${formatDate(round.dueDate)} — dépôt ${round.numberInRound}/${round.depositsInRound} du tour n° ${round.roundIndex}`
    : `Tour n° ${round.index} — ${formatDate(round.dueDate)}`;
}

/**
 * Formulaire de paiement pour un membre donné.
 * - isRecording (organisateur) : le paiement est enregistré et confirmé tout de suite ;
 * - sinon, le membre déclare son paiement et l'organisateur le confirmera.
 */
function PaymentForm({ detail, payer, isRecording, isSelf, requestedIndex }) {
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const { tontine, actor } = detail;
  const [proofFile, setProofFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const declarable = declarableFor(payer, detail);
  const defaultRound =
    declarable.find((item) => item.round.index === requestedIndex)?.round.index ??
    declarable[0]?.round.index;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schemaFor(isRecording)),
    defaultValues: {
      roundIndex: defaultRound ?? '',
      method: isRecording ? 'CASH' : 'WAVE',
      reference: '',
    },
  });
  const watchedRound = useWatch({ control, name: 'roundIndex' });
  const isCash = useWatch({ control, name: 'method' }) === 'CASH';
  const selected = declarable.find((item) => item.round.index === Number(watchedRound));

  if (declarable.length === 0) {
    return (
      <EmptyState
        title="Rien à payer"
        message={
          isSelf
            ? 'Vos cotisations sont déclarées ou confirmées jusqu’au prochain dépôt.'
            : `Les cotisations de ${payer.displayName} sont déclarées ou confirmées jusqu’au prochain dépôt.`
        }
      />
    );
  }

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
    const payload = {
      tontine,
      member: payer,
      round: selected.round,
      existing: selected.contribution,
      method: values.method,
      reference: values.reference ?? '',
      proofFile,
    };
    try {
      if (isRecording) {
        await recordPayment(actor, payload);
        showSuccess(
          isSelf
            ? 'Votre paiement est enregistré et confirmé.'
            : `Paiement de ${payer.displayName} enregistré et confirmé.`,
        );
      } else {
        await declarePayment(actor, payload);
        showSuccess('Paiement déclaré. L’organisateur va le confirmer.');
      }
      navigate(tontineTabPath(tontine.id, 'cotisations'));
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <Form noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormError message={formError} />
      <TextField
        label={(tontine.depositsPerRound ?? 1) > 1 ? 'Dépôt' : 'Tour'}
        as="select"
        registration={register('roundIndex')}
        error={errors.roundIndex}
      >
        {declarable.map(({ round, status }) => (
          <option key={round.index} value={round.index}>
            {depositOptionLabel(round)}
            {status === 'LATE' ? ' (en retard)' : status === 'REJECTED' ? ' (rejeté)' : ''}
          </option>
        ))}
      </TextField>
      {selected && (
        <div className="p-3 bg-light rounded mb-3 d-flex justify-content-between align-items-center">
          <div>
            <div className="small text-secondary">
              {isRecording ? 'Montant reçu' : 'Montant à verser'}
              {selected.contribution?.penaltyAmount > 0 && ' (pénalité comprise)'}
            </div>
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
      {isCash && !isRecording && (
        <Alert variant="light" className="small border d-flex gap-2">
          <HandCoins size={20} className="text-primary flex-shrink-0" aria-hidden="true" />
          <span>
            <strong>Paiement en espèces : la preuve, c’est la confirmation.</strong> Remettez
            l’argent à l’organisateur (ou à la personne désignée) : il confirme l’avoir reçu dans
            l’application, et c’est inscrit dans l’historique que personne ne peut modifier. Si vous
            avez un reçu signé, ajoutez-en la photo.
          </span>
        </Alert>
      )}
      <TextField
        label={
          isRecording
            ? 'Référence ou remarque (facultatif)'
            : isCash
              ? 'Remis à (facultatif)'
              : 'Référence de la transaction'
        }
        placeholder={
          isRecording
            ? 'Ex. reçu n° 12, ou référence du SMS'
            : isCash
              ? 'Ex. Aminata, la trésorière'
              : 'Ex. MP231111.1234.A56789'
        }
        help={
          isRecording
            ? 'Visible par les membres dans le détail du paiement.'
            : isCash
              ? 'La personne à qui vous avez donné l’argent, et quand si besoin.'
              : 'Le numéro reçu par SMS après le paiement Mobile Money.'
        }
        registration={register('reference')}
        error={errors.reference}
      />
      <Form.Group className="mb-3" controlId="proof">
        <Form.Label className="fw-semibold">
          {isCash ? 'Photo du reçu signé (facultatif)' : 'Capture d’écran du SMS (facultatif)'}
        </Form.Label>
        <Form.Control
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={onFileChange}
          isInvalid={Boolean(fileError)}
        />
        <Form.Control.Feedback type="invalid">{fileError}</Form.Control.Feedback>
        <Form.Text>Image réduite automatiquement avant l’envoi. Visible par les membres.</Form.Text>
      </Form.Group>
      <SubmitButton isSubmitting={isSubmitting}>
        {isRecording
          ? isSelf
            ? 'Enregistrer mon paiement'
            : `Enregistrer le paiement de ${payer.displayName}`
          : 'Déclarer mon paiement'}
      </SubmitButton>
    </Form>
  );
}

export default function DeclarePaymentPage() {
  const { tontineId } = useParams();
  const [searchParams] = useSearchParams();
  const detail = useTontineDetail(tontineId);
  const { tontine, me, members, isManager } = detail;
  const [chosenMemberId, setChosenMemberId] = useState(searchParams.get('membre'));

  if (detail.isLoading) return <Loader />;
  if (detail.error || detail.notFound) return <TontineLoadError error={detail.error} />;
  if (tontine.status !== TONTINE_STATUS.ACTIVE || (!me && !isManager)) {
    return <Navigate to={tontineDetailPath(tontineId)} replace />;
  }

  // L'organisateur (et le co-organisateur) enregistre les paiements de tous les membres,
  // le sien compris ; un membre déclare seulement le sien.
  const payers = isManager ? activeMembers(members) : [me];
  const payer =
    payers.find((m) => m.userId === chosenMemberId) ??
    payers.find((m) => m.userId === me?.userId) ??
    payers[0];
  const isSelf = payer?.userId === me?.userId;

  return (
    <>
      <PageHeader
        title={isManager ? 'Enregistrer un paiement' : 'Déclarer un paiement'}
        subtitle={tontine.name}
      />
      <Row>
        <Col lg={7}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {isManager ? (
                <Alert variant="success" className="small d-flex gap-2">
                  <ShieldCheck size={20} className="flex-shrink-0" aria-hidden="true" />
                  <span>
                    En tant qu’organisateur, vous enregistrez les paiements reçus : ils sont{' '}
                    <strong>confirmés tout de suite</strong> et inscrits dans l’historique, visible
                    par tous les membres.
                  </span>
                </Alert>
              ) : (
                <Alert variant="info" className="small">
                  Payez d’abord en espèces ou par Mobile Money, puis déclarez votre paiement ici.
                  L’application ne transfère pas d’argent.
                </Alert>
              )}
              {isManager && (
                <Form.Group className="mb-3" controlId="payer">
                  <Form.Label className="fw-semibold">Membre concerné</Form.Label>
                  <Form.Select
                    value={payer?.userId ?? ''}
                    onChange={(event) => setChosenMemberId(event.target.value)}
                  >
                    {payers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.displayName}
                        {m.userId === me?.userId ? ' (moi)' : ''}
                        {isGuestId(m.userId) ? ' — sans compte' : ''}
                        {m.shares > 1 ? ` — ${m.shares} parts` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              {payer && (
                <PaymentForm
                  key={payer.userId}
                  detail={detail}
                  payer={payer}
                  isRecording={isManager}
                  isSelf={isSelf}
                  requestedIndex={Number(searchParams.get('tour'))}
                />
              )}
            </Card.Body>
          </Card>
          <p className="text-center mt-3">
            <Link to={tontineDetailPath(tontineId)}>Retour à la tontine</Link>
          </p>
        </Col>
      </Row>
    </>
  );
}

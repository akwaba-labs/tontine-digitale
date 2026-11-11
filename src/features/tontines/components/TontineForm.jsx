import { Alert, Card, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import TextField from '../../../shared/components/form/TextField';
import SubmitButton from '../../../shared/components/form/SubmitButton';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import { FREQUENCY_LABELS, ORDER_MODE } from '../../../shared/constants/domain';
import { formatDate } from '../../../shared/utils/formatDate';
import { addDays, isIsoDate, todayIso } from '../../../shared/utils/dates';
import { tontineSchema } from '../logic/tontineSchema';
import { getDueDate } from '../../rounds/logic/schedule';

const DEFAULT_VALUES = {
  name: '',
  description: '',
  amount: '',
  frequency: 'MONTHLY',
  startDate: addDays(todayIso(), 7),
  totalShares: '',
  ownerShares: 1,
  graceDays: 3,
  penaltyAmount: 0,
  orderMode: ORDER_MODE.DRAW,
};

function Preview({ amount, totalShares, startDate, frequency }) {
  const shares = Number(totalShares);
  const value = Number(amount);
  if (
    !Number.isInteger(value) ||
    value <= 0 ||
    !Number.isInteger(shares) ||
    shares < 2 ||
    !isIsoDate(startDate)
  ) {
    return null;
  }
  return (
    <Alert variant="success" className="mb-3">
      Chaque tour, le bénéficiaire reçoit{' '}
      <strong>
        <AmountDisplay amount={value * shares} />
      </strong>
      .
      <br />
      {shares} tours, du {formatDate(startDate)} au{' '}
      {formatDate(getDueDate(startDate, frequency, shares))}.
    </Alert>
  );
}

/**
 * Formulaire de création / modification.
 * - lockStructure : tontine démarrée, seuls le nom et la description changent ;
 * - lockOrder : ordre déjà tiré au sort, le nombre de parts ne change plus.
 */
export default function TontineForm({
  defaultValues,
  onSubmit,
  submitLabel,
  lockStructure = false,
  lockOrder = false,
  isEdit = false,
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(
      lockStructure ? tontineSchema.pick(['name', 'description']) : tontineSchema,
    ),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  const [amount, totalShares, startDate, frequency] = useWatch({
    control,
    name: ['amount', 'totalShares', 'startDate', 'frequency'],
  });

  return (
    <Form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Card className="shadow-sm mb-3">
        <Card.Body className="p-4">
          <h2 className="h5 mb-3">La tontine</h2>
          <TextField
            label="Nom"
            placeholder="Ex. Tontine des commerçantes"
            registration={register('name')}
            error={errors.name}
          />
          <TextField
            label="Description (facultatif)"
            as="textarea"
            rows={2}
            registration={register('description')}
            error={errors.description}
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-3">
        <Card.Body className="p-4">
          <h2 className="h5 mb-3">Cotisation et calendrier</h2>
          {lockStructure && (
            <Alert variant="info">
              La tontine a démarré : le montant, la fréquence, le calendrier et les règles de retard
              ne peuvent plus changer.
            </Alert>
          )}
          <Row xs={1} md={2}>
            <Col>
              <Form.Group className="mb-3" controlId="amount">
                <Form.Label className="fw-semibold">Cotisation par part</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control
                    type="number"
                    inputMode="numeric"
                    min={100}
                    step={1}
                    readOnly={lockStructure}
                    isInvalid={Boolean(errors.amount)}
                    {...register('amount')}
                  />
                  <InputGroup.Text>FCFA</InputGroup.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.amount?.message}
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col>
              <TextField
                label="Fréquence"
                as="select"
                disabled={lockStructure}
                registration={register('frequency')}
                error={errors.frequency}
              >
                {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </TextField>
            </Col>
            <Col>
              <TextField
                label="Date du premier tour"
                type="date"
                readOnly={lockStructure}
                registration={register('startDate')}
                error={errors.startDate}
              />
            </Col>
            <Col>
              <TextField
                label="Nombre de parts (= nombre de tours)"
                type="number"
                inputMode="numeric"
                min={2}
                readOnly={lockStructure || lockOrder}
                help="Une personne peut avoir plusieurs parts : elle cotise et reçoit plusieurs fois."
                registration={register('totalShares')}
                error={errors.totalShares}
              />
            </Col>
            {!isEdit && (
              <Col>
                <TextField
                  label="Vos parts (organisateur)"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  registration={register('ownerShares')}
                  error={errors.ownerShares}
                />
              </Col>
            )}
          </Row>
          <Preview
            amount={amount}
            totalShares={totalShares}
            startDate={startDate}
            frequency={frequency}
          />
        </Card.Body>
      </Card>

      <Card className="shadow-sm mb-3">
        <Card.Body className="p-4">
          <h2 className="h5 mb-3">Retards</h2>
          <Row xs={1} md={2}>
            <Col>
              <TextField
                label="Délai de grâce (jours)"
                type="number"
                inputMode="numeric"
                min={0}
                readOnly={lockStructure}
                help="Jours après l’échéance avant d’être « en retard »."
                registration={register('graceDays')}
                error={errors.graceDays}
              />
            </Col>
            <Col>
              <Form.Group className="mb-3" controlId="penaltyAmount">
                <Form.Label className="fw-semibold">Pénalité de retard</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control
                    type="number"
                    inputMode="numeric"
                    min={0}
                    readOnly={lockStructure}
                    isInvalid={Boolean(errors.penaltyAmount)}
                    aria-describedby="penalty-help"
                    {...register('penaltyAmount')}
                  />
                  <InputGroup.Text>FCFA</InputGroup.Text>
                  <Form.Control.Feedback type="invalid">
                    {errors.penaltyAmount?.message}
                  </Form.Control.Feedback>
                </InputGroup>
                <Form.Text id="penalty-help">0 = pas de pénalité.</Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {!lockStructure && !lockOrder && (
        <Card className="shadow-sm mb-3">
          <Card.Body className="p-4">
            <h2 className="h5 mb-3">Ordre des tours</h2>
            <Form.Check
              type="radio"
              id="order-draw"
              value={ORDER_MODE.DRAW}
              label="Tirage au sort dans l’application (résultat enregistré, impossible à relancer)"
              className="mb-2"
              {...register('orderMode')}
            />
            <Form.Check
              type="radio"
              id="order-manual"
              value={ORDER_MODE.MANUAL}
              label="Je choisis l’ordre moi-même"
              {...register('orderMode')}
            />
          </Card.Body>
        </Card>
      )}

      <SubmitButton isSubmitting={isSubmitting}>{submitLabel}</SubmitButton>
    </Form>
  );
}

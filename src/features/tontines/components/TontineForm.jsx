import { Alert, Card, Col, Form, InputGroup, Row } from 'react-bootstrap';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Dices, ListOrdered } from 'lucide-react';
import TextField from '../../../shared/components/form/TextField';
import SubmitButton from '../../../shared/components/form/SubmitButton';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import { FREQUENCY_LABELS, ORDER_MODE } from '../../../shared/constants/domain';
import { formatDate } from '../../../shared/utils/formatDate';
import { addDays, isIsoDate, todayIso } from '../../../shared/utils/dates';
import { tontineSchema } from '../logic/tontineSchema';
import { getDueDate, getRoundDueDate } from '../../rounds/logic/schedule';

const DEFAULT_VALUES = {
  name: '',
  description: '',
  amount: '',
  frequency: 'MONTHLY',
  depositsPerRound: 1,
  startDate: addDays(todayIso(), 7),
  totalShares: '',
  ownerShares: 1,
  graceDays: 3,
  penaltyAmount: 0,
  orderMode: ORDER_MODE.DRAW,
};

function Step({ number, title, text }) {
  return (
    <div className="form-step">
      <span className="form-step__number">{number}</span>
      <div>
        <h2 className="h5">{title}</h2>
        {text && <p>{text}</p>}
      </div>
    </div>
  );
}

/** Récapitulatif en direct : ce que les membres déposeront et recevront, et le calendrier. */
function Summary({ name, amount, totalShares, startDate, frequency, depositsPerRound, children }) {
  const shares = Number(totalShares);
  const value = Number(amount);
  const perRound = Number(depositsPerRound);
  const isComplete =
    Number.isInteger(value) &&
    value > 0 &&
    Number.isInteger(shares) &&
    shares >= 2 &&
    Number.isInteger(perRound) &&
    perRound >= 1 &&
    isIsoDate(startDate);
  const tontine = { startDate, frequency, depositsPerRound: perRound };

  return (
    <aside className="summary-card">
      <div className="small text-uppercase fw-bold opacity-75">Récapitulatif</div>
      <h2 className="h4 mt-1 mb-0">{name?.trim() || 'Nouvelle tontine'}</h2>
      {isComplete ? (
        <>
          <div className="summary-card__pot">
            <AmountDisplay amount={value * shares * perRound} />
          </div>
          <dl>
            <dt>Dépôt par part</dt>
            <dd>
              <AmountDisplay amount={value} />
            </dd>
            <dt>Rythme</dt>
            <dd>{FREQUENCY_LABELS[frequency]}</dd>
            <dt>Remise du pot</dt>
            <dd>{perRound === 1 ? 'à chaque dépôt' : `tous les ${perRound} dépôts`}</dd>
            <dt>Tours</dt>
            <dd>{shares}</dd>
            <dt>Premier pot</dt>
            <dd>{formatDate(getRoundDueDate(tontine, 1))}</dd>
            <dt>Dernier pot</dt>
            <dd>{formatDate(getDueDate(startDate, frequency, shares * perRound))}</dd>
          </dl>
        </>
      ) : (
        <p className="summary-card__empty mt-3">
          Renseignez le dépôt, le nombre de parts et la date : le pot et le calendrier s’affichent
          ici.
        </p>
      )}
      {children}
    </aside>
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

  const [name, amount, totalShares, startDate, frequency, depositsPerRound] = useWatch({
    control,
    name: ['name', 'amount', 'totalShares', 'startDate', 'frequency', 'depositsPerRound'],
  });

  return (
    <Form noValidate onSubmit={handleSubmit(onSubmit)}>
      <Row className="g-4">
        <Col lg={8}>
          <Card className="shadow-sm mb-3">
            <Card.Body className="p-4">
              <Step
                number={1}
                title="La tontine"
                text="Un nom que tous les membres reconnaîtront."
              />
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
              <Step
                number={2}
                title="Dépôts et calendrier"
                text="Combien chacun dépose, à quel rythme, et quand un membre prend le pot."
              />
              {lockStructure && (
                <Alert variant="info">
                  La tontine a démarré : le montant, la fréquence, le calendrier et les règles de
                  retard ne peuvent plus changer.
                </Alert>
              )}
              <Row xs={1} md={2}>
                <Col>
                  <Form.Group className="mb-3" controlId="amount">
                    <Form.Label className="fw-semibold">Dépôt par part</Form.Label>
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
                    label="Fréquence des dépôts"
                    as="select"
                    help="À quel rythme chaque membre fait son dépôt."
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
                    label="Remise du pot : tous les … dépôts"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    readOnly={lockStructure}
                    help="1 = un membre prend le pot à chaque dépôt. Ex. dépôts chaque jour et 30 ici : le pot est remis tous les 30 jours."
                    registration={register('depositsPerRound')}
                    error={errors.depositsPerRound}
                  />
                </Col>
                <Col>
                  <TextField
                    label="Date du premier dépôt"
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
            </Card.Body>
          </Card>

          <Card className="shadow-sm mb-3">
            <Card.Body className="p-4">
              <Step
                number={3}
                title="Retards"
                text="Ce qui se passe quand un dépôt arrive en retard."
              />
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
                <Step number={4} title="Ordre des tours" text="Qui prend le pot en premier ?" />
                <div className="choice-cards">
                  <label className="choice-card" htmlFor="order-draw">
                    <input
                      type="radio"
                      id="order-draw"
                      value={ORDER_MODE.DRAW}
                      {...register('orderMode')}
                    />
                    <Dices size={22} aria-hidden="true" />
                    <strong>Tirage au sort</strong>
                    <span>Fait dans l’application, enregistré, impossible à relancer.</span>
                  </label>
                  <label className="choice-card" htmlFor="order-manual">
                    <input
                      type="radio"
                      id="order-manual"
                      value={ORDER_MODE.MANUAL}
                      {...register('orderMode')}
                    />
                    <ListOrdered size={22} aria-hidden="true" />
                    <strong>Je choisis l’ordre</strong>
                    <span>Vous placez les membres vous-même avant de démarrer.</span>
                  </label>
                </div>
              </Card.Body>
            </Card>
          )}

          <div className="d-lg-none">
            <SubmitButton isSubmitting={isSubmitting}>{submitLabel}</SubmitButton>
          </div>
        </Col>
        <Col lg={4}>
          <Summary
            name={name}
            amount={amount}
            totalShares={totalShares}
            startDate={startDate}
            frequency={frequency}
            depositsPerRound={depositsPerRound}
          >
            <div className="d-none d-lg-block mt-4">
              <SubmitButton isSubmitting={isSubmitting} variant="warning">
                {submitLabel}
              </SubmitButton>
            </div>
          </Summary>
        </Col>
      </Row>
    </Form>
  );
}

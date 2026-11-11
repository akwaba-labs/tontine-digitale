import { useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';
import AmountDisplay from '../../../shared/components/AmountDisplay';
import { PAYMENT_METHODS } from '../../../shared/constants/domain';

/** Saisie du moyen et de la référence d'un versement (pot ou paiement en espèces). */
export default function PaymentMethodModal({
  show,
  title,
  amount,
  description,
  confirmLabel,
  isProcessing,
  onConfirm,
  onCancel,
}) {
  const [method, setMethod] = useState('CASH');
  const [reference, setReference] = useState('');

  return (
    <Modal show={show} onHide={isProcessing ? undefined : onCancel} centered>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm({ method, reference });
        }}
      >
        <Modal.Header closeButton={!isProcessing}>
          <Modal.Title as="h2" className="h5">
            {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {description && <p>{description}</p>}
          {amount !== undefined && (
            <p className="fs-5">
              Montant : <AmountDisplay amount={amount} className="fw-bold" />
            </p>
          )}
          <Form.Group className="mb-3" controlId="payment-method">
            <Form.Label className="fw-semibold">Moyen de paiement</Form.Label>
            <Form.Select value={method} onChange={(event) => setMethod(event.target.value)}>
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="payment-reference">
            <Form.Label className="fw-semibold">
              Référence de la transaction (facultatif)
            </Form.Label>
            <Form.Control
              value={reference}
              maxLength={100}
              onChange={(event) => setReference(event.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onCancel} disabled={isProcessing}>
            Annuler
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing && (
              <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />
            )}
            {confirmLabel}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

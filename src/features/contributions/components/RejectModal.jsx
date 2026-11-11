import { useState } from 'react';
import { Button, Form, Modal, Spinner } from 'react-bootstrap';

const SUGGESTIONS = ['Paiement non reçu', 'Montant incorrect', 'Référence introuvable'];

export default function RejectModal({ show, memberName, isProcessing, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 3;
  return (
    <Modal show={show} onHide={isProcessing ? undefined : onCancel} centered>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          if (isValid) onConfirm(reason);
        }}
      >
        <Modal.Header closeButton={!isProcessing}>
          <Modal.Title as="h2" className="h5">
            Rejeter le paiement de {memberName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {SUGGESTIONS.map((suggestion) => (
              <Button
                key={suggestion}
                size="sm"
                variant="outline-secondary"
                onClick={() => setReason(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
          <Form.Group controlId="reject-reason">
            <Form.Label className="fw-semibold">
              Motif (obligatoire, visible par le membre)
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              maxLength={300}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              isInvalid={reason.length > 0 && !isValid}
            />
            <Form.Control.Feedback type="invalid">3 caractères minimum.</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onCancel} disabled={isProcessing}>
            Annuler
          </Button>
          <Button type="submit" variant="danger" disabled={!isValid || isProcessing}>
            {isProcessing && (
              <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />
            )}
            Rejeter
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

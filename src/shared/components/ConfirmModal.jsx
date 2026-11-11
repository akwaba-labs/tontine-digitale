import { Button, Modal, Spinner } from 'react-bootstrap';

/** Fenêtre de confirmation avant une action importante. */
export default function ConfirmModal({
  show,
  title,
  children,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  confirmVariant = 'primary',
  isProcessing = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      show={show}
      onHide={isProcessing ? undefined : onCancel}
      centered
      backdrop={isProcessing ? 'static' : true}
    >
      <Modal.Header closeButton={!isProcessing}>
        <Modal.Title as="h2" className="h5">
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onCancel} disabled={isProcessing}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} disabled={isProcessing}>
          {isProcessing && (
            <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />
          )}
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

import { useId, useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  label,
  registration,
  error,
  autoComplete = 'current-password',
}) {
  const id = useId();
  const [isVisible, setIsVisible] = useState(false);
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label className="fw-semibold">{label}</Form.Label>
      <InputGroup hasValidation>
        <Form.Control
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          isInvalid={Boolean(error)}
          {...registration}
        />
        <Button
          variant="outline-secondary"
          onClick={() => setIsVisible((value) => !value)}
          aria-label={isVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={isVisible}
        >
          {isVisible ? (
            <EyeOff size={20} aria-hidden="true" />
          ) : (
            <Eye size={20} aria-hidden="true" />
          )}
        </Button>
        <Form.Control.Feedback type="invalid">{error?.message}</Form.Control.Feedback>
      </InputGroup>
    </Form.Group>
  );
}

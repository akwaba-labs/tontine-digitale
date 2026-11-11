import { useId } from 'react';
import { Form } from 'react-bootstrap';

/**
 * Champ de formulaire avec libellé, aide et message d'erreur (React Hook Form).
 * `registration` = résultat de register('nom').
 */
export default function TextField({
  label,
  registration,
  error,
  help,
  as,
  type = 'text',
  className = 'mb-3',
  children,
  ...inputProps
}) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  return (
    <Form.Group className={className} controlId={id}>
      <Form.Label className="fw-semibold">{label}</Form.Label>
      {as === 'select' ? (
        <Form.Select
          isInvalid={Boolean(error)}
          aria-describedby={helpId}
          {...registration}
          {...inputProps}
        >
          {children}
        </Form.Select>
      ) : (
        <Form.Control
          as={as}
          type={as ? undefined : type}
          isInvalid={Boolean(error)}
          aria-describedby={helpId}
          {...registration}
          {...inputProps}
        />
      )}
      {help && (
        <Form.Text id={helpId} className="d-block">
          {help}
        </Form.Text>
      )}
      <Form.Control.Feedback type="invalid">{error?.message}</Form.Control.Feedback>
    </Form.Group>
  );
}

import { Alert } from 'react-bootstrap';

export default function FormError({ message }) {
  if (!message) return null;
  return (
    <Alert variant="danger" role="alert">
      {message}
    </Alert>
  );
}

import { Button, Spinner } from 'react-bootstrap';

export default function SubmitButton({
  isSubmitting,
  children,
  variant = 'primary',
  className = 'w-100',
}) {
  return (
    <Button type="submit" variant={variant} size="lg" className={className} disabled={isSubmitting}>
      {isSubmitting && <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />}
      {children}
    </Button>
  );
}

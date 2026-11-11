import { Spinner } from 'react-bootstrap';

/** Indicateur de chargement centré, annoncé aux lecteurs d'écran. */
export default function Loader({ label = 'Chargement…', fullPage = false }) {
  return (
    <div
      className={`d-flex flex-column align-items-center justify-content-center gap-2 py-5${
        fullPage ? ' min-vh-100' : ''
      }`}
      role="status"
    >
      <Spinner animation="border" variant="primary" aria-hidden="true" />
      <span className="text-secondary">{label}</span>
    </div>
  );
}

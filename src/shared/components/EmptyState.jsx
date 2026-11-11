import { Button } from 'react-bootstrap';
import { Link } from 'react-router';
import { Inbox } from 'lucide-react';

/**
 * État vide avec une action proposée.
 * `action` : { label, to } pour un lien, ou { label, onClick } pour un bouton.
 */
export default function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="empty-state">
      <Icon size={56} strokeWidth={1.5} className="empty-state__icon mb-3" aria-hidden="true" />
      <h2 className="h5">{title}</h2>
      {message && <p className="empty-state__message">{message}</p>}
      {action &&
        (action.to ? (
          <Link to={action.to} className="btn btn-primary mt-2">
            {action.label}
          </Link>
        ) : (
          <Button className="mt-2" onClick={action.onClick}>
            {action.label}
          </Button>
        ))}
    </div>
  );
}

import { ListGroup } from 'react-bootstrap';
import { Link } from 'react-router';
import { AlertTriangle, Bell, CheckCircle2, Gift, Info } from 'lucide-react';

const ICONS = { danger: AlertTriangle, warning: Bell, success: Gift, info: Info };

export default function TodoList({ todos, showTontine = true }) {
  if (todos.length === 0) {
    return (
      <p className="d-flex align-items-center gap-2 text-success fw-semibold mb-0">
        <CheckCircle2 aria-hidden="true" /> Rien à faire pour le moment.
      </p>
    );
  }
  return (
    <ListGroup className="shadow-sm">
      {todos.map((todo) => {
        const Icon = ICONS[todo.variant] ?? Info;
        return (
          <ListGroup.Item
            key={todo.key}
            as={Link}
            to={todo.link}
            action
            className="d-flex align-items-center gap-3 py-3"
          >
            <Icon size={22} className={`text-${todo.variant} flex-shrink-0`} aria-hidden="true" />
            <span>
              {showTontine && (
                <span className="small text-secondary d-block">{todo.tontineName}</span>
              )}
              {todo.text}
            </span>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}

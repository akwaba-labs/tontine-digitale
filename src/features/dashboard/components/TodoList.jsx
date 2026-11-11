import { Link } from 'react-router';
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, Gift, Info } from 'lucide-react';

const ICONS = { danger: AlertTriangle, warning: Bell, success: Gift, info: Info };

export default function TodoList({ todos, showTontine = true }) {
  if (todos.length === 0) {
    return (
      <div className="all-clear">
        <CheckCircle2 size={28} aria-hidden="true" />
        <div>
          <strong>Rien à faire pour le moment.</strong>
          <div className="small">Vous serez prévenu ici dès qu’une action vous attend.</div>
        </div>
      </div>
    );
  }
  return (
    <ul className="todo-list">
      {todos.map((todo) => {
        const Icon = ICONS[todo.variant] ?? Info;
        return (
          <li key={todo.key}>
            <Link to={todo.link} className="todo-item">
              <span className={`icon-bubble icon-bubble--${todo.variant}`}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="flex-grow-1 min-w-0">
                {showTontine && <span className="todo-item__tontine">{todo.tontineName}</span>}
                <span className="todo-item__text">{todo.text}</span>
              </span>
              <ChevronRight size={18} className="text-secondary flex-shrink-0" aria-hidden="true" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

import { NavLink } from 'react-router';
import { ClipboardCheck, UserRound } from 'lucide-react';
import { ROUTES } from '../../app/routePaths';

/** Bascule entre l'espace membre et l'espace organisateur. */
export default function SpaceSwitch({ organizerCount = 0 }) {
  return (
    <nav className="space-switch" aria-label="Choisir l’espace">
      <NavLink to={ROUTES.dashboard} end className="space-switch__item">
        <UserRound size={16} aria-hidden="true" /> Membre
      </NavLink>
      <NavLink to={ROUTES.organizer} className="space-switch__item">
        <ClipboardCheck size={16} aria-hidden="true" /> Organisateur
        {organizerCount > 0 && <span className="space-switch__count">{organizerCount}</span>}
      </NavLink>
    </nav>
  );
}

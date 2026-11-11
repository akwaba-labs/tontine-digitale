import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AmountDisplay from './AmountDisplay';
import StatusBadge from './StatusBadge';
import ConfirmModal from './ConfirmModal';

describe('AmountDisplay', () => {
  it('affiche un montant en FCFA', () => {
    render(<AmountDisplay amount={25000} />);
    expect(screen.getByText('25 000 FCFA')).toBeInTheDocument();
  });
});

describe('StatusBadge', () => {
  it.each([
    ['CONFIRMED', 'Confirmé', 'bg-success'],
    ['DECLARED', 'Déclaré', 'bg-warning'],
    ['LATE', 'En retard', 'bg-danger'],
  ])('affiche %s en français', (status, label, className) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toHaveClass(className);
  });
});

describe('ConfirmModal', () => {
  it('appelle onConfirm et onCancel', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmModal show title="Confirmer le paiement ?" onConfirm={onConfirm} onCancel={onCancel}>
        Cette action sera inscrite dans l’historique.
      </ConfirmModal>,
    );

    await user.click(screen.getByRole('button', { name: 'Confirmer' }));
    await user.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

// Libellés et couleurs des statuts affichés par <StatusBadge>.
// Vert = payé / actif, orange = déclaré / en attente, rouge = en retard / rejeté.
export const STATUS_DISPLAY = Object.freeze({
  // Cotisations
  PENDING: { label: 'À payer', variant: 'secondary' },
  DECLARED: { label: 'Déclaré', variant: 'warning' },
  CONFIRMED: { label: 'Confirmé', variant: 'success' },
  REJECTED: { label: 'Rejeté', variant: 'danger' },
  LATE: { label: 'En retard', variant: 'danger' },
  // Tontines
  DRAFT: { label: 'En préparation', variant: 'secondary' },
  ACTIVE: { label: 'En cours', variant: 'success' },
  COMPLETED: { label: 'Terminée', variant: 'primary' },
  CANCELLED: { label: 'Annulée', variant: 'dark' },
});

export function getStatusDisplay(status) {
  return STATUS_DISPLAY[status] ?? { label: status ?? 'Inconnu', variant: 'secondary' };
}

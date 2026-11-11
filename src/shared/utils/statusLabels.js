// Libellés et couleurs des statuts affichés par <StatusBadge>.
// Vert = payé / actif, orange = déclaré / en attente, rouge = en retard / rejeté.
export const STATUS_DISPLAY = Object.freeze({
  contribution: {
    PENDING: { label: 'À payer', variant: 'secondary' },
    DECLARED: { label: 'Déclaré', variant: 'warning' },
    CONFIRMED: { label: 'Confirmé', variant: 'success' },
    REJECTED: { label: 'Rejeté', variant: 'danger' },
    LATE: { label: 'En retard', variant: 'danger' },
  },
  tontine: {
    DRAFT: { label: 'En préparation', variant: 'secondary' },
    ACTIVE: { label: 'En cours', variant: 'success' },
    COMPLETED: { label: 'Terminée', variant: 'primary' },
    CANCELLED: { label: 'Annulée', variant: 'dark' },
  },
  member: {
    PENDING: { label: 'Demande en attente', variant: 'warning' },
    ACTIVE: { label: 'Membre', variant: 'success' },
    REFUSED: { label: 'Refusé', variant: 'danger' },
    LEFT: { label: 'Parti', variant: 'secondary' },
  },
  round: {
    UPCOMING: { label: 'À venir', variant: 'secondary' },
    CURRENT: { label: 'En cours', variant: 'warning' },
    AWAITING_PAYOUT: { label: 'Versement à faire', variant: 'danger' },
    COMPLETED: { label: 'Terminé', variant: 'success' },
  },
  payout: {
    PENDING: { label: 'Pot non versé', variant: 'secondary' },
    SENT: { label: 'Pot envoyé', variant: 'warning' },
    RECEIVED: { label: 'Pot reçu', variant: 'success' },
  },
});

export function getStatusDisplay(status, kind = 'contribution') {
  return STATUS_DISPLAY[kind]?.[status] ?? { label: status ?? 'Inconnu', variant: 'secondary' };
}

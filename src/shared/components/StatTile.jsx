/** Tuile de chiffre clé : icône dans une pastille, libellé, valeur et précision facultative. */
export default function StatTile({ icon: Icon, label, value, hint, tone = 'green' }) {
  return (
    <div className={`stat-tile stat-tile--${tone}`}>
      {Icon && (
        <span className="stat-tile__icon">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <div className="stat-tile__label">{label}</div>
        <div className="stat-tile__value">{value}</div>
        {hint && <div className="stat-tile__hint">{hint}</div>}
      </div>
    </div>
  );
}

import { APP_NAME } from '../../config/app';

/** Titre de page (h1) + titre de l'onglet du navigateur, avec actions optionnelles à droite. */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="page-header d-flex flex-wrap align-items-start justify-content-between gap-2">
      <title>{`${title} · ${APP_NAME}`}</title>
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="text-secondary mb-0">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex gap-2">{actions}</div>}
    </header>
  );
}

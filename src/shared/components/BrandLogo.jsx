import { APP_NAME } from '../../config/app';

export default function BrandLogo() {
  return <img src="/favicon.svg" alt="" className="brand-logo" width="32" height="32" />;
}

/** Nom de l'application, le dernier mot en couleur (« Tontine Digitale »). */
export function BrandName({ className = '' }) {
  const words = APP_NAME.split(' ');
  const last = words.pop();
  return (
    <span className={`brand-name ${className}`.trim()}>
      {words.length > 0 && `${words.join(' ')} `}
      <em>{last}</em>
    </span>
  );
}

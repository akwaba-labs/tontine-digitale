import { ShieldCheck } from 'lucide-react';
import { APP_NAME } from '../../../config/app';

/** Information sur l'usage des données (loi ivoirienne n° 2013-450). */
export default function PrivacyNotice({ compact = false }) {
  if (compact) {
    return (
      <p className="small text-secondary d-flex gap-2">
        <ShieldCheck size={18} className="flex-shrink-0 text-primary" aria-hidden="true" />
        <span>
          Vos nom, téléphone et e-mail servent uniquement à faire fonctionner vos tontines. Nom et
          téléphone sont visibles par les membres de vos tontines. Vous pouvez supprimer votre
          compte à tout moment (loi n° 2013-450 sur les données personnelles).
        </span>
      </p>
    );
  }
  return (
    <div className="small">
      <p>
        {APP_NAME} collecte votre prénom, nom, téléphone, e-mail et, si vous le choisissez, une
        photo de profil et des captures d’écran de paiement. Ces données servent uniquement à gérer
        vos tontines : identifier les membres, suivre les cotisations et garder un historique
        fiable.
      </p>
      <ul>
        <li>Votre nom et votre téléphone sont visibles par les membres de vos tontines.</li>
        <li>Vos données ne sont ni vendues ni partagées avec des tiers.</li>
        <li>Elles sont hébergées par Google Firebase.</li>
        <li>
          Conformément à la loi ivoirienne n° 2013-450 relative à la protection des données à
          caractère personnel, vous pouvez consulter, corriger (page Profil) ou supprimer
          (ci-dessous) vos données.
        </li>
        <li>
          L’historique des tontines (cotisations, journal) est conservé pour les autres membres : il
          fait foi, comme un cahier de tontine.
        </li>
      </ul>
    </div>
  );
}

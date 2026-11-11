import { useSyncExternalStore } from 'react';
import { WifiOff } from 'lucide-react';

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

/** Bandeau affiché hors connexion : les données déjà chargées restent consultables. */
export default function OfflineBanner() {
  const isOnline = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (isOnline) return null;
  return (
    <div
      className="bg-warning text-dark text-center small py-2 px-3 d-flex justify-content-center gap-2"
      role="status"
    >
      <WifiOff size={18} aria-hidden="true" />
      Pas de connexion internet : vous voyez les dernières données reçues. Vos actions seront
      envoyées au retour du réseau.
    </div>
  );
}

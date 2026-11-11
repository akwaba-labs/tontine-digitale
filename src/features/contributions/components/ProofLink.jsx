import { useEffect, useState } from 'react';
import { Image } from 'lucide-react';
import { getProofUrl } from '../services/contributionService';

/** Lien vers la capture d'écran envoyée comme preuve (lisible par les membres uniquement). */
export default function ProofLink({ path }) {
  const [state, setState] = useState({ path: null, url: null });
  useEffect(() => {
    let cancelled = false;
    getProofUrl(path)
      .then((url) => !cancelled && setState({ path, url }))
      .catch(() => !cancelled && setState({ path, url: null }));
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (state.path !== path || !state.url) return null;
  return (
    <a
      href={state.url}
      target="_blank"
      rel="noopener noreferrer"
      className="small d-inline-flex align-items-center gap-1"
    >
      <Image size={14} aria-hidden="true" />
      Voir la preuve
    </a>
  );
}

import { useEffect, useState } from 'react';
import { TONTINE_STATUS } from '../../../shared/constants/domain';
import { subscribeRounds } from '../../rounds/services/roundService';
import { subscribeContributions } from '../../contributions/services/contributionService';
import { subscribeMembers } from '../../members/services/memberService';

/**
 * Données temps réel de plusieurs tontines (tableau de bord, rappels) :
 * membres, tours et cotisations des tontines en cours, membres des tontines en préparation.
 */
export function useTontineBundles(tontines) {
  const active = (tontines ?? [])
    .filter((t) => t.status === TONTINE_STATUS.ACTIVE)
    .map((t) => t.id);
  const drafts = (tontines ?? []).filter((t) => t.status === TONTINE_STATUS.DRAFT).map((t) => t.id);
  const key = `${active.sort().join(',')}|${drafts.sort().join(',')}`;
  const [bundles, setBundles] = useState({});

  useEffect(() => {
    const [activeIds, draftIds] = key.split('|').map((part) => (part ? part.split(',') : []));
    const update = (id, field) => (value) =>
      setBundles((previous) => ({ ...previous, [id]: { ...previous[id], [field]: value } }));
    const onError = (error) => console.error(error);
    const unsubscribes = [
      ...activeIds.flatMap((id) => [
        subscribeMembers(id, update(id, 'members'), onError),
        subscribeRounds(id, update(id, 'rounds'), onError),
        subscribeContributions(id, update(id, 'contributions'), onError),
      ]),
      ...draftIds.map((id) => subscribeMembers(id, update(id, 'members'), onError)),
    ];
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [key]);

  const isLoading = active.some(
    (id) => !bundles[id]?.members || !bundles[id]?.rounds || !bundles[id]?.contributions,
  );
  return { bundles, isLoading };
}

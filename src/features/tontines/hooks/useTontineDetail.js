import { useMemo } from 'react';
import { useSubscription } from '../../../shared/hooks/useSubscription';
import { useActor, useAuth } from '../../../shared/hooks/useAuth';
import { todayIso } from '../../../shared/utils/dates';
import { TONTINE_STATUS } from '../../../shared/constants/domain';
import { subscribeTontine } from '../services/tontineService';
import { subscribeMembers } from '../../members/services/memberService';
import { subscribeRounds } from '../../rounds/services/roundService';
import { subscribeContributions } from '../../contributions/services/contributionService';
import { indexContributions } from '../../contributions/logic/contributions';
import {
  buildDeposits,
  getCurrentDepositIndex,
  getCurrentRoundIndex,
} from '../../rounds/logic/schedule';

/** Toutes les données d'une tontine, en temps réel, et les droits de l'utilisateur. */
export function useTontineDetail(tontineId) {
  const { user } = useAuth();
  const actor = useActor();

  const tontine = useSubscription(tontineId ? `tontine:${tontineId}` : null, (onData, onError) =>
    subscribeTontine(tontineId, onData, onError),
  );
  const canLoadChildren = Boolean(tontine.data);
  const members = useSubscription(
    canLoadChildren ? `members:${tontineId}` : null,
    (onData, onError) => subscribeMembers(tontineId, onData, onError),
  );
  const isStarted = canLoadChildren && tontine.data.status !== TONTINE_STATUS.DRAFT;
  const rounds = useSubscription(isStarted ? `rounds:${tontineId}` : null, (onData, onError) =>
    subscribeRounds(tontineId, onData, onError),
  );
  const contributions = useSubscription(
    isStarted ? `contributions:${tontineId}` : null,
    (onData, onError) => subscribeContributions(tontineId, onData, onError),
  );

  return useMemo(() => {
    const today = todayIso();
    const t = tontine.data;
    const memberList = members.data ?? [];
    const roundList = rounds.data ?? [];
    const contributionList = contributions.data ?? [];
    const uid = user?.uid;
    const currentRoundIndex = getCurrentRoundIndex(roundList, today);
    const deposits = buildDeposits(roundList);
    const currentDepositIndex = getCurrentDepositIndex(deposits, today);
    return {
      isLoading:
        tontine.isLoading || members.isLoading || rounds.isLoading || contributions.isLoading,
      error: tontine.error || members.error || rounds.error || contributions.error,
      notFound: !tontine.isLoading && !tontine.error && t === null,
      tontine: t,
      members: memberList,
      rounds: roundList,
      contributions: contributionList,
      contributionsById: indexContributions(contributionList),
      me: memberList.find((member) => member.userId === uid) ?? null,
      isOwner: Boolean(t && t.ownerId === uid),
      isManager: Boolean(t && (t.ownerId === uid || (t.coOrganizerIds ?? []).includes(uid))),
      today,
      currentRoundIndex,
      currentRound: roundList.find((round) => round.index === currentRoundIndex) ?? null,
      deposits,
      currentDepositIndex,
      actor,
      uid,
    };
  }, [tontine, members, rounds, contributions, user, actor]);
}

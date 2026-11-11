import {
  collection,
  collectionGroup,
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  sum,
  where,
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { fromSnapshot } from '../../../shared/services/firestoreUtils';
import { CONTRIBUTION_STATUS, TONTINE_STATUS } from '../../../shared/constants/domain';

// Back-office : lectures sur toute la plateforme (autorisées aux administrateurs seulement).

const count = async (q) => (await getCountFromServer(q)).data().count;

/** Chiffres clés de la plateforme. */
export async function getPlatformStats() {
  const tontines = collection(db, 'tontines');
  const contributions = collectionGroup(db, 'contributions');
  const [users, total, active, draft, completed, cancelled, confirmed, late, mails] =
    await Promise.all([
      count(collection(db, 'users')),
      count(tontines),
      count(query(tontines, where('status', '==', TONTINE_STATUS.ACTIVE))),
      count(query(tontines, where('status', '==', TONTINE_STATUS.DRAFT))),
      count(query(tontines, where('status', '==', TONTINE_STATUS.COMPLETED))),
      count(query(tontines, where('status', '==', TONTINE_STATUS.CANCELLED))),
      getAggregateFromServer(
        query(contributions, where('status', '==', CONTRIBUTION_STATUS.CONFIRMED)),
        {
          amount: sum('amount'),
          penalties: sum('penaltyAmount'),
          count: { aggregateType: 'count' },
        },
      ),
      count(query(contributions, where('status', '==', CONTRIBUTION_STATUS.LATE))),
      count(collection(db, 'mailLog')),
    ]);
  const confirmedData = confirmed.data();
  return {
    users,
    tontines: { total, active, draft, completed, cancelled },
    confirmedAmount: confirmedData.amount ?? 0,
    penaltiesAmount: confirmedData.penalties ?? 0,
    confirmedCount: confirmedData.count ?? 0,
    lateWithPenalty: late,
    mails,
  };
}

export async function listUsers(max = 300) {
  const snapshot = await getDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(max)),
  );
  return snapshot.docs.map(fromSnapshot);
}

export async function listAllTontines(max = 300) {
  const snapshot = await getDocs(
    query(collection(db, 'tontines'), orderBy('createdAt', 'desc'), limit(max)),
  );
  return snapshot.docs.map(fromSnapshot);
}

/** Dernières entrées du journal, toutes tontines confondues. */
export async function listRecentEvents(max = 15) {
  const snapshot = await getDocs(
    query(collectionGroup(db, 'events'), orderBy('createdAt', 'desc'), limit(max)),
  );
  return snapshot.docs.map((d) => ({ ...fromSnapshot(d), tontineId: d.ref.parent.parent.id }));
}

export async function listMailLog(max = 200) {
  const snapshot = await getDocs(
    query(collection(db, 'mailLog'), orderBy('createdAt', 'desc'), limit(max)),
  );
  return snapshot.docs.map(fromSnapshot);
}

import { useEffect, useState } from 'react';
import { Button, ListGroup, Spinner } from 'react-bootstrap';
import { History } from 'lucide-react';
import EmptyState from '../../../shared/components/EmptyState';
import Loader from '../../../shared/components/Loader';
import { formatDateTime } from '../../../shared/utils/formatDate';
import { getErrorMessage } from '../../../shared/utils/errorMessages';
import { describeEvent } from '../logic/eventLabels';
import { fetchEventsPage } from '../services/eventService';

/** Journal des opérations, paginé (le plus récent en premier). Personne ne peut le modifier. */
export default function HistoryTab({ detail }) {
  const tontineId = detail.tontine.id;
  // `version` change à chaque mise à jour de la tontine : on recharge la première page.
  const version = detail.tontine.updatedAt?.toMillis?.() ?? 0;
  const [state, setState] = useState({
    key: null,
    events: [],
    cursor: null,
    hasMore: false,
    error: null,
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const key = `${tontineId}:${version}:${detail.contributions.length}`;

  useEffect(() => {
    let cancelled = false;
    fetchEventsPage(tontineId)
      .then((page) => !cancelled && setState({ key, ...page, error: null }))
      .catch(
        (error) => !cancelled && setState({ key, events: [], cursor: null, hasMore: false, error }),
      );
    return () => {
      cancelled = true;
    };
  }, [tontineId, key]);

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const page = await fetchEventsPage(tontineId, state.cursor);
      setState((current) => ({ ...current, ...page, events: [...current.events, ...page.events] }));
    } catch (error) {
      setState((current) => ({ ...current, error }));
    } finally {
      setIsLoadingMore(false);
    }
  };

  if (state.key === null) return <Loader />;
  if (state.error && state.events.length === 0) {
    return <EmptyState title="Historique indisponible" message={getErrorMessage(state.error)} />;
  }
  if (state.events.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Historique vide"
        message="Les opérations s’afficheront ici."
      />
    );
  }

  return (
    <>
      <p className="small text-secondary">
        Toutes les opérations sont inscrites ici automatiquement. Personne, pas même l’organisateur,
        ne peut modifier ou effacer une entrée.
      </p>
      <ListGroup className="shadow-sm mb-3">
        {state.events.map((event) => (
          <ListGroup.Item key={event.id}>
            <div className="small text-secondary">
              {event.createdAt ? formatDateTime(event.createdAt) : ''}
            </div>
            <div>{describeEvent(event)}</div>
          </ListGroup.Item>
        ))}
      </ListGroup>
      {state.hasMore && (
        <Button
          variant="outline-primary"
          className="w-100"
          onClick={loadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore && (
            <Spinner size="sm" animation="border" className="me-2" aria-hidden="true" />
          )}
          Voir plus
        </Button>
      )}
    </>
  );
}

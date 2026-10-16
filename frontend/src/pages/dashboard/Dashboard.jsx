import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Trash2, Upload, Link2, Loader2, Settings2, Pencil } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { eventService } from '../../services/event.service.js';
import { getErrorMessage } from '../../services/api.js';
import { EVENT_STATUS_LABELS } from '../../utils/constants.js';
import PosterDownload from '../../components/event/PosterDownload.jsx';

function formatDate(value) {
  if (!value) return 'Date a definir';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    eventService
      .list()
      .then((data) => active && setEvents(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const replaceEvent = (updated) =>
    setEvents((list) => list.map((e) => (e._id === updated._id ? updated : e)));

  const handleTogglePublish = async (event) => {
    setBusyId(event._id);
    try {
      const updated =
        event.status === 'published'
          ? await eventService.unpublish(event._id)
          : await eventService.publish(event._id);
      replaceEvent(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (event) => {
    setBusyId(event._id);
    try {
      const created = await eventService.duplicate(event._id);
      setEvents((list) => [created, ...list]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleArchiveToggle = async (event) => {
    setBusyId(event._id);
    try {
      const updated =
        event.status === 'archived'
          ? await eventService.unarchive(event._id)
          : await eventService.archive(event._id);
      replaceEvent(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm(`Supprimer "${event.title}" ? Cette action est definitive.`)) return;
    setBusyId(event._id);
    try {
      await eventService.remove(event._id);
      setEvents((list) => list.filter((e) => e._id !== event._id));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyLink = (event) => {
    navigator.clipboard?.writeText(`${window.location.origin}/e/${event.slug}`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mes evenements</h1>
          <p className="text-sm text-celebra-dark/60">
            Gerez vos invitations et suivez vos invites, {user?.firstName}.
          </p>
        </div>
        <Link to="/dashboard/creer" className="btn-primary">
          <Plus size={16} />
          Creer un evenement
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-celebra-dark/60">
          <Loader2 className="animate-spin" size={20} />
          Chargement...
        </div>
      ) : events.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-celebra-dark/70">Vous n&apos;avez pas encore d&apos;evenement.</p>
          <Link to="/dashboard/creer" className="btn-primary">
            Creer mon premier evenement
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <article key={event._id} className="card flex flex-col overflow-hidden">
              <div className="p-4">
                {event.mainImage?.url ? (
                  <PosterDownload event={event} />
                ) : (
                  <div
                    className="flex h-40 items-center justify-center rounded-lg text-sm text-white/90"
                    style={{
                      background: `linear-gradient(135deg, ${
                        event.design?.primaryColor || '#B08D57'
                      }, ${event.design?.secondaryColor || '#1F2937'})`,
                    }}
                  >
                    Aucune affiche importee
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-3 px-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold leading-tight">{event.title}</h2>
                    <p className="text-xs uppercase tracking-wide text-celebra-dark/50">
                      {event.category}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      event.status === 'published'
                        ? 'bg-green-50 text-green-700'
                        : event.status === 'archived'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-celebra-dark/5 text-celebra-dark/60'
                    }`}
                  >
                    {EVENT_STATUS_LABELS[event.status] || event.status}
                  </span>
                </div>

                <p className="text-sm text-celebra-dark/60">{formatDate(event.date)}</p>

                <div className="mt-auto flex flex-wrap gap-2">
                  <Link to={`/dashboard/evenements/${event._id}`} className="btn-outline">
                    <Settings2 size={15} />
                    Gerer
                  </Link>
                  <Link to={`/dashboard/evenements/${event._id}/editer`} className="btn-outline">
                    <Pencil size={15} />
                    Modifier
                  </Link>
                  <Link to={`/dashboard/evenements/${event._id}/apercu`} className="btn-outline">
                    <Eye size={15} />
                    Apercu
                  </Link>
                  {event.status === 'published' && (
                    <Link to={`/e/${event.slug}`} className="btn-outline">
                      <Eye size={15} />
                      Voir
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={busyId === event._id}
                    onClick={() => handleTogglePublish(event)}
                  >
                    <Upload size={15} />
                    {event.status === 'published' ? 'Depublier' : 'Publier'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={busyId === event._id}
                    onClick={() => handleDuplicate(event)}
                  >
                    Dupliquer
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={busyId === event._id}
                    onClick={() => handleArchiveToggle(event)}
                  >
                    {event.status === 'archived' ? 'Restaurer' : 'Archiver'}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => handleCopyLink(event)}
                    title="Copier le lien"
                  >
                    <Link2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-red-600"
                    disabled={busyId === event._id}
                    onClick={() => handleDelete(event)}
                    title="Supprimer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

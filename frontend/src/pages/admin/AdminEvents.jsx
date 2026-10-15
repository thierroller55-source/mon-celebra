import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { EVENT_STATUS_LABELS } from '../../utils/constants.js';

export default function AdminEvents() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.events({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      });
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (event) => {
    if (!window.confirm(`Supprimer "${event.title}" et toutes ses donnees ?`)) return;
    setBusyId(event._id);
    try {
      await adminService.deleteEvent(event._id);
      setEvents((list) => list.filter((e) => e._id !== event._id));
      toast.success('Evenement supprime.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">Evenements</h1>

      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
      >
        <input
          className="input max-w-xs"
          placeholder="Rechercher un titre"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input max-w-[180px]"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(EVENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-outline">
          <Search size={15} /> Rechercher
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-celebra-dark/60">
          <Loader2 className="animate-spin" size={20} /> Chargement...
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-celebra-dark/10 text-xs uppercase text-celebra-dark/50">
              <tr>
                <th className="px-4 py-3">Titre</th>
                <th className="px-4 py-3">Organisateur</th>
                <th className="px-4 py-3">Categorie</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">RSVP</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event._id} className="border-b border-celebra-dark/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{event.title}</td>
                  <td className="px-4 py-3 text-celebra-dark/70">
                    {event.ownerId
                      ? `${event.ownerId.firstName} ${event.ownerId.lastName}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 capitalize text-celebra-dark/60">{event.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        event.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-celebra-dark/5 text-celebra-dark/60'
                      }`}
                    >
                      {EVENT_STATUS_LABELS[event.status] || event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-celebra-dark/60">
                    {event.stats?.rsvpYes ?? 0} oui / {event.stats?.rsvpMaybe ?? 0} ?
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {event.status === 'published' && (
                        <Link
                          to={`/e/${event.slug}`}
                          target="_blank"
                          className="btn-outline px-2 py-1"
                          title="Voir"
                        >
                          <ExternalLink size={15} />
                        </Link>
                      )}
                      <button
                        type="button"
                        className="btn-outline px-2 py-1 text-red-600"
                        title="Supprimer"
                        disabled={busyId === event._id}
                        onClick={() => handleDelete(event)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button type="button" className="btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Precedent
          </button>
          <span className="text-celebra-dark/60">
            Page {pagination.page} / {pagination.pages}
          </span>
          <button type="button" className="btn-outline" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

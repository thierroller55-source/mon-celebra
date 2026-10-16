import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Download,
  Check,
  X,
  Trash2,
  ExternalLink,
  Users,
  MessageSquare,
  Eye,
  Pencil,
} from 'lucide-react';
import { eventService } from '../../services/event.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import PosterDownload from '../../components/event/PosterDownload.jsx';

const RESPONSE_LABELS = { yes: 'Oui', no: 'Non', maybe: 'Peut-etre' };
const STATUS_STYLES = {
  approved: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-700',
};

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EventManage() {
  const { id } = useParams();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [stats, setStats] = useState({});
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('rsvp');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      eventService.get(id),
      eventService.listRsvp(id),
      eventService.listGuestbook(id),
    ])
      .then(([ev, rsvpData, guestbook]) => {
        if (!active) return;
        setEvent(ev);
        setRsvps(rsvpData.rsvps);
        setStats(rsvpData.stats || {});
        setMessages(guestbook);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const handleExport = async () => {
    try {
      const blob = await eventService.exportRsvp(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rsvp-${event?.slug || id}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleModerate = async (msgId, status) => {
    setBusyId(msgId);
    try {
      const updated = await eventService.moderateGuestbook(id, msgId, status);
      setMessages((list) => list.map((m) => (m._id === msgId ? updated : m)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Supprimer ce message ?')) return;
    setBusyId(msgId);
    try {
      await eventService.deleteGuestbookMessage(id, msgId);
      setMessages((list) => list.filter((m) => m._id !== msgId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-celebra-dark/60">
        <Loader2 className="animate-spin" size={20} />
        Chargement...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
        <Link to="/dashboard" className="btn-outline mt-4">
          <ArrowLeft size={16} /> Retour
        </Link>
      </div>
    );
  }

  const pendingCount = messages.filter((m) => m.status === 'pending').length;

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link to="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm text-celebra-dark/60 hover:text-celebra-dark">
        <ArrowLeft size={15} /> Mes evenements
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{event?.title}</h1>
          <p className="text-sm text-celebra-dark/60">
            Suivi des confirmations et du livre d&apos;or.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/evenements/${id}/apercu`} className="btn-outline">
            <Eye size={15} /> Apercu
          </Link>
          <Link to={`/dashboard/evenements/${id}/editer`} className="btn-outline">
            <Pencil size={15} /> Modifier
          </Link>
          {event?.status === 'published' && (
            <Link to={`/e/${event.slug}`} className="btn-outline">
              <ExternalLink size={15} /> Voir la page
            </Link>
          )}
        </div>
      </div>

      {event?.mainImage?.url && (
        <div className="card mb-6 p-4">
          <h2 className="mb-3 text-sm font-semibold text-celebra-dark/70">
            Affiche avec QR code
          </h2>
          <div className="max-w-md">
            <PosterDownload event={event} showPosition />
          </div>
        </div>
      )}

      <div className="mb-6 flex gap-2 border-b border-celebra-dark/10">
        <button
          type="button"
          onClick={() => setTab('rsvp')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'rsvp'
              ? 'border-celebra-gold text-celebra-gold'
              : 'border-transparent text-celebra-dark/60'
          }`}
        >
          <Users size={15} className="mr-1 inline" />
          RSVP ({rsvps.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('guestbook')}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            tab === 'guestbook'
              ? 'border-celebra-gold text-celebra-gold'
              : 'border-transparent text-celebra-dark/60'
          }`}
        >
          <MessageSquare size={15} className="mr-1 inline" />
          Livre d&apos;or ({messages.length})
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {tab === 'rsvp' && (
        <section>
          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { key: 'rsvpYes', label: 'Oui', color: 'text-green-700' },
              { key: 'rsvpMaybe', label: 'Peut-etre', color: 'text-amber-700' },
              { key: 'rsvpNo', label: 'Non', color: 'text-red-700' },
            ].map((s) => (
              <div key={s.key} className="card p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{stats[s.key] ?? 0}</p>
                <p className="text-xs text-celebra-dark/50">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-3 flex justify-end">
            <button type="button" className="btn-outline" onClick={handleExport} disabled={!rsvps.length}>
              <Download size={15} /> Exporter CSV
            </button>
          </div>

          {rsvps.length === 0 ? (
            <p className="card p-8 text-center text-sm text-celebra-dark/60">
              Aucune confirmation pour le moment.
            </p>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-celebra-dark/10 text-xs uppercase text-celebra-dark/50">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Reponse</th>
                    <th className="px-4 py-3">Pers.</th>
                    <th className="px-4 py-3">Telephone</th>
                    <th className="px-4 py-3">Message</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((r) => (
                    <tr key={r._id} className="border-b border-celebra-dark/5 last:border-0">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3">{RESPONSE_LABELS[r.response] || r.response}</td>
                      <td className="px-4 py-3">{r.guestsCount}</td>
                      <td className="px-4 py-3 text-celebra-dark/60">{r.phone || '-'}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-celebra-dark/60">
                        {r.message || '-'}
                      </td>
                      <td className="px-4 py-3 text-celebra-dark/50">{formatDate(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'guestbook' && (
        <section className="space-y-3">
          {messages.length === 0 ? (
            <p className="card p-8 text-center text-sm text-celebra-dark/60">
              Aucun message pour le moment.
            </p>
          ) : (
            messages.map((msg) => (
              <article key={msg._id} className="card flex items-start gap-3 p-4">
                {msg.photo?.url && (
                  <img src={msg.photo.url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{msg.authorName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[msg.status]}`}>
                      {msg.status}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-celebra-dark/80">
                    {msg.message}
                  </p>
                  <p className="mt-1 text-xs text-celebra-dark/40">{formatDate(msg.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {msg.status !== 'approved' && (
                    <button
                      type="button"
                      className="btn-outline px-2 py-1 text-green-700"
                      title="Approuver"
                      disabled={busyId === msg._id}
                      onClick={() => handleModerate(msg._id, 'approved')}
                    >
                      <Check size={15} />
                    </button>
                  )}
                  {msg.status !== 'rejected' && (
                    <button
                      type="button"
                      className="btn-outline px-2 py-1 text-amber-700"
                      title="Rejeter"
                      disabled={busyId === msg._id}
                      onClick={() => handleModerate(msg._id, 'rejected')}
                    >
                      <X size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-outline px-2 py-1 text-red-600"
                    title="Supprimer"
                    disabled={busyId === msg._id}
                    onClick={() => handleDeleteMessage(msg._id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
}

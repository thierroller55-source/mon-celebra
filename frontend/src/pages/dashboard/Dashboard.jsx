import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Trash2, Upload, Link2, Loader2, Settings2, Pencil } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';
import { useLocale, useLocalePath } from '../../context/LocaleContext.jsx';
import { eventService } from '../../services/event.service.js';
import { getErrorMessage } from '../../services/api.js';
import { formatDate } from '../../lib/date.js';

const STATUS_CLASS = {
  published: 'bg-green-50 text-green-700',
  archived: 'bg-amber-50 text-amber-700',
  draft: 'bg-celebra-dark/5 text-celebra-dark/60',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const lp = useLocalePath();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    eventService
      .list()
      .then((data) => {
        if (active) setEvents(data);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
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
    if (!window.confirm(t('dashboard.deleteConfirm', { title: event.title }))) return;
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
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-sm text-celebra-dark/60">
            {t('dashboard.subtitle', { name: user?.firstName || '' })}
          </p>
        </div>
        <Link to={lp('/dashboard/creer')} className="btn-primary">
          <Plus size={16} />
          {t('dashboard.create')}
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
          {t('common.loading')}
        </div>
      ) : events.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-celebra-dark/70">{t('dashboard.empty')}</p>
          <Link to={lp('/dashboard/creer')} className="btn-primary">
            {t('dashboard.emptyCta')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <article key={event._id} className="card flex flex-col overflow-hidden">
              <div className="p-4">
                <div className="flex h-40 items-center justify-center overflow-hidden rounded-lg text-sm text-white/90">
                  {event.mainImage?.url ? (
                    <img
                      src={event.mainImage.url}
                      alt={event.title}
                      className="max-h-40 w-full object-contain"
                    />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center px-3 text-center"
                      style={{
                        background: `linear-gradient(135deg, ${
                          event.design?.primaryColor || '#B08D57'
                        }, ${event.design?.secondaryColor || '#1F2937'})`,
                      }}
                    >
                      {t('dashboard.noPoster')}
                    </span>
                  )}
                </div>
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
                      STATUS_CLASS[event.status] || STATUS_CLASS.draft
                    }`}
                  >
                    {t(`dashboard.status.${event.status}`, { defaultValue: event.status })}
                  </span>
                </div>

                <p className="text-sm text-celebra-dark/60">{formatDate(event.date, { locale })}</p>

                <div className="mt-auto flex flex-wrap gap-2">
                  <Link to={lp(`/dashboard/evenements/${event._id}`)} className="btn-outline">
                    <Settings2 size={15} />
                    {t('common.manage')}
                  </Link>
                  <Link to={lp(`/dashboard/evenements/${event._id}/editer`)} className="btn-outline">
                    <Pencil size={15} />
                    {t('common.edit')}
                  </Link>
                  <Link to={lp(`/dashboard/evenements/${event._id}/apercu`)} className="btn-outline">
                    <Eye size={15} />
                    {t('common.preview')}
                  </Link>
                  {event.status === 'published' && (
                    <Link to={lp(`/e/${event.slug}`)} className="btn-outline">
                      <Eye size={15} />
                      {t('common.view')}
                    </Link>
                  )}
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={busyId === event._id}
                    onClick={() => handleTogglePublish(event)}
                  >
                    <Upload size={15} />
                    {event.status === 'published' ? t('dashboard.unpublish') : t('dashboard.publish')}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={busyId === event._id}
                    onClick={() => handleDuplicate(event)}
                  >
                    {t('dashboard.duplicate')}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    disabled={busyId === event._id}
                    onClick={() => handleArchiveToggle(event)}
                  >
                    {event.status === 'archived' ? t('dashboard.restore') : t('dashboard.archive')}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => handleCopyLink(event)}
                    title={t('dashboard.copyLinkTitle')}
                  >
                    <Link2 size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-red-600"
                    disabled={busyId === event._id}
                    onClick={() => handleDelete(event)}
                    title={t('common.delete')}
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

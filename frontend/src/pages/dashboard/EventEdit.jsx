import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { eventService } from '../../services/event.service.js';
import { categoryService } from '../../services/category.service.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import EventForm from '../../components/event/EventForm.jsx';
import { useToast } from '../../context/ToastContext.jsx';

function qrSignature(qr) {
  if (!qr) return '';
  return [qr.x, qr.y, qr.size, qr.position, qr.captionVisible].join('|');
}

export default function EventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const toast = useToast();

  const [event, setEvent] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([eventService.get(id), categoryService.list()])
      .then(([ev, categories]) => {
        if (!active) return;
        setEvent(ev);
        setCategory(categories.find((c) => c.slug === ev.category) || null);
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async (
    payload,
    { posterFile, removePoster, posterQr, rightsConfirmed },
  ) => {
    setError('');
    setFieldErrors({});
    if (posterFile && !rightsConfirmed) {
      setError("Vous devez confirmer avoir le droit d'utiliser ce visuel.");
      return;
    }
    setSubmitting(true);
    try {
      await eventService.update(id, payload);
      let posterResult = null;
      const hasStoredPoster = Boolean(event?.poster?.sourceUrl);
      const qrChanged =
        posterQr &&
        hasStoredPoster &&
        qrSignature(posterQr) !== qrSignature(event?.poster?.qr);

      if (posterFile) {
        posterResult = await eventService.uploadEventPoster(id, posterFile, {
          rightsConfirmed,
          qr: posterQr,
        });
      } else if (removePoster && (event?.poster?.composedUrl || event?.mainImage)) {
        await eventService.removeEventPoster(id);
      } else if (qrChanged) {
        posterResult = await eventService.updatePosterSettings(id, { qr: posterQr });
      }

      if (posterResult?.posterQrReadable === false) {
        toast.info(t('poster.readabilityWarning'));
      }
      navigate(`/dashboard/evenements/${id}`);
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
      setSubmitting(false);
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

  if (error && !event) {
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

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        to={`/dashboard/evenements/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-celebra-dark/60 hover:text-celebra-dark"
      >
        <ArrowLeft size={15} /> Retour au suivi
      </Link>

      <h1 className="mb-2 text-2xl font-bold">Modifier l&apos;evenement</h1>
      <p className="mb-6 text-sm text-celebra-dark/60">
        Categorie :{' '}
        <span className="font-medium text-celebra-dark">
          {category?.emoji ? `${category.emoji} ` : ''}
          {category?.name || event?.category}
        </span>
      </p>

      <EventForm
        category={category}
        event={event}
        mode="edit"
        submitting={submitting}
        error={error}
        fieldErrors={fieldErrors}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/dashboard/evenements/${id}`)}
        submitLabel="Enregistrer les modifications"
      />
    </div>
  );
}

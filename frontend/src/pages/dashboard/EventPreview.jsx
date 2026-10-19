import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { eventService } from '../../services/event.service.js';
import { categoryService } from '../../services/category.service.js';
import { templateService } from '../../services/template.service.js';
import { getErrorMessage } from '../../services/api.js';
import { resolveVariant } from '../../templates/registry.js';
import EventTemplate from '../../templates/EventTemplate.jsx';
import PosterDownload from '../../components/event/PosterDownload.jsx';

export default function EventPreview() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [category, setCategory] = useState(null);
  const [variant, setVariant] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([eventService.get(id), categoryService.list()])
      .then(async ([ev, categories]) => {
        if (!active) return;
        setEvent(ev);
        setCategory(categories.find((c) => c.slug === ev.category) || null);

        if (ev.templateId) {
          try {
            const templates = await templateService.list(ev.category);
            const template = templates.find((t) => t._id === ev.templateId);
            if (active && template) setVariant(resolveVariant(template.componentKey));
          } catch {
            /* modele par defaut */
          }
        }
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-celebra-dark/60">
        <Loader2 className="animate-spin" size={20} />
        Chargement de l&apos;apercu...
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'Evenement introuvable.'}
        </p>
        <Link to="/dashboard" className="btn-outline mt-4">
          <ArrowLeft size={16} /> Retour
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-celebra-dark/10 bg-celebra-paper">
      <div className="flex items-center justify-between gap-3 border-b border-celebra-dark/10 bg-celebra-cream/60 px-4 py-3">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-celebra-dark/70">
          <Eye size={16} /> Apercu
        </span>
        <Link to={`/dashboard/evenements/${id}`} className="btn-outline">
          <ArrowLeft size={15} /> Quitter l&apos;apercu
        </Link>
      </div>

      {event.mainImage?.url && (
        <div className="border-b border-celebra-dark/10 px-4 py-4">
          <h2 className="mb-3 text-sm font-semibold text-celebra-dark/70">
            Affiche avec QR code
          </h2>
          <div className="max-w-md">
            <PosterDownload event={event} showPosition />
          </div>
        </div>
      )}

      <EventTemplate event={event} category={category} variant={variant} />
    </div>
  );
}

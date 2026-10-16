import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { categoryService } from '../../services/category.service.js';
import { eventService } from '../../services/event.service.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import EventForm from '../../components/event/EventForm.jsx';

export default function CreateEvent({ categorySlug: categorySlugProp }) {
  const params = useParams();
  const categorySlug = categorySlugProp || params.categorySlug;
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingCategory(true);
    categoryService
      .list()
      .then((list) => {
        if (!active) return;
        const found = list.find((c) => c.slug === categorySlug) || null;
        setCategory(found);
        if (!found) setError('Categorie introuvable. Choisissez une categorie disponible.');
      })
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoadingCategory(false));
    return () => {
      active = false;
    };
  }, [categorySlug]);

  const handleSubmit = async (payload, { files, publishNow, posterFile }) => {
    setError('');
    setFieldErrors({});
    if (!payload.title) {
      setError('Le titre est obligatoire.');
      return;
    }
    if (!posterFile) {
      setError("L'affiche de l'evenement est obligatoire.");
      return;
    }
    if (payload.visibility === 'password' && !payload.accessCode) {
      setError("Un code d'acces est requis pour un evenement protege.");
      return;
    }

    setSubmitting(true);
    try {
      let event = await eventService.create(payload);
      event = await eventService.uploadMainImage(event._id, posterFile);
      if (publishNow) {
        event = await eventService.publish(event._id);
      }
      if (files.length) {
        await eventService.addPhotos(event._id, files);
      }
      navigate(publishNow ? `/e/${event.slug}` : '/dashboard');
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loadingCategory) {
    return (
      <div className="flex justify-center py-16 text-celebra-dark/40">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || 'Categorie introuvable.'}
        </p>
        <Link to="/dashboard/creer" className="btn-primary">
          Choisir une categorie
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-2 text-2xl font-bold">Creer un evenement</h1>
      <p className="mb-6 text-sm text-celebra-dark/60">
        Categorie :{' '}
        <span className="font-medium text-celebra-dark">
          {category.emoji ? `${category.emoji} ` : ''}
          {category.name}
        </span>{' '}
        <Link to="/dashboard/creer" className="text-celebra-gold">
          (changer)
        </Link>
      </p>

      <EventForm
        category={category}
        mode="create"
        submitting={submitting}
        error={error}
        fieldErrors={fieldErrors}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/dashboard')}
      />
    </div>
  );
}

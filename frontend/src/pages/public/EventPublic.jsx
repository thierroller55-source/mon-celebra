import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { publicService } from '../../services/public.service.js';
import { categoryService } from '../../services/category.service.js';
import { getErrorMessage } from '../../services/api.js';
import { resolveVariant } from '../../templates/registry.js';
import EventTemplate from '../../templates/EventTemplate.jsx';

export default function EventPublic() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const code = searchParams.get('code') || '';

  const [event, setEvent] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    publicService
      .getEvent(slug, code)
      .then((data) => {
        if (!active) return;
        setEvent(data);
        categoryService
          .list()
          .then((list) => {
            if (active) setCategory(list.find((c) => c.slug === data.category) || null);
          })
          .catch(() => {});
      })
      .catch((err) => {
        if (!active) return;
        setErrorCode(err?.response?.data?.code || '');
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, code]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-celebra-dark/60">
        <Loader2 className="animate-spin" size={28} />
        <p className="text-sm">Chargement de l&apos;evenement...</p>
      </div>
    );
  }

  if (errorCode === 'ACCESS_CODE_REQUIRED') {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-24">
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <Lock className="text-celebra-gold" size={26} />
          <h1 className="text-lg font-semibold">Evenement protege</h1>
          <p className="text-sm text-celebra-dark/70">
            Saisissez le code pour acceder a cet evenement.
          </p>
          <form
            className="w-full space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSearchParams({ code: codeInput.trim() });
            }}
          >
            <input
              className="input"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Code d'acces"
              aria-label="Code d'acces"
            />
            <button type="submit" className="btn-primary w-full">
              Acceder
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
        <p className="font-heading text-5xl font-bold text-celebra-gold">Oups</p>
        <p className="text-sm text-celebra-dark/70">
          {error || "Cet evenement n'est pas disponible."}
        </p>
        <Link to="/" className="btn-primary">
          Retour a l&apos;accueil
        </Link>
      </div>
    );
  }

  const variant = resolveVariant(event.templateId?.componentKey);

  return <EventTemplate event={event} category={category} variant={variant} accessCode={code} />;
}

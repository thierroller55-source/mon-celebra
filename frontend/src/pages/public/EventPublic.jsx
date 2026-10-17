import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { publicService } from '../../services/public.service.js';
import { categoryService } from '../../services/category.service.js';
import { getErrorMessage } from '../../services/api.js';
import { resolveVariant } from '../../templates/registry.js';
import EventTemplate from '../../templates/EventTemplate.jsx';
import { applyEventSeo } from '../../lib/seo.js';
import { DEFAULT_LOCALE } from '../../i18n/config.js';

export default function EventPublic() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  // Redirection des anciennes URLs /e/:slug vers la langue de l'evenement
  // (les QR codes deja imprimes continuent de fonctionner).
  useEffect(() => {
    if (!event) return;
    const lang = ['fr', 'en', 'wo'].includes(event.language) ? event.language : DEFAULT_LOCALE;
    const firstSegment = window.location.pathname.split('/')[1];
    if (!['fr', 'en', 'wo'].includes(firstSegment)) {
      navigate(`/${lang}/e/${slug}${window.location.search}`, { replace: true });
    }
  }, [event, slug, navigate]);

  useEffect(() => {
    if (event) applyEventSeo(event);
    return () => {
      document.title = 'Mon Celebra';
    };
  }, [event]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-celebra-dark/60">
        <Loader2 className="animate-spin" size={28} />
        <p className="text-sm">{t('publicPage.loading')}</p>
      </div>
    );
  }

  if (errorCode === 'ACCESS_CODE_REQUIRED') {
    return (
      <div className="mx-auto w-full max-w-sm px-4 py-24">
        <div className="card flex flex-col items-center gap-4 p-8 text-center">
          <Lock className="text-celebra-gold" size={26} />
          <h1 className="text-lg font-semibold">{t('publicPage.protectedTitle')}</h1>
          <p className="text-sm text-celebra-dark/70">{t('publicPage.protectedText')}</p>
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
              placeholder={t('publicPage.accessCode')}
              aria-label={t('publicPage.accessCode')}
            />
            <button type="submit" className="btn-primary w-full">
              {t('publicPage.access')}
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
        <p className="text-sm text-celebra-dark/70">{error || t('publicPage.notFound')}</p>
        <a href="/" className="btn-primary">
          {t('common.backHome')}
        </a>
      </div>
    );
  }

  const variant = resolveVariant(event.templateId?.componentKey);

  return <EventTemplate event={event} category={category} variant={variant} accessCode={code} />;
}

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle2, Lock, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { publicService } from '../../services/public.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const initialForm = { guestsCount: 1, response: 'yes', message: '' };

const RESPONSE_STYLES = {
  accepted: { icon: CheckCircle2, tone: 'bg-green-50 text-green-700' },
  declined: { icon: XCircle, tone: 'bg-red-50 text-red-700' },
};

export default function RsvpSection({ slug, stats = {}, accent = '#B08D57' }) {
  const toast = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [myRsvp, setMyRsvp] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const isRealAccount = Boolean(user) && !user.isGuest;

  useEffect(() => {
    let active = true;
    if (!isRealAccount) {
      setLoaded(true);
      return undefined;
    }
    publicService
      .myRsvp(slug)
      .then((r) => active && setMyRsvp(r || null))
      .catch(() => {})
      .finally(() => active && setLoaded(true));
    return () => {
      active = false;
    };
  }, [slug, isRealAccount]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const rsvp = await publicService.rsvp(slug, {
        guestsCount: Number(form.guestsCount) || 1,
        response: form.response,
        message: form.message.trim() || undefined,
      });
      setMyRsvp(rsvp);
      toast.success(t('rsvp.thanks'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const redirect = encodeURIComponent(location.pathname + location.search);

  return (
    <section className="card p-6" id="rsvp">
      <h2 className="mb-1 text-center text-xl font-bold">{t('rsvp.title')}</h2>
      <p className="mb-4 text-center text-sm text-celebra-dark/60">{t('rsvp.subtitle')}</p>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1 text-green-700">
          <CheckCircle2 size={16} /> {stats.rsvpYes ?? 0} {t('rsvp.yes')}
        </span>
        <span className="text-celebra-dark/60">
          {stats.rsvpMaybe ?? 0} {t('rsvp.maybe')}
        </span>
        <span className="text-celebra-dark/60">
          {stats.rsvpNo ?? 0} {t('rsvp.no')}
        </span>
      </div>

      {!isRealAccount ? (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-celebra-gold/10 px-4 py-6 text-center">
          <Lock className="text-celebra-gold" size={22} />
          <p className="text-sm text-celebra-dark/80">{t('rsvp.accountRequired')}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link to={`/connexion?redirect=${redirect}`} className="btn-primary">
              {t('rsvp.login')}
            </Link>
            <Link to={`/inscription-invite?redirect=${redirect}`} className="btn-outline">
              {t('rsvp.createAccount')}
            </Link>
          </div>
        </div>
      ) : !loaded ? (
        <div className="flex justify-center py-6 text-celebra-dark/50">
          <Loader2 className="animate-spin" size={20} />
        </div>
      ) : myRsvp ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            <p className="font-medium">
              {t('rsvp.youResponded', {
                response: t(`rsvp.${myRsvp.response}`),
              })}
            </p>
            {myRsvp.guestsCount > 1 && (
              <p className="mt-0.5 text-green-700/80">
                {t('rsvp.guestCountValue', { count: myRsvp.guestsCount })}
              </p>
            )}
          </div>

          <HostResponse rsvp={myRsvp} />

          <details className="text-sm">
            <summary className="cursor-pointer text-celebra-dark/60">
              {t('rsvp.updateResponse')}
            </summary>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
              <RsvpFields form={form} onChange={handleChange} accent={accent} submitting={submitting} t={t} />
            </form>
          </details>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="rounded-lg bg-celebra-dark/5 px-4 py-3 text-sm">
            <p className="font-medium text-celebra-dark">{user.fullName}</p>
            <p className="text-celebra-dark/60">
              {user.email}
              {user.phone ? ` · ${user.phone}` : ''}
            </p>
          </div>
          <RsvpFields form={form} onChange={handleChange} accent={accent} submitting={submitting} t={t} />
        </form>
      )}
    </section>
  );
}

function HostResponse({ rsvp }) {
  const { t } = useTranslation();
  if (!rsvp.hostResponse) {
    return (
      <p className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <Clock size={16} /> {t('rsvp.hostPending')}
      </p>
    );
  }
  const style = RESPONSE_STYLES[rsvp.hostResponse] || RESPONSE_STYLES.accepted;
  const Icon = style.icon;
  return (
    <p className={`inline-flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${style.tone}`}>
      <Icon size={16} /> {t(`rsvp.host_${rsvp.hostResponse}`)}
    </p>
  );
}

function RsvpFields({ form, onChange, accent, submitting, t }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rsvp-response" className="label">
            {t('rsvp.attendance')}
          </label>
          <select
            id="rsvp-response"
            name="response"
            className="input"
            value={form.response}
            onChange={onChange}
          >
            <option value="yes">{t('rsvp.yesFull')}</option>
            <option value="maybe">{t('rsvp.maybe')}</option>
            <option value="no">{t('rsvp.noFull')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="rsvp-guests" className="label">
            {t('rsvp.guests')}
          </label>
          <input
            id="rsvp-guests"
            name="guestsCount"
            type="number"
            min="1"
            max="50"
            className="input"
            value={form.guestsCount}
            onChange={onChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="rsvp-message" className="label">
          {t('rsvp.messageOptional')}
        </label>
        <textarea
          id="rsvp-message"
          name="message"
          className="input min-h-[80px]"
          value={form.message}
          onChange={onChange}
        />
      </div>

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={submitting}
        style={{ backgroundColor: accent }}
      >
        {submitting && <Loader2 className="animate-spin" size={16} />}
        {submitting ? t('rsvp.sending') : t('rsvp.submit')}
      </button>
    </>
  );
}

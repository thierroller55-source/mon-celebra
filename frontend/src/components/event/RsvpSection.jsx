import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { publicService } from '../../services/public.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

const initialForm = { name: '', phone: '', guestsCount: 1, response: 'yes', message: '' };

export default function RsvpSection({ slug, stats = {}, accent = '#B08D57' }) {
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Merci d\u2019indiquer votre nom.');
      return;
    }
    setSubmitting(true);
    try {
      await publicService.rsvp(slug, {
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        guestsCount: Number(form.guestsCount) || 1,
        response: form.response,
        message: form.message.trim() || undefined,
      });
      setDone(true);
      toast.success('Merci ! Votre reponse a bien ete enregistree.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="card p-6" id="rsvp">
      <h2 className="mb-1 text-center text-xl font-bold">Confirmer ma presence</h2>
      <p className="mb-4 text-center text-sm text-celebra-dark/60">
        Merci de nous dire si vous serez present.
      </p>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1 text-green-700">
          <CheckCircle2 size={16} /> {stats.rsvpYes ?? 0} oui
        </span>
        <span className="text-celebra-dark/60">{stats.rsvpMaybe ?? 0} peut-etre</span>
        <span className="text-celebra-dark/60">{stats.rsvpNo ?? 0} non</span>
      </div>

      {done ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-center text-sm text-green-700">
          Votre reponse a bien ete enregistree. Merci !
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rsvp-name" className="label">Nom *</label>
              <input
                id="rsvp-name"
                name="name"
                className="input"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="rsvp-phone" className="label">Telephone</label>
              <input
                id="rsvp-phone"
                name="phone"
                className="input"
                value={form.phone}
                onChange={handleChange}
                placeholder="+221 77 123 45 67"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rsvp-response" className="label">Serez-vous present ?</label>
              <select
                id="rsvp-response"
                name="response"
                className="input"
                value={form.response}
                onChange={handleChange}
              >
                <option value="yes">Oui, je serai present</option>
                <option value="maybe">Peut-etre</option>
                <option value="no">Non, je ne pourrai pas</option>
              </select>
            </div>
            <div>
              <label htmlFor="rsvp-guests" className="label">Nombre de personnes</label>
              <input
                id="rsvp-guests"
                name="guestsCount"
                type="number"
                min="1"
                max="50"
                className="input"
                value={form.guestsCount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="rsvp-message" className="label">Message (optionnel)</label>
            <textarea
              id="rsvp-message"
              name="message"
              className="input min-h-[80px]"
              value={form.message}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting}
            style={{ backgroundColor: accent }}
          >
            {submitting && <Loader2 className="animate-spin" size={16} />}
            {submitting ? 'Envoi...' : 'Envoyer ma reponse'}
          </button>
        </form>
      )}
    </section>
  );
}

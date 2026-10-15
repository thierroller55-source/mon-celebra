import { useState } from 'react';
import { Loader2, MessageSquareHeart, ImagePlus } from 'lucide-react';
import { publicService } from '../../services/public.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

const initialForm = { authorName: '', message: '' };

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function GuestbookSection({ slug, messages = [], accent = '#B08D57' }) {
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.authorName.trim() || !form.message.trim()) {
      toast.error('Merci de renseigner votre nom et un message.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await publicService.guestbook(slug, {
        authorName: form.authorName.trim(),
        message: form.message.trim(),
        file,
      });
      setSent(true);
      toast.success(
        created?.status === 'pending'
          ? 'Merci ! Votre message sera visible apres validation.'
          : 'Merci pour votre message !',
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mb-12" id="livre-dor">
      <h2 className="mb-6 text-center text-xl font-bold">Livre d&apos;or</h2>

      {messages.length > 0 ? (
        <ul className="mb-6 space-y-4">
          {messages.map((msg) => (
            <li key={msg._id} className="card p-4">
              <div className="flex items-start gap-3">
                {msg.photo?.url && (
                  <img
                    src={msg.photo.url}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold">{msg.authorName}</p>
                  <p className="text-xs text-celebra-dark/50">{formatDate(msg.createdAt)}</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-celebra-dark/80">
                    {msg.message}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-6 text-center text-sm text-celebra-dark/50">
          Soyez le premier a laisser un message.
        </p>
      )}

      {sent ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-center text-sm text-green-700">
          Merci ! Votre message a bien ete envoye.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
          <p className="flex items-center gap-2 font-semibold">
            <MessageSquareHeart size={18} style={{ color: accent }} />
            Laisser un message
          </p>
          <div>
            <label htmlFor="gb-name" className="label">Votre nom *</label>
            <input
              id="gb-name"
              name="authorName"
              className="input"
              value={form.authorName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="gb-message" className="label">Message *</label>
            <textarea
              id="gb-message"
              name="message"
              className="input min-h-[90px]"
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="gb-photo" className="label inline-flex items-center gap-1">
              <ImagePlus size={15} /> Photo (optionnel)
            </label>
            <input
              id="gb-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={submitting}
            style={{ backgroundColor: accent }}
          >
            {submitting && <Loader2 className="animate-spin" size={16} />}
            {submitting ? 'Envoi...' : 'Publier mon message'}
          </button>
        </form>
      )}
    </section>
  );
}

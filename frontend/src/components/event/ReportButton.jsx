import { useState } from 'react';
import { Flag } from 'lucide-react';
import { publicService } from '../../services/public.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function ReportButton({ eventId }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      toast.error('Merci de decrire le motif du signalement.');
      return;
    }
    setSending(true);
    try {
      await publicService.report({
        eventId,
        reason: reason.trim(),
        reporterEmail: email.trim() || undefined,
      });
      toast.success('Merci, votre signalement a bien ete pris en compte.');
      setOpen(false);
      setReason('');
      setEmail('');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 text-xs text-celebra-dark/40 hover:text-celebra-dark/70"
        >
          <Flag size={13} />
          Signaler cet evenement
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 max-w-md">
      <form onSubmit={handleSubmit} className="card space-y-3 p-5">
        <p className="font-semibold">Signaler cet evenement</p>
        <div>
          <label htmlFor="report-reason" className="label">Motif *</label>
          <textarea
            id="report-reason"
            className="input min-h-[70px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="report-email" className="label">Votre email (optionnel)</label>
          <input
            id="report-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={() => setOpen(false)}>
            Annuler
          </button>
          <button type="submit" className="btn-primary" disabled={sending}>
            {sending ? 'Envoi...' : 'Envoyer'}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { upgradeService } from '../../services/upgrade.service.js';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../services/api.js';

export default function UpgradeDialog({ open, onClose, planRequested = 'event_pass', eventId = null }) {
  const toast = useToast();
  const [info, setInfo] = useState({ waveLink: null, orangeNumber: null, whatsapp: null });
  const [form, setForm] = useState({ payerPhone: '', transactionRef: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState(null);

  useEffect(() => {
    if (open) {
      upgradeService.paymentInfo().then(setInfo).catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const req = await upgradeService.createRequest({
        planRequested,
        eventId,
        payerPhone: form.payerPhone,
        transactionRef: form.transactionRef,
        amount: form.amount ? Number(form.amount) : undefined,
      });
      setReference(req.reference);
      toast.success("Demande envoyée. Après vérification du paiement.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md card p-6 relative">
        <button className="absolute right-3 top-3" onClick={onClose}><X size={18} /></button>
        <h2 className="text-lg font-semibold mb-2">Passer au Premium</h2>
        <p className="text-sm text-celebra-dark/70 mb-4">Indiquez le code de référence à utiliser lors de votre paiement.</p>
        {reference && (
          <div className="mb-3 rounded-lg bg-celebra-gold/10 px-3 py-2 text-sm">
            Code de référence : <span className="font-mono font-semibold">{reference}</span>
          </div>
        )}
        <div className="mb-4 text-sm space-y-1">
          {info.waveLink && <a href={info.waveLink} target="_blank" rel="noreferrer" className="text-celebra-gold underline">Payer via Wave</a>}
          {info.orangeNumber && <p>Orange Money : {info.orangeNumber}</p>}
          {info.whatsapp && <p>Contact WhatsApp : {info.whatsapp}</p>}
        </div>
        {!reference ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input className="input" placeholder="Numéro de paiement" value={form.payerPhone} onChange={(e)=>setForm({...form,payerPhone:e.target.value})} required />
            <input className="input" placeholder="Référence de transaction" value={form.transactionRef} onChange={(e)=>setForm({...form,transactionRef:e.target.value})} required />
            <input className="input" placeholder="Montant (FCFA)" value={form.amount} onChange={(e)=>setForm({...form,amount:e.target.value})} />
            <button className="btn-primary w-full" disabled={loading}>{loading ? 'Envoi...' : "J'ai payé"}</button>
            <p className="text-xs text-celebra-dark/60">Aucun message ne promet un délai d'activation ; après vérification du paiement.</p>
          </form>
        ) : (
          <button className="btn-outline w-full" onClick={onClose}>Fermer</button>
        )}
      </div>
    </div>
  );
}

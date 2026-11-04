import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Ban, Search, Loader2 } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function AdminPlans() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState('pending');
  const [planRequested, setPlanRequested] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [activateForm, setActivateForm] = useState({ userId: '', planRequested: 'pro', durationMonths: 12, note: '' });
  const [deactivateForm, setDeactivateForm] = useState({ userId: '', eventId: '', note: '' });
  const [audits, setAudits] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.plansRequests({ status: status || undefined, planRequested: planRequested || undefined });
      setRequests(data);
      const auditsData = await adminService.planAudits({});
      setAudits(auditsData);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, planRequested, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDecide = async (id, action) => {
    setBusyId(id);
    try {
      await adminService.decidePlanRequest(id, { action, durationMonths: action === 'approve' ? 12 : undefined });
      toast.success(action === 'approve' ? 'Demande approuvée.' : 'Demande refusée.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    try {
      await adminService.activatePlan(activateForm);
      toast.success('Plan activé.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeactivate = async (e) => {
    e.preventDefault();
    try {
      await adminService.deactivatePlan(deactivateForm);
      toast.success('Plan désactivé.');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold">Plans & demandes</h1>

      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
          <option value="">Toutes</option>
        </select>
        <select className="input max-w-xs" value={planRequested} onChange={(e) => setPlanRequested(e.target.value)}>
          <option value="">Toutes les offres</option>
          <option value="event_pass">Pass Événement</option>
          <option value="pro">Pro</option>
        </select>
        <button className="btn-outline" onClick={load}><Search size={15} /> Actualiser</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-celebra-dark/10 text-xs uppercase text-celebra-dark/50">
            <tr>
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Utilisateur</th>
              <th className="px-4 py-3">Offre</th>
              <th className="px-4 py-3">Événement</th>
              <th className="px-4 py-3">Téléphone / Réf. tx</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-celebra-dark/60"><Loader2 className="animate-spin inline mr-2" size={16}/>Chargement...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-celebra-dark/60">Aucune demande</td></tr>
            ) : requests.map((r) => (
              <tr key={r._id} className="border-b border-celebra-dark/5 last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{r.reference}</td>
                <td className="px-4 py-3">{r.userId?.firstName} {r.userId?.lastName}<br/><span className="text-xs text-celebra-dark/60">{r.userId?.email}</span></td>
                <td className="px-4 py-3">{r.planRequested === 'pro' ? 'Pro' : 'Pass Événement'}</td>
                <td className="px-4 py-3">{r.eventId?.title || '-'}</td>
                <td className="px-4 py-3 text-xs">{r.payerPhone}<br/>{r.transactionRef}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  {r.status === 'pending' && (
                    <>
                      <button className="btn-outline px-2 py-1 text-green-700" disabled={busyId===r._id} onClick={()=>handleDecide(r._id,'approve')}><CheckCircle2 size={15}/></button>
                      <button className="btn-outline px-2 py-1 text-red-700" disabled={busyId===r._id} onClick={()=>handleDecide(r._id,'reject')}><XCircle size={15}/></button>
                      <button className="btn-outline px-2 py-1 text-amber-700" disabled={busyId===r._id} onClick={()=>handleDecide(r._id,'deactivate')}><Ban size={15}/></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <form onSubmit={handleActivate} className="card p-4 space-y-3">
          <h2 className="font-semibold">Activer un plan sans demande</h2>
          <input className="input" placeholder="User ID" value={activateForm.userId} onChange={(e)=>setActivateForm({...activateForm,userId:e.target.value})} required />
          <input className="input" placeholder="Event ID (si Pass Événement)" value={activateForm.eventId||''} onChange={(e)=>setActivateForm({...activateForm,eventId:e.target.value})} />
          <select className="input" value={activateForm.planRequested} onChange={(e)=>setActivateForm({...activateForm,planRequested:e.target.value})}>
            <option value="pro">Pro</option>
            <option value="event_pass">Pass Événement</option>
          </select>
          <input className="input" type="number" placeholder="Durée en mois (ex. 12)" value={activateForm.durationMonths} onChange={(e)=>setActivateForm({...activateForm,durationMonths:Number(e.target.value)})} />
          <input className="input" placeholder="Note" value={activateForm.note} onChange={(e)=>setActivateForm({...activateForm,note:e.target.value})} />
          <button className="btn-primary">Activer</button>
        </form>

        <form onSubmit={handleDeactivate} className="card p-4 space-y-3">
          <h2 className="font-semibold">Désactiver un plan</h2>
          <input className="input" placeholder="User ID" value={deactivateForm.userId} onChange={(e)=>setDeactivateForm({...deactivateForm,userId:e.target.value})} required />
          <input className="input" placeholder="Event ID (si Pass Événement)" value={deactivateForm.eventId} onChange={(e)=>setDeactivateForm({...deactivateForm,eventId:e.target.value})} />
          <input className="input" placeholder="Note" value={deactivateForm.note} onChange={(e)=>setDeactivateForm({...deactivateForm,note:e.target.value})} />
          <button className="btn-outline">Désactiver</button>
        </form>
      </div>

      <div className="card p-4">
        <h2 className="font-semibold mb-3">Journal d&apos;audit</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-celebra-dark/10 text-xs uppercase text-celebra-dark/50">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Admin</th>
                <th className="px-3 py-2">Cible</th>
                <th className="px-3 py-2">Événement</th>
                <th className="px-3 py-2">Raison</th>
              </tr>
            </thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a._id} className="border-b border-celebra-dark/5 last:border-0">
                  <td className="px-3 py-2 text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-xs">{a.adminId?.email}</td>
                  <td className="px-3 py-2 text-xs">{a.targetUserId?.email}</td>
                  <td className="px-3 py-2 text-xs">{a.eventId?.title || '-'}</td>
                  <td className="px-3 py-2 text-xs">{a.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

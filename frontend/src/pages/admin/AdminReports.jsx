import { useCallback, useEffect, useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminReports() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.reports({ status: status || undefined });
      setReports(data.reports);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResolve = async (report) => {
    setBusyId(report._id);
    try {
      await adminService.updateReport(report._id, 'closed');
      setReports((list) => list.filter((r) => r._id !== report._id));
      toast.success('Signalement traite.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Signalements</h1>
        <select className="input max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="open">Ouverts</option>
          <option value="closed">Traites</option>
          <option value="">Tous</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-celebra-dark/60">
          <Loader2 className="animate-spin" size={20} /> Chargement...
        </div>
      ) : reports.length === 0 ? (
        <p className="card p-8 text-center text-sm text-celebra-dark/60">
          Aucun signalement.
        </p>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <article key={report._id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {report.eventId?.title || 'Evenement supprime'}
                  </p>
                  <p className="text-xs text-celebra-dark/50">
                    {report.reporterEmail || 'Anonyme'} · {formatDate(report.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-celebra-dark/80">
                    {report.reason}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      report.status === 'open'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-green-50 text-green-700'
                    }`}
                  >
                    {report.status}
                  </span>
                  {report.status === 'open' && (
                    <button
                      type="button"
                      className="btn-outline px-2 py-1 text-green-700"
                      title="Marquer comme traite"
                      disabled={busyId === report._id}
                      onClick={() => handleResolve(report)}
                    >
                      <Check size={15} />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

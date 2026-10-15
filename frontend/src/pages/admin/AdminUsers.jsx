import { useCallback, useEffect, useState } from 'react';
import { Search, Loader2, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export default function AdminUsers() {
  const toast = useToast();
  const { user: current } = useAuth();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.users({ page, search: search || undefined, limit: 10 });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (u) => {
    setBusyId(u._id);
    try {
      const updated = u.isActive
        ? await adminService.blockUser(u._id)
        : await adminService.unblockUser(u._id);
      setUsers((list) => list.map((x) => (x._id === updated._id ? updated : x)));
      toast.success(updated.isActive ? 'Utilisateur reactive.' : 'Utilisateur bloque.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Supprimer ${u.email} et toutes ses donnees ?`)) return;
    setBusyId(u._id);
    try {
      await adminService.deleteUser(u._id);
      setUsers((list) => list.filter((x) => x._id !== u._id));
      toast.success('Utilisateur supprime.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold">Utilisateurs</h1>

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          load();
        }}
      >
        <input
          className="input max-w-xs"
          placeholder="Rechercher par nom ou email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-outline">
          <Search size={15} /> Rechercher
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-celebra-dark/60">
          <Loader2 className="animate-spin" size={20} /> Chargement...
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-celebra-dark/10 text-xs uppercase text-celebra-dark/50">
              <tr>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-celebra-dark/5 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-celebra-dark/70">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.role === 'admin'
                          ? 'bg-celebra-gold/15 text-celebra-gold'
                          : 'bg-celebra-dark/5 text-celebra-dark/60'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        u.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {u.isActive ? 'actif' : 'bloque'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        className={`btn-outline px-2 py-1 ${u.isActive ? 'text-amber-700' : 'text-green-700'}`}
                        title={u.isActive ? 'Bloquer' : 'Reactiver'}
                        disabled={busyId === u._id || u._id === current?._id}
                        onClick={() => handleToggle(u)}
                      >
                        {u.isActive ? <Ban size={15} /> : <CheckCircle2 size={15} />}
                      </button>
                      <button
                        type="button"
                        className="btn-outline px-2 py-1 text-red-600"
                        title="Supprimer"
                        disabled={busyId === u._id || u._id === current?._id}
                        onClick={() => handleDelete(u)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            className="btn-outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Precedent
          </button>
          <span className="text-celebra-dark/60">
            Page {pagination.page} / {pagination.pages}
          </span>
          <button
            type="button"
            className="btn-outline"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

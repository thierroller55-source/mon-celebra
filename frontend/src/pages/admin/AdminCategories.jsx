import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

const emptyForm = { name: '', slug: '', icon: 'sparkles', order: 0, isMvp: false, isActive: true };

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await adminService.categories());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Nom et slug obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const created = await adminService.createCategory({
        ...form,
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        order: Number(form.order) || 0,
      });
      setCategories((list) => [...list, created].sort((a, b) => a.order - b.order));
      setForm(emptyForm);
      toast.success('Categorie creee.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (category, changes) => {
    try {
      const updated = await adminService.updateCategory(category._id, changes);
      setCategories((list) => list.map((c) => (c._id === updated._id ? updated : c)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`Supprimer la categorie "${category.name}" ?`)) return;
    try {
      await adminService.deleteCategory(category._id);
      setCategories((list) => list.filter((c) => c._id !== category._id));
      toast.success('Categorie supprimee.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Categories</h1>

      <form onSubmit={handleCreate} className="card mb-6 grid gap-3 p-4 sm:grid-cols-4">
        <input
          className="input"
          placeholder="Nom"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
          className="input"
          placeholder="slug"
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
        />
        <input
          className="input"
          placeholder="icone"
          value={form.icon}
          onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
        />
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
          Ajouter
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-celebra-dark/60">
          <Loader2 className="animate-spin" size={20} /> Chargement...
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category._id} className="card flex items-center gap-3 p-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-celebra-gold/10 text-xs font-bold text-celebra-gold">
                {category.order}
              </span>
              <div className="flex-1">
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-celebra-dark/50">{category.slug}</p>
              </div>
              <label className="flex items-center gap-1 text-xs text-celebra-dark/60">
                <input
                  type="checkbox"
                  checked={category.isActive}
                  onChange={(e) => handleUpdate(category, { isActive: e.target.checked })}
                />
                Active
              </label>
              <label className="flex items-center gap-1 text-xs text-celebra-dark/60">
                <input
                  type="checkbox"
                  checked={category.isMvp}
                  onChange={(e) => handleUpdate(category, { isMvp: e.target.checked })}
                />
                MVP
              </label>
              <button
                type="button"
                className="btn-outline px-2 py-1 text-red-600"
                title="Supprimer"
                onClick={() => handleDelete(category)}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

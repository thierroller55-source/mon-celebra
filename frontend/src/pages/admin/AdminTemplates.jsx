import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { getErrorMessage } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

const emptyForm = {
  name: '',
  categorySlug: 'mariage',
  componentKey: '',
  isActive: true,
  isPremium: false,
};

export default function AdminTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [tpls, cats] = await Promise.all([
          adminService.templates(),
          adminService.categories(),
        ]);
        if (!active) return;
        setTemplates(tpls);
        setCategories(cats);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.componentKey.trim()) {
      toast.error('Nom et cle de composant obligatoires.');
      return;
    }
    setSaving(true);
    try {
      const created = await adminService.createTemplate({
        ...form,
        name: form.name.trim(),
        componentKey: form.componentKey.trim(),
      });
      setTemplates((list) => [...list, created]);
      setForm((f) => ({ ...emptyForm, categorySlug: f.categorySlug }));
      toast.success('Template cree.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (template, changes) => {
    try {
      const updated = await adminService.updateTemplate(template._id, changes);
      setTemplates((list) => list.map((t) => (t._id === updated._id ? updated : t)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Supprimer le template "${template.name}" ?`)) return;
    try {
      await adminService.deleteTemplate(template._id);
      setTemplates((list) => list.filter((t) => t._id !== template._id));
      toast.success('Template supprime.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold">Templates</h1>

      <form onSubmit={handleCreate} className="card mb-6 grid gap-3 p-4 sm:grid-cols-4">
        <input
          className="input"
          placeholder="Nom"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <select
          className="input"
          value={form.categorySlug}
          onChange={(e) => setForm((f) => ({ ...f, categorySlug: e.target.value }))}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="componentKey"
          value={form.componentKey}
          onChange={(e) => setForm((f) => ({ ...f, componentKey: e.target.value }))}
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
          {templates.map((template) => (
            <li key={template._id} className="card flex items-center gap-3 p-3">
              <div className="flex-1">
                <p className="font-medium">{template.name}</p>
                <p className="text-xs text-celebra-dark/50">
                  {template.categorySlug} · {template.componentKey}
                </p>
              </div>
              <label className="flex items-center gap-1 text-xs text-celebra-dark/60">
                <input
                  type="checkbox"
                  checked={template.isActive}
                  onChange={(e) => handleUpdate(template, { isActive: e.target.checked })}
                />
                Actif
              </label>
              <label className="flex items-center gap-1 text-xs text-celebra-dark/60">
                <input
                  type="checkbox"
                  checked={template.isPremium}
                  onChange={(e) => handleUpdate(template, { isPremium: e.target.checked })}
                />
                Premium
              </label>
              <button
                type="button"
                className="btn-outline px-2 py-1 text-red-600"
                title="Supprimer"
                onClick={() => handleDelete(template)}
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

import { Plus, Trash2 } from 'lucide-react';

/** Liste simple de chaines (ex : liste de cadeaux, artistes, dates). */
export default function ListField({ value = [], onChange, placeholder = '', addLabel = 'Ajouter' }) {
  const items = Array.isArray(value) ? value : [];

  const updateItem = (index, val) =>
    onChange(items.map((item, i) => (i === index ? val : item)));

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            className="input"
            placeholder={placeholder}
            value={item ?? ''}
            onChange={(e) => updateItem(index, e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== index))}
            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
            aria-label="Supprimer"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <button type="button" onClick={() => onChange([...items, ''])} className="btn-outline">
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}

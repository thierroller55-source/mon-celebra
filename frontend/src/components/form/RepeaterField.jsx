import { Plus, Trash2 } from 'lucide-react';
import ImageField from './ImageField.jsx';

/**
 * Editeur generique d'une liste d'objets.
 *
 * @param {object} props
 * @param {Array<object>} props.value
 * @param {(items: Array<object>) => void} props.onChange
 * @param {Array<{key:string,type:string,label:string,placeholder?:string}>} props.template
 * @param {() => object} props.createItem
 * @param {string} props.addLabel
 */
export default function RepeaterField({ value = [], onChange, template, createItem, addLabel = 'Ajouter' }) {
  const items = Array.isArray(value) ? value : [];

  const updateItem = (index, key, val) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: val } : item));
    onChange(next);
  };

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  const addItem = () => onChange([...items, createItem()]);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="rounded-xl border border-celebra-dark/10 bg-celebra-cream/40 p-3"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-celebra-dark/50">Element {index + 1}</span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="rounded-lg p-1 text-red-600 hover:bg-red-50"
              aria-label="Supprimer"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {template.map((sub) => (
              <div
                key={sub.key}
                className={sub.type === 'textarea' || sub.type === 'image' ? 'sm:col-span-2' : ''}
              >
                <label className="label text-xs">{sub.label}</label>
                {sub.type === 'textarea' ? (
                  <textarea
                    className="input min-h-[70px]"
                    placeholder={sub.placeholder}
                    value={item[sub.key] ?? ''}
                    onChange={(e) => updateItem(index, sub.key, e.target.value)}
                  />
                ) : sub.type === 'image' ? (
                  <ImageField
                    compact
                    value={item[sub.key]}
                    onChange={(val) => updateItem(index, sub.key, val)}
                  />
                ) : (
                  <input
                    className="input"
                    type={sub.type === 'time' ? 'time' : 'text'}
                    placeholder={sub.placeholder}
                    value={item[sub.key] ?? ''}
                    onChange={(e) => updateItem(index, sub.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button type="button" onClick={addItem} className="btn-outline">
        <Plus size={15} /> {addLabel}
      </button>
    </div>
  );
}

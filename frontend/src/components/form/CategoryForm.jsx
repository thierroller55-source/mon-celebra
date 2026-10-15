import DynamicField from './DynamicField.jsx';

const WIDE_TYPES = new Set(['textarea', 'gallery', 'program', 'contacts', 'links', 'speakers', 'sections', 'list']);

/**
 * Formulaire dynamique des champs specifiques a une categorie.
 *
 * @param {object} props
 * @param {object} props.category   Categorie (contient fieldsSchema.fields).
 * @param {object} props.value      Objet event.details.
 * @param {(details:object)=>void} props.onChange
 * @param {object} props.errors     Erreurs par cle de champ (ex: { graduateName: '...' }).
 */
export default function CategoryForm({ category, value = {}, onChange, errors = {} }) {
  const fields = category?.fieldsSchema?.fields || [];
  if (!fields.length) return null;

  const setField = (key, next) => onChange({ ...value, [key]: next });

  return (
    <section className="card space-y-4 p-6">
      <div>
        <h2 className="font-semibold">Informations specifiques</h2>
        <p className="text-sm text-celebra-dark/50">
          {category.emoji ? `${category.emoji} ` : ''}
          {category.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={WIDE_TYPES.has(field.type) ? 'sm:col-span-2' : ''}>
            <label className="label" htmlFor={`detail-${field.key}`}>
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            <DynamicField
              id={`detail-${field.key}`}
              field={field}
              value={value[field.key]}
              onChange={(next) => setField(field.key, next)}
            />
            {errors[field.key] && (
              <p className="mt-1 text-xs text-red-600">{errors[field.key]}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

import ImageField from './ImageField.jsx';
import GalleryField from './GalleryField.jsx';
import ListField from './ListField.jsx';
import RepeaterField from './RepeaterField.jsx';

/**
 * Configurations des champs "repetables" (liste d'objets).
 * Chaque entree alimente RepeaterField.
 */
const REPEATERS = {
  program: {
    addLabel: 'Ajouter une etape',
    createItem: () => ({ time: '', title: '', description: '' }),
    template: [
      { key: 'time', type: 'time', label: 'Heure' },
      { key: 'title', type: 'text', label: 'Intitule', placeholder: 'Ceremonie' },
      { key: 'description', type: 'textarea', label: 'Description' },
    ],
  },
  contacts: {
    addLabel: 'Ajouter un contact',
    createItem: () => ({ label: '', value: '' }),
    template: [
      { key: 'label', type: 'text', label: 'Libelle', placeholder: 'Telephone' },
      { key: 'value', type: 'text', label: 'Valeur', placeholder: '+221 ...' },
    ],
  },
  links: {
    addLabel: 'Ajouter un lien',
    createItem: () => ({ label: '', url: '' }),
    template: [
      { key: 'label', type: 'text', label: 'Libelle', placeholder: 'Instagram' },
      { key: 'url', type: 'text', label: 'URL', placeholder: 'https://...' },
    ],
  },
  speakers: {
    addLabel: 'Ajouter un intervenant',
    createItem: () => ({ name: '', bio: '', photo: null }),
    template: [
      { key: 'name', type: 'text', label: 'Nom', placeholder: 'Dr. Diallo' },
      { key: 'photo', type: 'image', label: 'Photo' },
      { key: 'bio', type: 'textarea', label: 'Biographie' },
    ],
  },
  sections: {
    addLabel: 'Ajouter une section',
    createItem: () => ({ title: '', content: '' }),
    template: [
      { key: 'title', type: 'text', label: 'Titre', placeholder: 'Informations' },
      { key: 'content', type: 'textarea', label: 'Contenu' },
    ],
  },
};

/**
 * Rend le composant adapte au `type` du descripteur de champ backend.
 * `value` / `onChange` dirigent la valeur stockee dans event.details.
 */
export default function DynamicField({ field, value, onChange, id }) {
  switch (field.type) {
    case 'textarea':
      return (
        <textarea
          id={id}
          className="input min-h-[100px]"
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'date':
      return (
        <input
          id={id}
          type="date"
          className="input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'time':
      return (
        <input
          id={id}
          type="time"
          className="input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'number':
      return (
        <input
          id={id}
          type="number"
          className="input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );

    case 'boolean':
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.placeholder || 'Oui'}
        </label>
      );

    case 'select':
      return (
        <select
          id={id}
          className="input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">-- Choisir --</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'image':
      return <ImageField id={id} value={value} onChange={onChange} />;

    case 'gallery':
      return <GalleryField value={value} onChange={onChange} />;

    case 'list':
      return <ListField value={value} onChange={onChange} placeholder={field.placeholder} />;

    case 'program':
    case 'contacts':
    case 'links':
    case 'speakers':
    case 'sections': {
      const config = REPEATERS[field.type];
      return (
        <RepeaterField
          value={value}
          onChange={onChange}
          template={config.template}
          createItem={config.createItem}
          addLabel={config.addLabel}
        />
      );
    }

    case 'text':
    default:
      return (
        <input
          id={id}
          type="text"
          className="input"
          placeholder={field.placeholder}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

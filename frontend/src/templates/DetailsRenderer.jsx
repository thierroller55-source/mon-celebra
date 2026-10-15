import { Clock, Mail, Phone, ExternalLink } from 'lucide-react';

const WIDE_TYPES = new Set([
  'textarea',
  'gallery',
  'program',
  'contacts',
  'links',
  'speakers',
  'sections',
  'list',
  'image',
]);

function isFilled(value) {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return value;
  return true;
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function contactHref(value) {
  if (!value) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  if (/^\+?[0-9 ().-]{6,}$/.test(value)) return `tel:${value.replace(/[^+0-9]/g, '')}`;
  if (/^https?:\/\//.test(value)) return value;
  return null;
}

function ScalarValue({ field, value }) {
  if (field.type === 'boolean') {
    return value ? <span className="font-medium">{field.label}</span> : null;
  }
  if (field.type === 'date') return <span>{formatDate(value)}</span>;
  if (field.type === 'select') {
    const option = (field.options || []).find((o) => o.value === value);
    return <span>{option?.label || value}</span>;
  }
  return <span>{String(value)}</span>;
}

function FieldValue({ field, value }) {
  switch (field.type) {
    case 'image':
      return (
        <img
          src={value.url}
          alt={field.label}
          className="w-full rounded-xl object-cover"
          loading="lazy"
        />
      );

    case 'gallery':
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((image, index) => (
            <img
              key={index}
              src={image.url}
              alt={`${field.label} ${index + 1}`}
              className="aspect-square w-full rounded-xl object-cover"
              loading="lazy"
            />
          ))}
        </div>
      );

    case 'list':
      return (
        <ul className="list-inside list-disc space-y-1 text-celebra-dark/80">
          {value.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );

    case 'program':
      return (
        <ol className="space-y-3">
          {value.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              {item.time && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-celebra-gold/15 px-2.5 py-1 text-sm font-medium text-celebra-dark">
                  <Clock size={13} />
                  {item.time}
                </span>
              )}
              <div>
                {item.title && <p className="font-medium">{item.title}</p>}
                {item.description && (
                  <p className="text-sm text-celebra-dark/60">{item.description}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      );

    case 'contacts':
      return (
        <ul className="space-y-2">
          {value.map((contact, index) => {
            const href = contactHref(contact.value);
            const Icon = /@/.test(contact.value || '') ? Mail : Phone;
            return (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Icon size={15} className="text-celebra-gold" />
                {contact.label && <span className="font-medium">{contact.label} :</span>}
                {href ? (
                  <a href={href} className="text-celebra-dark/80 underline">
                    {contact.value}
                  </a>
                ) : (
                  <span className="text-celebra-dark/80">{contact.value}</span>
                )}
              </li>
            );
          })}
        </ul>
      );

    case 'links':
      return (
        <ul className="space-y-2">
          {value.map((link, index) => (
            <li key={index}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-celebra-gold underline"
              >
                <ExternalLink size={14} />
                {link.label || link.url}
              </a>
            </li>
          ))}
        </ul>
      );

    case 'speakers':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {value.map((speaker, index) => (
            <div key={index} className="flex gap-3 rounded-xl border border-celebra-dark/10 p-3">
              {speaker.photo?.url && (
                <img
                  src={speaker.photo.url}
                  alt={speaker.name}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              )}
              <div>
                {speaker.name && <p className="font-semibold">{speaker.name}</p>}
                {speaker.bio && (
                  <p className="text-sm text-celebra-dark/60">{speaker.bio}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      );

    case 'sections':
      return (
        <div className="space-y-4">
          {value.map((section, index) => (
            <div key={index}>
              {section.title && <h3 className="font-semibold">{section.title}</h3>}
              {section.content && (
                <p className="whitespace-pre-line text-celebra-dark/70">{section.content}</p>
              )}
            </div>
          ))}
        </div>
      );

    default:
      return <ScalarValue field={field} value={value} />;
  }
}

/**
 * Rendu generique des champs specifiques (event.details) a partir des
 * descripteurs de la categorie (issus de /api/categories).
 */
export default function DetailsRenderer({ fields = [], details = {} }) {
  const visible = fields.filter((field) => isFilled(details[field.key]));
  if (!visible.length) return null;

  const scalar = visible.filter((f) => !WIDE_TYPES.has(f.type));
  const wide = visible.filter((f) => WIDE_TYPES.has(f.type));

  return (
    <section className="mb-12">
      <h2 className="mb-6 text-center text-xl font-bold">Informations</h2>

      {scalar.length > 0 && (
        <dl className="mb-6 grid gap-4 sm:grid-cols-2">
          {scalar.map((field) => (
            <div key={field.key} className="card p-4">
              <dt className="text-xs uppercase tracking-wide text-celebra-dark/50">
                {field.label}
              </dt>
              <dd className="mt-1 text-celebra-dark/90">
                <ScalarValue field={field} value={details[field.key]} />
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="space-y-6">
        {wide.map((field) => (
          <div key={field.key}>
            <h3 className="mb-3 font-semibold">{field.label}</h3>
            <FieldValue field={field} value={details[field.key]} />
          </div>
        ))}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Palette } from 'lucide-react';
import CategoryForm from '../form/CategoryForm.jsx';
import MapPicker from '../map/MapPicker.jsx';
import AddressSearch from '../map/AddressSearch.jsx';
import { templateService } from '../../services/template.service.js';
import { PLACE_TYPES } from '../../utils/constants.js';

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function buildInitial(categorySlug, event = null) {
  const location = event?.location || {};
  const design = event?.design || {};
  return {
    category: categorySlug,
    title: event?.title || '',
    tagline: event?.tagline || '',
    description: event?.description || '',
    date: toDateInput(event?.date),
    startTime: event?.startTime || '',
    endTime: event?.endTime || '',
    locationLabel: location.label || 'Ceremonie',
    locationType: location.type || 'salle_reception',
    locationName: location.name || '',
    locationAddress: location.address || '',
    latitude: location.latitude != null ? String(location.latitude) : '',
    longitude: location.longitude != null ? String(location.longitude) : '',
    primaryColor: design.primaryColor || '#B08D57',
    secondaryColor: design.secondaryColor || '#1F2937',
    visibility: event?.visibility || 'public',
    accessCode: '',
    publishNow: false,
  };
}

/**
 * Formulaire evenement unifie (creation + edition).
 *
 * @param {object} props
 * @param {object} props.category     Categorie (fieldsSchema).
 * @param {object|null} props.event   Evenement existant (mode edition).
 * @param {boolean} props.mode        'create' | 'edit'
 * @param {boolean} props.submitting
 * @param {string} props.error
 * @param {object} props.fieldErrors  Erreurs de champs details.
 * @param {(payload:object, meta:{files:File[],publishNow:boolean})=>void} props.onSubmit
 * @param {()=>void} props.onCancel
 * @param {string} props.submitLabel
 */
export default function EventForm({
  category,
  event = null,
  mode = 'create',
  submitting = false,
  error = '',
  fieldErrors = {},
  onSubmit,
  onCancel,
  submitLabel,
}) {
  const categorySlug = category?.slug;
  const [form, setForm] = useState(() => buildInitial(categorySlug, event));
  const [details, setDetails] = useState(() => event?.details || {});
  const [files, setFiles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState(() => {
    const t = event?.templateId;
    if (!t) return '';
    return typeof t === 'string' ? t : t._id || '';
  });

  useEffect(() => {
    setForm(buildInitial(categorySlug, event));
    setDetails(event?.details || {});
    setFiles([]);
    const t = event?.templateId;
    setTemplateId(!t ? '' : typeof t === 'string' ? t : t._id || '');
  }, [categorySlug, event]);

  useEffect(() => {
    if (!categorySlug) return;
    let active = true;
    templateService
      .list(categorySlug)
      .then((list) => active && setTemplates(list))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [categorySlug]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePickLocation = (latitude, longitude) =>
    setForm((f) => ({
      ...f,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));

  const handleTemplate = (e) => {
    const id = e.target.value;
    setTemplateId(id);
    const template = templates.find((t) => t._id === id);
    if (template?.layout) {
      setForm((f) => ({
        ...f,
        primaryColor: template.layout.primaryColor || f.primaryColor,
        secondaryColor: template.layout.secondaryColor || f.secondaryColor,
      }));
    }
  };

  const cleanedDetails = useMemo(() => {
    const result = {};
    Object.entries(details).forEach(([key, value]) => {
      if (value === undefined || value === '') return;
      if (Array.isArray(value) && value.length === 0) return;
      result[key] = value;
    });
    return result;
  }, [details]);

  const buildPayload = () => {
    const payload = {
      category: form.category,
      title: form.title.trim(),
      visibility: form.visibility,
      templateId: templateId || null,
      design: {
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        customTexts: { headline: form.title.trim() },
      },
      details: cleanedDetails,
    };
    if (form.tagline.trim()) payload.tagline = form.tagline.trim();
    if (form.description.trim()) payload.description = form.description.trim();
    if (form.date) payload.date = form.date;
    if (form.startTime) payload.startTime = form.startTime;
    if (form.endTime) payload.endTime = form.endTime;

    const location = { label: form.locationLabel, type: form.locationType };
    if (form.locationName.trim()) location.name = form.locationName.trim();
    if (form.locationAddress.trim()) location.address = form.locationAddress.trim();
    if (form.latitude !== '') location.latitude = Number(form.latitude);
    if (form.longitude !== '') location.longitude = Number(form.longitude);
    payload.location = location;

    if (form.visibility === 'password' && form.accessCode) {
      payload.accessCode = form.accessCode;
    }
    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(buildPayload(), { files, publishNow: form.publishNow });
  };

  if (!category) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Evenement</h2>

        <div>
          <label htmlFor="title" className="label">Titre *</label>
          <input
            id="title"
            name="title"
            className="input"
            placeholder="Titre de l'evenement"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="label">Date</label>
            <input
              id="date"
              name="date"
              type="date"
              className="input"
              value={form.date}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="tagline" className="label">Sous-titre</label>
            <input
              id="tagline"
              name="tagline"
              className="input"
              value={form.tagline}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea
            id="description"
            name="description"
            className="input min-h-[100px]"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="startTime" className="label">Heure de debut</label>
            <input
              id="startTime"
              name="startTime"
              type="time"
              className="input"
              value={form.startTime}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="endTime" className="label">Heure de fin</label>
            <input
              id="endTime"
              name="endTime"
              type="time"
              className="input"
              value={form.endTime}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <CategoryForm
        category={category}
        value={details}
        onChange={setDetails}
        errors={fieldErrors}
      />

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Lieu</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="locationLabel" className="label">Intitule</label>
            <input
              id="locationLabel"
              name="locationLabel"
              className="input"
              value={form.locationLabel}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="locationType" className="label">Type de lieu</label>
            <select
              id="locationType"
              name="locationType"
              className="input"
              value={form.locationType}
              onChange={handleChange}
            >
              {PLACE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="locationName" className="label">Nom du lieu</label>
          <input
            id="locationName"
            name="locationName"
            className="input"
            value={form.locationName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="locationAddress" className="label">Adresse</label>
          <input
            id="locationAddress"
            name="locationAddress"
            className="input"
            value={form.locationAddress}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <p className="label mb-1">Rechercher une adresse</p>
          <AddressSearch
            onSelect={({ address, lat, lng }) =>
              setForm((f) => ({
                ...f,
                locationAddress: address,
                latitude: String(lat.toFixed(6)),
                longitude: String(lng.toFixed(6)),
              }))
            }
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="latitude" className="label">Latitude</label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              className="input"
              value={form.latitude}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="longitude" className="label">Longitude</label>
            <input
              id="longitude"
              name="longitude"
              type="number"
              step="any"
              className="input"
              value={form.longitude}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <p className="label">Position sur la carte (clic pour choisir)</p>
          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={handlePickLocation}
          />
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Style & modele</h2>

        {templates.length > 0 && (
          <div>
            <label htmlFor="templateId" className="label">
              <Palette size={14} className="mr-1 inline" />
              Modele graphique
            </label>
            <select
              id="templateId"
              className="input"
              value={templateId}
              onChange={handleTemplate}
            >
              <option value="">Modele par defaut</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                  {t.isPremium ? ' (premium)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="primaryColor" className="label">Couleur principale</label>
            <input
              id="primaryColor"
              name="primaryColor"
              type="color"
              className="input h-11 p-1"
              value={form.primaryColor}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="secondaryColor" className="label">Couleur secondaire</label>
            <input
              id="secondaryColor"
              name="secondaryColor"
              type="color"
              className="input h-11 p-1"
              value={form.secondaryColor}
              onChange={handleChange}
            />
          </div>
        </div>

        {mode === 'create' && (
          <div>
            <label htmlFor="photos" className="label">
              Photos (max 20, 3 Mo par image)
            </label>
            <input
              id="photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="input"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
            {files.length > 0 && (
              <p className="mt-1 text-xs text-celebra-dark/50">
                {files.length} photo(s) selectionnee(s)
              </p>
            )}
          </div>
        )}
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Publication</h2>

        <div>
          <label htmlFor="visibility" className="label">Confidentialite</label>
          <select
            id="visibility"
            name="visibility"
            className="input"
            value={form.visibility}
            onChange={handleChange}
          >
            <option value="public">Public</option>
            <option value="private">Prive (lien direct)</option>
            <option value="password">Protege par mot de passe</option>
          </select>
        </div>

        {form.visibility === 'password' && (
          <div>
            <label htmlFor="accessCode" className="label">Code d&apos;acces</label>
            <input
              id="accessCode"
              name="accessCode"
              className="input"
              value={form.accessCode}
              onChange={handleChange}
            />
          </div>
        )}

        {mode === 'create' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.publishNow}
              onChange={(e) => setForm((f) => ({ ...f, publishNow: e.target.checked }))}
            />
            Publier immediatement
          </label>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-outline" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" size={16} />}
          {submitting ? 'Enregistrement...' : submitLabel || "Creer l'evenement"}
        </button>
      </div>
    </form>
  );
}

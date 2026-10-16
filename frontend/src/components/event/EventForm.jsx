import { useEffect, useMemo, useState } from 'react';
import { Loader2, ImagePlus, X, LocateFixed, Link2, Loader } from 'lucide-react';
import CategoryForm from '../form/CategoryForm.jsx';
import MapPicker from '../map/MapPicker.jsx';
import AddressSearch from '../map/AddressSearch.jsx';
import { PLACE_TYPES } from '../../utils/constants.js';
import { geoService } from '../../services/geo.service.js';
import { getErrorMessage } from '../../services/api.js';
import { parseGoogleMapsUrl, isShortMapsLink, isValidLatLng } from '../../lib/geo.js';

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
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(() => event?.mainImage?.url || '');
  const [removePoster, setRemovePoster] = useState(false);
  const [geoBusy, setGeoBusy] = useState(false);
  const [linkValue, setLinkValue] = useState('');
  const [linkBusy, setLinkBusy] = useState(false);
  const [locationNote, setLocationNote] = useState('');

  useEffect(() => {
    setForm(buildInitial(categorySlug, event));
    setDetails(event?.details || {});
    setFiles([]);
    setPosterFile(null);
    setPosterPreview(event?.mainImage?.url || '');
    setRemovePoster(false);
  }, [categorySlug, event]);

  useEffect(
    () => () => {
      if (posterFile && posterPreview) URL.revokeObjectURL(posterPreview);
    },
    [posterFile, posterPreview],
  );

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePickLocation = (latitude, longitude) => {
    setLocationNote('');
    setForm((f) => ({
      ...f,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setLocationNote("La geolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    setGeoBusy(true);
    setLocationNote('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setGeoBusy(false);
        setLocationNote('Position actuelle selectionnee. Ajustez-la si besoin.');
      },
      (err) => {
        setGeoBusy(false);
        setLocationNote(
          err.code === err.PERMISSION_DENIED
            ? 'Acces refuse : autorisez la localisation dans votre navigateur.'
            : "Impossible d'obtenir votre position.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleMapsLink = async () => {
    const value = linkValue.trim();
    if (!value) return;
    setLocationNote('');
    const direct = parseGoogleMapsUrl(value);
    if (direct) {
      handlePickLocation(direct.lat, direct.lng);
      setLinkValue('');
      setLocationNote('Position extraite du lien Google Maps.');
      return;
    }
    if (!isShortMapsLink(value)) {
      setLocationNote('Lien Google Maps non reconnu.');
      return;
    }
    setLinkBusy(true);
    try {
      const coords = await geoService.resolveLink(value);
      handlePickLocation(coords.lat, coords.lng);
      setLinkValue('');
      setLocationNote('Position extraite du lien Google Maps.');
    } catch (err) {
      setLocationNote(getErrorMessage(err));
    } finally {
      setLinkBusy(false);
    }
  };

  const handlePosterSelect = (file) => {
    if (!file) return;
    setPosterFile(file);
    setRemovePoster(false);
    setPosterPreview(URL.createObjectURL(file));
  };

  const clearPoster = () => {
    setPosterFile(null);
    setPosterPreview('');
    setRemovePoster(true);
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
    if (isValidLatLng(form.latitude, form.longitude)) {
      location.latitude = Number(form.latitude);
      location.longitude = Number(form.longitude);
    }
    payload.location = location;

    if (form.visibility === 'password' && form.accessCode) {
      payload.accessCode = form.accessCode;
    }
    return payload;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(buildPayload(), { files, publishNow: form.publishNow, posterFile, removePoster });
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
        <h2 className="font-semibold">Affiche de l&apos;evenement</h2>
        <p className="text-sm text-celebra-dark/60">
          Importez votre affiche (affiche, flyer, faire-part). Elle sera affichee telle quelle
          a vos invites. Formats acceptes : JPEG, PNG ou WebP (max 8 Mo).
        </p>

        <input
          id="poster"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handlePosterSelect(e.target.files?.[0])}
        />

        {posterPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-celebra-dark/15">
            <img src={posterPreview} alt="Affiche" className="max-h-96 w-full object-contain" />
            <div className="absolute right-2 top-2 flex gap-2">
              <label
                htmlFor="poster"
                className="cursor-pointer rounded-lg bg-white/90 p-1.5 text-celebra-dark shadow hover:bg-white"
                aria-label="Remplacer l'affiche"
              >
                <ImagePlus size={16} />
              </label>
              <button
                type="button"
                className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                onClick={clearPoster}
                aria-label="Supprimer l'affiche"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor="poster"
            className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-celebra-dark/20 px-4 py-10 text-center text-sm text-celebra-dark/60 hover:border-celebra-gold"
          >
            <ImagePlus size={24} />
            <span className="font-medium text-celebra-dark">Importer votre affiche</span>
            <span>JPEG, PNG ou WebP - 8 Mo max</span>
          </label>
        )}
      </section>

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
          <p className="label mb-1">Rechercher une adresse</p>
          <AddressSearch
            onSelect={({ address, lat, lng }) => {
              setLocationNote('');
              setForm((f) => ({
                ...f,
                locationAddress: address,
                latitude: lat.toFixed(6),
                longitude: lng.toFixed(6),
              }));
            }}
          />
        </div>

        <div>
          <p className="label">Position sur la carte</p>
          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={handlePickLocation}
          />
          <p className="mt-1 text-xs text-celebra-dark/50">
            Cliquez sur la carte ou faites glisser le marqueur pour ajuster la position.
          </p>
        </div>

        <div>
          <button
            type="button"
            className="btn-outline"
            onClick={handleGeolocate}
            disabled={geoBusy}
          >
            {geoBusy ? <Loader className="animate-spin" size={15} /> : <LocateFixed size={15} />}
            Ma position actuelle
          </button>
        </div>

        <div>
          <label htmlFor="mapsLink" className="label">Coller un lien Google Maps</label>
          <div className="flex gap-2">
            <input
              id="mapsLink"
              className="input"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder="https://maps.app.goo.gl/... ou .../@14.767,-17.397,15z"
            />
            <button
              type="button"
              className="btn-outline shrink-0"
              onClick={handleMapsLink}
              disabled={linkBusy || !linkValue.trim()}
            >
              {linkBusy ? <Loader className="animate-spin" size={15} /> : <Link2 size={15} />}
              Utiliser
            </button>
          </div>
        </div>

        {locationNote && (
          <p className="text-sm text-celebra-dark/70">{locationNote}</p>
        )}

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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="latitude" className="label">Latitude</label>
            <input
              id="latitude"
              name="latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
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
              min="-180"
              max="180"
              className="input"
              value={form.longitude}
              onChange={handleChange}
            />
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">Galerie</h2>

        {mode === 'create' ? (
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
        ) : (
          <p className="text-sm text-celebra-dark/50">
            La galerie se gere depuis la page de gestion de l&apos;evenement.
          </p>
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

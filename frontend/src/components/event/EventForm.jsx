import { useEffect, useMemo, useState } from 'react';
import { Loader2, ImagePlus, X, LocateFixed, Link2, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CategoryForm from '../form/CategoryForm.jsx';
import MapPicker from '../map/MapPicker.jsx';
import AddressSearch from '../map/AddressSearch.jsx';
import { PLACE_TYPES } from '../../utils/constants.js';
import { geoService } from '../../services/geo.service.js';
import { getErrorMessage } from '../../services/api.js';
import { parseGoogleMapsUrl, isShortMapsLink, isValidLatLng } from '../../lib/geo.js';
import { LOCALES, LANGUAGE_NAMES } from '../../i18n/config.js';

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
    language: event?.language || 'fr',
    locationLabel: location.label || '',
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

function Field({ htmlFor, label, hint, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-celebra-dark/50">{hint}</p>}
    </div>
  );
}

/**
 * Formulaire evenement unifie (creation + edition).
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
  const { t } = useTranslation();
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
    setLinkValue('');
    setLocationNote('');
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
      setLocationNote(t('editor.geoUnavailable'));
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
        setLocationNote(t('editor.geoSelected'));
      },
      (err) => {
        setGeoBusy(false);
        setLocationNote(
          err.code === err.PERMISSION_DENIED ? t('editor.geoDenied') : t('editor.geoError'),
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
      setLocationNote(t('editor.linkExtracted'));
      return;
    }
    if (!isShortMapsLink(value)) {
      setLocationNote(t('editor.linkUnknown'));
      return;
    }
    setLinkBusy(true);
    try {
      const coords = await geoService.resolveLink(value);
      handlePickLocation(coords.lat, coords.lng);
      setLinkValue('');
      setLocationNote(t('editor.linkExtracted'));
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
      language: form.language,
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
        <h2 className="font-semibold">{t('editor.posterTitle')}</h2>
        <p className="text-sm text-celebra-dark/60">{t('editor.posterHint')}</p>

        <input
          id="poster"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handlePosterSelect(e.target.files?.[0])}
        />

        {posterPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-celebra-dark/15">
            <img
              src={posterPreview}
              alt={t('editor.posterAlt')}
              className="max-h-96 w-full object-contain"
            />
            <div className="absolute right-2 top-2 flex gap-2">
              <label
                htmlFor="poster"
                className="cursor-pointer rounded-lg bg-white/90 p-1.5 text-celebra-dark shadow hover:bg-white"
                aria-label={t('editor.posterReplace')}
              >
                <ImagePlus size={16} />
              </label>
              <button
                type="button"
                className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
                onClick={clearPoster}
                aria-label={t('editor.posterRemove')}
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
            <span className="font-medium text-celebra-dark">{t('editor.posterImport')}</span>
            <span>{t('editor.posterFormats')}</span>
          </label>
        )}
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">{t('editor.eventSection')}</h2>

        <Field htmlFor="title" label={`${t('editor.title')} *`}>
          <input
            id="title"
            name="title"
            className="input"
            placeholder={t('editor.titlePlaceholder')}
            value={form.title}
            onChange={handleChange}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="date" label={t('editor.date')}>
            <input
              id="date"
              name="date"
              type="date"
              className="input"
              value={form.date}
              onChange={handleChange}
            />
          </Field>
          <Field htmlFor="tagline" label={t('editor.tagline')}>
            <input
              id="tagline"
              name="tagline"
              className="input"
              value={form.tagline}
              onChange={handleChange}
            />
          </Field>
        </div>

        <Field htmlFor="description" label={t('editor.description')}>
          <textarea
            id="description"
            name="description"
            className="input"
            value={form.description}
            onChange={handleChange}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="startTime" label={t('editor.startTime')}>
            <input
              id="startTime"
              name="startTime"
              type="time"
              className="input"
              value={form.startTime}
              onChange={handleChange}
            />
          </Field>
          <Field htmlFor="endTime" label={t('editor.endTime')}>
            <input
              id="endTime"
              name="endTime"
              type="time"
              className="input"
              value={form.endTime}
              onChange={handleChange}
            />
          </Field>
        </div>

        <Field
          htmlFor="language"
          label={t('editor.eventLanguage')}
          hint={t('editor.eventLanguageHint')}
        >
          <select
            id="language"
            name="language"
            className="input"
            value={form.language}
            onChange={handleChange}
          >
            {LOCALES.map((code) => (
              <option key={code} value={code} lang={code}>
                {LANGUAGE_NAMES[code]}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <CategoryForm
        category={category}
        value={details}
        onChange={setDetails}
        errors={fieldErrors}
      />

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">{t('editor.placeSection')}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="locationLabel" label={t('editor.locationLabel')}>
            <input
              id="locationLabel"
              name="locationLabel"
              className="input"
              value={form.locationLabel}
              onChange={handleChange}
            />
          </Field>
          <Field htmlFor="locationType" label={t('editor.locationType')}>
            <select
              id="locationType"
              name="locationType"
              className="input"
              value={form.locationType}
              onChange={handleChange}
            >
              {PLACE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field htmlFor="locationName" label={t('editor.locationName')}>
          <input
            id="locationName"
            name="locationName"
            className="input"
            value={form.locationName}
            onChange={handleChange}
          />
        </Field>

        <div>
          <p className="label mb-1">{t('editor.searchAddress')}</p>
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
          <p className="label">{t('editor.mapPosition')}</p>
          <MapPicker
            latitude={form.latitude}
            longitude={form.longitude}
            onChange={handlePickLocation}
          />
          <p className="mt-1 text-xs text-celebra-dark/50">{t('editor.mapHint')}</p>
        </div>

        <div>
          <button
            type="button"
            className="btn-outline"
            onClick={handleGeolocate}
            disabled={geoBusy}
          >
            {geoBusy ? <Loader className="animate-spin" size={15} /> : <LocateFixed size={15} />}
            {t('editor.currentPosition')}
          </button>
        </div>

        <Field htmlFor="mapsLink" label={t('editor.pasteLink')}>
          <div className="flex gap-2">
            <input
              id="mapsLink"
              className="input"
              value={linkValue}
              onChange={(e) => setLinkValue(e.target.value)}
              placeholder={t('editor.linkPlaceholder')}
            />
            <button
              type="button"
              className="btn-outline shrink-0"
              onClick={handleMapsLink}
              disabled={linkBusy || !linkValue.trim()}
            >
              {linkBusy ? <Loader className="animate-spin" size={15} /> : <Link2 size={15} />}
              {t('editor.useLink')}
            </button>
          </div>
        </Field>

        {locationNote && <p className="text-sm text-celebra-dark/70">{locationNote}</p>}

        <Field htmlFor="locationAddress" label={t('editor.address')}>
          <input
            id="locationAddress"
            name="locationAddress"
            className="input"
            value={form.locationAddress}
            onChange={handleChange}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="latitude" label={t('editor.latitude')}>
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
          </Field>
          <Field htmlFor="longitude" label={t('editor.longitude')}>
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
          </Field>
        </div>
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">{t('editor.gallerySection')}</h2>

        {mode === 'create' ? (
          <div>
            <label htmlFor="photos" className="label">
              {t('editor.photos')}
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
                {t('editor.photosCount', { count: files.length })}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-celebra-dark/50">{t('editor.galleryHint')}</p>
        )}
      </section>

      <section className="card space-y-4 p-6">
        <h2 className="font-semibold">{t('editor.publicationSection')}</h2>

        <Field htmlFor="visibility" label={t('editor.visibility')}>
          <select
            id="visibility"
            name="visibility"
            className="input"
            value={form.visibility}
            onChange={handleChange}
          >
            <option value="public">{t('editor.visibilityPublic')}</option>
            <option value="private">{t('editor.visibilityPrivate')}</option>
            <option value="password">{t('editor.visibilityPassword')}</option>
          </select>
        </Field>

        {form.visibility === 'password' && (
          <Field htmlFor="accessCode" label={t('editor.accessCode')}>
            <input
              id="accessCode"
              name="accessCode"
              className="input"
              value={form.accessCode}
              onChange={handleChange}
            />
          </Field>
        )}

        {mode === 'create' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.publishNow}
              onChange={(e) => setForm((f) => ({ ...f, publishNow: e.target.checked }))}
            />
            {t('editor.publishNow')}
          </label>
        )}
      </section>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-outline" onClick={onCancel} disabled={submitting}>
          {t('editor.cancel')}
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting && <Loader2 className="animate-spin" size={16} />}
          {submitting ? t('editor.submitting') : submitLabel || t('editor.submitCreate')}
        </button>
      </div>
    </form>
  );
}

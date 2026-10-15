import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { uploadService } from '../../services/upload.service.js';
import { getErrorMessage } from '../../services/api.js';

const ACCEPT = 'image/jpeg,image/png,image/webp';

/**
 * Champ image unique (valeur : { url, publicId } | null).
 * `compact` reduit l'apercu (utilise dans les sous-champs repetables).
 */
export default function ImageField({ value, onChange, id, compact = false }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const image = await uploadService.image(file);
      onChange({ url: image.url, publicId: image.publicId });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clear = () => onChange(null);

  const height = compact ? 'h-24' : 'h-40';

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value?.url ? (
        <div className={`relative overflow-hidden rounded-xl border border-celebra-dark/15 ${height}`}>
          <img src={value.url} alt="" className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-2">
            <button
              type="button"
              className="rounded-lg bg-white/90 p-1.5 text-celebra-dark shadow hover:bg-white"
              onClick={() => inputRef.current?.click()}
              aria-label="Remplacer l'image"
            >
              <ImagePlus size={16} />
            </button>
            <button
              type="button"
              className="rounded-lg bg-white/90 p-1.5 text-red-600 shadow hover:bg-white"
              onClick={clear}
              aria-label="Supprimer l'image"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-celebra-dark/25 bg-white text-sm text-celebra-dark/60 hover:border-celebra-gold hover:text-celebra-dark disabled:opacity-60 ${height}`}
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
          {loading ? 'Envoi...' : 'Ajouter une image'}
        </button>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

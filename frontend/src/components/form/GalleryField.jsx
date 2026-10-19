import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadService } from '../../services/upload.service.js';
import { getErrorMessage } from '../../services/api.js';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX = 20;

/** Galerie d'images (tableau de { url, publicId }). */
export default function GalleryField({ value = [], onChange }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const images = Array.isArray(value) ? value : [];

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).slice(0, MAX - images.length);
    if (!files.length) return;
    setLoading(true);
    setError('');
    try {
      const uploaded = [];
      for (const file of files) {
        const image = await uploadService.image(file);
        uploaded.push({ url: image.url, publicId: image.publicId });
      }
      onChange([...images, ...uploaded]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="group relative h-24 overflow-hidden rounded-xl border border-celebra-dark/15"
            >
              <img src={image.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1 text-red-600 shadow hover:bg-white"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-celebra-dark/25 bg-celebra-paper text-sm text-celebra-dark/60 hover:border-celebra-gold hover:text-celebra-dark disabled:opacity-60"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
          {loading ? 'Envoi...' : `Ajouter des images (${images.length}/${MAX})`}
        </button>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

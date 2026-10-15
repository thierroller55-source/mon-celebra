import sharp from 'sharp';

const DEFAULTS = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 82,
  format: 'webp',
};

/**
 * Normalise une image uploadee : corrige l'orientation EXIF, redimensionne
 * (sans agrandir) et compresse. Sharp supprime les metadonnees par defaut,
 * ce qui retire aussi les donnees de geolocalisation EXIF (vie privee).
 *
 * @param {Buffer} buffer image brute (multer memoryStorage)
 * @returns {Promise<{ buffer: Buffer, width: number, height: number, format: string, bytes: number }>}
 */
export async function processImage(buffer, options = {}) {
  const { maxWidth, maxHeight, quality, format } = { ...DEFAULTS, ...options };

  const pipeline = sharp(buffer)
    .rotate()
    .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true });

  if (format === 'webp') pipeline.webp({ quality });
  else if (format === 'jpeg') pipeline.jpeg({ quality, mozjpeg: true });
  else if (format === 'png') pipeline.png({ compressionLevel: 9 });
  else pipeline.webp({ quality });

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer: data,
    width: info.width,
    height: info.height,
    format: info.format,
    bytes: info.size,
  };
}

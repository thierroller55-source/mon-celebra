import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { processImage } from '../services/image.service.js';
import { uploadImage, deleteImage, isCloudinaryEnabled } from '../services/storage.service.js';

export const uploadImageController = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('Aucune image recue.', 'NO_FILE');
  }

  const processed = await processImage(req.file.buffer);
  const stored = await uploadImage(processed.buffer, {
    folder: 'moncelebra',
    extension: processed.format,
  });

  res.status(201).json({
    success: true,
    data: {
      url: stored.url,
      publicId: stored.publicId,
      provider: stored.provider,
      width: processed.width,
      height: processed.height,
      format: processed.format,
      bytes: processed.bytes,
    },
  });
});

export const deleteImageController = asyncHandler(async (req, res) => {
  const publicId = req.body?.publicId || req.query.publicId;
  if (!publicId) {
    throw ApiError.badRequest('publicId manquant.', 'MISSING_PUBLIC_ID');
  }

  const deleted = await deleteImage(String(publicId));
  if (!deleted) {
    throw ApiError.notFound('Image introuvable ou deja supprimee.');
  }

  res.json({ success: true, data: { message: 'Image supprimee.' } });
});

export const storageInfo = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { driver: isCloudinaryEnabled() ? 'cloudinary' : 'local' } });
});

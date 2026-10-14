import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { ALLOWED_IMAGE_MIME, QUOTAS } from '../config/constants.js';

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
    return cb(null, true);
  }
  return cb(
    ApiError.badRequest(
      "Format d'image non autorise. Formats acceptes : JPEG, PNG, WebP.",
      'INVALID_FILE_TYPE',
    ),
  );
}

const maxSize = Math.min(env.MAX_FILE_SIZE_MB, QUOTAS.MAX_FILE_SIZE_MB) * 1024 * 1024;

/** Upload d'une image unique (champ "image"). */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize, files: 1 },
}).single('image');

/** Upload de plusieurs images (champ "photos"), max galerie. */
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxSize, files: QUOTAS.MAX_GALLERY_PHOTOS },
}).array('photos', QUOTAS.MAX_GALLERY_PHOTOS);

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import cloudinary from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const cloudinaryV2 = cloudinary.v2;

if (env.cloudinary.enabled) {
  cloudinaryV2.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
  logger.info('Stockage images : Cloudinary active.');
} else {
  logger.info('Stockage images : local (backend/uploads).');
}

export function isCloudinaryEnabled() {
  return env.cloudinary.enabled;
}

function randomName(extension) {
  const id = crypto.randomBytes(12).toString('hex');
  return `${Date.now()}-${id}.${extension}`;
}

async function uploadToLocal(buffer, { extension }) {
  await fs.mkdir(env.uploadDir, { recursive: true });
  const filename = randomName(extension);
  await fs.writeFile(path.join(env.uploadDir, filename), buffer);
  return {
    url: `${env.PUBLIC_BASE_URL}/uploads/${filename}`,
    publicId: filename,
    provider: 'local',
  };
}

function uploadToCloudinary(buffer, { folder }) {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryV2.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          provider: 'cloudinary',
        });
      },
    );
    stream.end(buffer);
  });
}

/**
 * Stocke une image deja traitee et renvoie son URL publique + identifiant.
 * Le stockage (local ou Cloudinary) est choisi par STORAGE_DRIVER.
 */
export async function uploadImage(buffer, { folder = 'moncelebra', extension = 'webp' } = {}) {
  if (env.cloudinary.enabled) {
    return uploadToCloudinary(buffer, { folder });
  }
  return uploadToLocal(buffer, { extension });
}

/**
 * Recupere les octets d'une image stockee (locale ou distante) afin de la
 * restituer via l'API, par exemple pour un acces same-origin (proxy affiche).
 * Evite ainsi les problemes de canvas "contamine" cote navigateur.
 */
export async function fetchImageBytes({ url, publicId }) {
  if (!url) throw new Error('Image introuvable.');

  if (!env.cloudinary.enabled && publicId && !/^https?:\/\//i.test(publicId)) {
    return fs.readFile(path.join(env.uploadDir, publicId));
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Echec du telechargement de l'image (${response.status}).`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Supprime une image stockee a partir de son publicId. */
export async function deleteImage(publicId) {
  if (!publicId) return false;

  if (env.cloudinary.enabled) {
    const result = await cloudinaryV2.uploader.destroy(publicId, { resource_type: 'image' });
    return result.result === 'ok';
  }

  const safeName = path.basename(publicId);
  try {
    await fs.unlink(path.join(env.uploadDir, safeName));
    return true;
  } catch {
    return false;
  }
}

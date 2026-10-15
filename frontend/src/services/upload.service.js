import { api } from './api.js';

/**
 * Upload / suppression d'images (champ unique "image" cote backend).
 * Retourne un objet { url, publicId } exploitable dans event.details ou la galerie.
 */
export const uploadService = {
  image: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData).then((r) => r.data.data);
  },
  remove: (publicId) =>
    api.delete('/upload/image', { data: { publicId } }).then((r) => r.data.data),
};

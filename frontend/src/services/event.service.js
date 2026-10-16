import { api } from './api.js';

export const eventService = {
  list: () => api.get('/events').then((r) => r.data.data.events),
  get: (id) => api.get(`/events/${id}`).then((r) => r.data.data.event),
  create: (payload) => api.post('/events', payload).then((r) => r.data.data.event),
  update: (id, payload) => api.put(`/events/${id}`, payload).then((r) => r.data.data.event),
  remove: (id) => api.delete(`/events/${id}`).then((r) => r.data),
  publish: (id) => api.post(`/events/${id}/publish`).then((r) => r.data.data.event),
  unpublish: (id) => api.post(`/events/${id}/unpublish`).then((r) => r.data.data.event),
  addPhotos: (id, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));
    return api.post(`/events/${id}/photos`, formData).then((r) => r.data.data);
  },
  removePhoto: (id, photoId) =>
    api.delete(`/events/${id}/photos/${photoId}`).then((r) => r.data.data),
  uploadMainImage: (id, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api
      .post(`/events/${id}/main-image`, formData)
      .then((r) => r.data.data.event);
  },
  removeMainImage: (id) =>
    api.delete(`/events/${id}/main-image`).then((r) => r.data.data.event),
  fetchQrBlobUrl: (id) =>
    api
      .get(`/events/${id}/qrcode`, { responseType: 'blob' })
      .then((r) => URL.createObjectURL(r.data)),

  listRsvp: (id) => api.get(`/events/${id}/rsvp`).then((r) => r.data.data),
  exportRsvp: (id) =>
    api.get(`/events/${id}/rsvp/export`, { responseType: 'blob' }).then((r) => r.data),

  listGuestbook: (id) =>
    api.get(`/events/${id}/guestbook`).then((r) => r.data.data.messages),
  moderateGuestbook: (id, msgId, status) =>
    api.patch(`/events/${id}/guestbook/${msgId}`, { status }).then((r) => r.data.data.message),
  deleteGuestbookMessage: (id, msgId) =>
    api.delete(`/events/${id}/guestbook/${msgId}`).then((r) => r.data.data),

  duplicate: (id) => api.post(`/events/${id}/duplicate`).then((r) => r.data.data.event),
  archive: (id) => api.post(`/events/${id}/archive`).then((r) => r.data.data.event),
  unarchive: (id) => api.post(`/events/${id}/unarchive`).then((r) => r.data.data.event),
};

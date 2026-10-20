import { api } from './api.js';

export const publicService = {
  getEvent: (slug, code) =>
    api
      .get(`/public/events/${slug}`, { params: code ? { code } : {} })
      .then((r) => r.data.data.event),

  rsvp: (slug, payload) =>
    api.post(`/public/events/${slug}/rsvp`, payload).then((r) => r.data.data.rsvp),

  myRsvp: (slug) =>
    api.get(`/public/events/${slug}/my-rsvp`).then((r) => r.data.data.rsvp),

  guestbook: (slug, { authorName, message, file }) => {
    const formData = new FormData();
    formData.append('authorName', authorName);
    formData.append('message', message);
    if (file) formData.append('image', file);
    return api
      .post(`/public/events/${slug}/guestbook`, formData)
      .then((r) => r.data.data.message);
  },

  report: (payload) => api.post('/reports', payload).then((r) => r.data.data),
};

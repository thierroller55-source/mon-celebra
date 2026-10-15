import { api } from './api.js';

export const userService = {
  getMe: () => api.get('/users/me').then((r) => r.data.data),
  updateMe: (payload) => api.put('/users/me', payload).then((r) => r.data.data),
};

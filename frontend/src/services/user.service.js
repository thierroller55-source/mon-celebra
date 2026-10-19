import { api } from './api.js';

export const userService = {
  getMe: () => api.get('/me').then((r) => r.data.data),
  updateMe: (payload) => api.patch('/me', payload).then((r) => r.data.data),
  changePassword: (payload) => api.post('/me/password', payload).then((r) => r.data.data),
};

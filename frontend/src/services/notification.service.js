import { api } from './api.js';

export const notificationService = {
  list: () => api.get('/notifications').then((r) => r.data.data.notifications),
  unreadCount: () => api.get('/notifications/unread-count').then((r) => r.data.data.count),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data.data.notification),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
};

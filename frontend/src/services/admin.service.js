import { api } from './api.js';

export const adminService = {
  stats: () => api.get('/admin/stats').then((r) => r.data.data.stats),

  users: (params) => api.get('/admin/users', { params }).then((r) => r.data.data),
  blockUser: (id) => api.patch(`/admin/users/${id}/block`).then((r) => r.data.data.user),
  unblockUser: (id) => api.patch(`/admin/users/${id}/unblock`).then((r) => r.data.data.user),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data.data),

  events: (params) => api.get('/admin/events', { params }).then((r) => r.data.data),
  deleteEvent: (id) => api.delete(`/admin/events/${id}`).then((r) => r.data.data),

  reports: (params) => api.get('/admin/reports', { params }).then((r) => r.data.data),
  updateReport: (id, status) =>
    api.patch(`/admin/reports/${id}`, { status }).then((r) => r.data.data.report),

  categories: () => api.get('/admin/categories').then((r) => r.data.data.categories),
  createCategory: (payload) =>
    api.post('/admin/categories', payload).then((r) => r.data.data.category),
  updateCategory: (id, payload) =>
    api.put(`/admin/categories/${id}`, payload).then((r) => r.data.data.category),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`).then((r) => r.data.data),

  templates: (params) => api.get('/admin/templates', { params }).then((r) => r.data.data.templates),
  createTemplate: (payload) =>
    api.post('/admin/templates', payload).then((r) => r.data.data.template),
  updateTemplate: (id, payload) =>
    api.put(`/admin/templates/${id}`, payload).then((r) => r.data.data.template),
  deleteTemplate: (id) => api.delete(`/admin/templates/${id}`).then((r) => r.data.data),
};

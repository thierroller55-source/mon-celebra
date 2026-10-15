import { api } from './api.js';

export const categoryService = {
  list: () => api.get('/categories').then((r) => r.data.data.categories),
  get: (slug) => api.get(`/categories/${slug}`).then((r) => r.data.data.category),
};

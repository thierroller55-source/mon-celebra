import { api } from './api.js';

export const templateService = {
  list: (category) =>
    api
      .get('/templates', { params: category ? { category } : {} })
      .then((r) => r.data.data.templates),
};

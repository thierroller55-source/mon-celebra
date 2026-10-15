import { api } from './api.js';

export const geoService = {
  search: (query) =>
    api
      .get('/geo/search', { params: { q: query } })
      .then((r) => r.data.data.results),
};

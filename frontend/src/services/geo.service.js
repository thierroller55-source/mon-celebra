import { api } from './api.js';

export const geoService = {
  search: (query, countrycodes = 'sn') =>
    api
      .get('/geo/search', { params: { q: query, countrycodes } })
      .then((r) => r.data.data.results),

  resolveLink: (url) =>
    api
      .get('/geo/resolve-link', { params: { url } })
      .then((r) => r.data.data),
};

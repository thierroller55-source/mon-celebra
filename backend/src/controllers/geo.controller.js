import { searchGeo, resolveMapLink } from '../services/geo.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const searchGeoController = asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length > 200) throw ApiError.badRequest('Recherche trop longue.');
  const countrycodes = req.query.countrycodes != null ? String(req.query.countrycodes) : 'sn';
  const results = await searchGeo(q, countrycodes);
  res.json({ success: true, data: { results } });
});

export const resolveMapLinkController = asyncHandler(async (req, res) => {
  const url = String(req.query.url ?? '').trim();
  if (!url) throw ApiError.badRequest('Lien manquant.');
  const coords = await resolveMapLink(url);
  if (!coords) throw ApiError.badRequest("Impossible d'extraire la position de ce lien.");
  res.json({ success: true, data: coords });
});

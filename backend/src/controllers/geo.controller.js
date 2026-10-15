import { searchGeo } from '../services/geo.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const searchGeoController = asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const results = await searchGeo(q);
  res.json({ success: true, data: { results } });
});

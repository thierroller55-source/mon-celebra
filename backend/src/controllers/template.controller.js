import { Template } from '../models/Template.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listTemplates = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.category) filter.categorySlug = String(req.query.category).toLowerCase();

  const templates = await Template.find(filter).sort({ categorySlug: 1, order: 1 });
  res.json({ success: true, data: { templates } });
});

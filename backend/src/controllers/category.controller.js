import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ order: 1 });
  res.json({ success: true, data: { categories } });
});

export const getCategory = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug).toLowerCase();
  const category = await Category.findOne({ slug, isActive: true });
  if (!category) throw ApiError.notFound('Categorie introuvable.');
  res.json({ success: true, data: { category } });
});

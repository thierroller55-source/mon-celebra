import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');
  res.json({ success: true, data: user.toJSON() });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');

  const { firstName, lastName, phone, language } = req.body;
  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (language !== undefined) user.language = language;
  await user.save();

  res.json({ success: true, data: user.toJSON() });
});

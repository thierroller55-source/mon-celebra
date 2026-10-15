import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number.parseInt(req.query.limit, 10) || 20);
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit);
  res.json({ success: true, data: { notifications } });
});

export const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { $set: { read: true } },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('Notification introuvable.');
  res.json({ success: true, data: { notification } });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { $set: { read: true } });
  res.json({ success: true, data: { message: 'Toutes les notifications sont marquees comme lues.' } });
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user.id, read: false });
  res.json({ success: true, data: { count } });
});

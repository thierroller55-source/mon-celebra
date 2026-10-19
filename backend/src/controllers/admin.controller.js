import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Category } from '../models/Category.js';
import { Template } from '../models/Template.js';
import { Report } from '../models/Report.js';
import { Rsvp } from '../models/Rsvp.js';
import { GuestbookMessage } from '../models/GuestbookMessage.js';
import { Notification } from '../models/Notification.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as eventService from '../services/event.service.js';
import { EVENT_STATUS, GUESTBOOK_STATUS } from '../config/constants.js';
import { env } from '../config/env.js';
import { sendEmail, maskEmail } from '../services/mailer.service.js';
import { testEmailTemplate } from '../services/emailTemplates.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePagination(req, defaultLimit = 20) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

/* ------------------------------- Statistiques ------------------------------ */

export const getStats = asyncHandler(async (req, res) => {
  const [
    users,
    totalEvents,
    publishedEvents,
    totalRsvps,
    pendingMessages,
    openReports,
    eventsByCategory,
  ] = await Promise.all([
    User.countDocuments(),
    Event.countDocuments(),
    Event.countDocuments({ status: EVENT_STATUS.PUBLISHED }),
    Rsvp.countDocuments(),
    GuestbookMessage.countDocuments({ status: GUESTBOOK_STATUS.PENDING }),
    Report.countDocuments({ status: 'open' }),
    Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        users,
        events: totalEvents,
        publishedEvents,
        rsvps: totalRsvps,
        pendingMessages,
        openReports,
        eventsByCategory: eventsByCategory.map((row) => ({
          category: row._id,
          count: row.count,
        })),
      },
    },
  });
});

/* --------------------------------- Users ---------------------------------- */

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const filter = {};
  const search = req.query.search?.trim();
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ email: rx }, { firstName: rx }, { lastName: rx }];
  }
  if (req.query.role) filter.role = req.query.role;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

export const blockUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    throw ApiError.badRequest('Vous ne pouvez pas vous bloquer vous-meme.', 'SELF_BLOCK');
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true },
  );
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');
  res.json({ success: true, data: { user } });
});

export const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');
  res.json({ success: true, data: { user } });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    throw ApiError.badRequest('Vous ne pouvez pas supprimer votre propre compte.', 'SELF_DELETE');
  }
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');

  const events = await Event.find({ ownerId: user._id });
  for (const event of events) {
    await eventService.deleteEvent(event);
  }
  await Notification.deleteMany({ userId: user._id });
  await user.deleteOne();

  res.json({ success: true, data: { message: 'Utilisateur et donnees associees supprimes.' } });
});

/* -------------------------------- Events ---------------------------------- */

export const listEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const search = req.query.search?.trim();
  if (search) filter.title = new RegExp(escapeRegex(search), 'i');

  const [events, total] = await Promise.all([
    Event.find(filter)
      .populate('ownerId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Event.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { events, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Evenement introuvable.');
  await eventService.deleteEvent(event);
  res.json({ success: true, data: { message: 'Evenement supprime.' } });
});

/* -------------------------------- Reports --------------------------------- */

export const listReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate('eventId', 'title slug status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

export const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true },
  ).populate('eventId', 'title slug status');
  if (!report) throw ApiError.notFound('Signalement introuvable.');
  res.json({ success: true, data: { report } });
});

/* ------------------------------ Categories -------------------------------- */

export const listCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ order: 1 });
  res.json({ success: true, data: { categories } });
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ success: true, data: { category } });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!category) throw ApiError.notFound('Categorie introuvable.');
  res.json({ success: true, data: { category } });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Categorie introuvable.');
  res.json({ success: true, data: { message: 'Categorie supprimee.' } });
});

/* ------------------------------- Templates -------------------------------- */

export const listTemplatesAdmin = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.categorySlug = req.query.category;
  const templates = await Template.find(filter).sort({ categorySlug: 1, order: 1 });
  res.json({ success: true, data: { templates } });
});

export const createTemplate = asyncHandler(async (req, res) => {
  const template = await Template.create(req.body);
  res.status(201).json({ success: true, data: { template } });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!template) throw ApiError.notFound('Template introuvable.');
  res.json({ success: true, data: { template } });
});

export const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findByIdAndDelete(req.params.id);
  if (!template) throw ApiError.notFound('Template introuvable.');
  res.json({ success: true, data: { message: 'Template supprime.' } });
});

/* ------------------------------ Email health ------------------------------ */

/**
 * Diagnostic email (admin uniquement). Renvoie l'etat de la configuration et,
 * si `to` est fourni, tente un envoi reel dont le resultat est rapporte sans
 * jamais exposer de secret.
 */
export const emailHealth = asyncHandler(async (req, res) => {
  const to = req.body?.to || req.user.email;

  const config = {
    provider: 'brevo',
    configured: env.brevo.enabled,
    from: env.brevo.from,
    fromName: env.brevo.fromName,
    replyTo: env.brevo.replyTo || null,
    clientUrl: env.clientUrl,
  };

  if (!env.brevo.enabled) {
    return res.json({
      success: true,
      data: {
        config,
        send: { attempted: false, ok: false, reason: 'BREVO_API_KEY non configuree.' },
      },
    });
  }

  const { subject, html, text } = testEmailTemplate({
    url: env.clientUrl,
    locale: 'fr',
  });

  try {
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      type: 'test',
    });
    return res.json({
      success: true,
      data: {
        config,
        send: {
          attempted: true,
          ok: !result?.skipped,
          to: maskEmail(to),
          providerMessageId: result?.messageId,
        },
      },
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error.message,
      code: 'EMAIL_SEND_FAILED',
      data: {
        config,
        send: { attempted: true, ok: false, to: maskEmail(to) },
      },
    });
  }
});

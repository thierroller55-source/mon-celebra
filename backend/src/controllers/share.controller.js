import { Event } from '../models/Event.js';
import { env } from '../config/env.js';
import { APP_NAME } from '../config/brand.js';
import { EVENT_STATUS, EVENT_VISIBILITY } from '../config/constants.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  SITE_DESCRIPTION,
  isSocialBot,
  renderShareHtml,
} from '../services/share.service.js';

function eventPageUrl(event, slug) {
  const language = ['fr', 'en', 'wo'].includes(event?.language) ? event.language : 'fr';
  return `${env.clientUrl}/${language}/e/${encodeURIComponent(slug)}`;
}

/**
 * Apercu Open Graph pour les robots sociaux.
 * - robot : HTML avec les balises OG (ou page neutre si evenement protege).
 * - navigateur : redirection vers la page publique de la SPA.
 */
export const getEventSharePage = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').trim().toLowerCase();
  const event = slug ? await Event.findOne({ slug }) : null;
  const pageUrl = eventPageUrl(event, slug);

  if (!isSocialBot(req.get('user-agent'))) {
    res.redirect(302, pageUrl);
    return;
  }

  const isPublished = event?.status === EVENT_STATUS.PUBLISHED;
  if (!isPublished) {
    res
      .status(404)
      .type('html')
      .send(
        renderShareHtml({
          title: APP_NAME,
          description: SITE_DESCRIPTION,
          pageUrl,
          robots: 'noindex, nofollow',
        }),
      );
    return;
  }

  const isProtected =
    event.visibility === EVENT_VISIBILITY.PRIVATE ||
    event.visibility === EVENT_VISIBILITY.PASSWORD;

  if (isProtected) {
    res
      .type('html')
      .send(
        renderShareHtml({
          title: APP_NAME,
          description: SITE_DESCRIPTION,
          pageUrl,
          robots: 'noindex, nofollow',
        }),
      );
    return;
  }

  res.type('html').send(
    renderShareHtml({
      title: event.title || APP_NAME,
      description: event.tagline || event.description || event.title,
      pageUrl,
      imageUrl: event.mainImage?.url || null,
      language: event.language,
      robots: 'index, follow',
    }),
  );
});

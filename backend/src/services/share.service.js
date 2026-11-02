import { APP_NAME } from '../config/brand.js';

// Robots des reseaux sociaux et messageries : ils lisent surtout les balises
// Open Graph de la reponse HTML, sans executer le JavaScript de la SPA.
const SOCIAL_BOT_PATTERN =
  /facebookexternalhit|facebot|whatsapp|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|pinterestbot|redditbot|mastodon|bluesky|embedly|iframely|googlebot|bingbot|duckduckbot|yandexbot|applebot|w3c_validator/i;

const OG_LOCALES = Object.freeze({
  fr: 'fr_FR',
  en: 'en_US',
  wo: 'wo_SN',
});

export const SITE_DESCRIPTION =
  "Créez et partagez une page interactive pour votre mariage, anniversaire ou baptême. Chaque moment mérite d'être célébré.";

export function isSocialBot(userAgent = '') {
  return SOCIAL_BOT_PATTERN.test(String(userAgent));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncate(value, maxLength) {
  const text = String(value ?? '').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/**
 * Page HTML minimale destinee aux apercus de partage (WhatsApp, Facebook...).
 * Elle ne contient que les metadonnees : les robots n'ont pas besoin de la SPA.
 */
export function renderShareHtml({
  title,
  description,
  pageUrl,
  imageUrl = null,
  language = 'fr',
  robots = 'index, follow',
}) {
  const safeTitle = escapeHtml(truncate(title || APP_NAME, 160));
  const safeDescription = escapeHtml(truncate(description || SITE_DESCRIPTION, 300));
  const safeUrl = escapeHtml(pageUrl);
  const safeImage = imageUrl ? escapeHtml(imageUrl) : null;
  const lang = ['fr', 'en', 'wo'].includes(language) ? language : 'fr';

  const meta = [
    `<meta property="og:site_name" content="${escapeHtml(APP_NAME)}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${safeTitle}">`,
    `<meta property="og:description" content="${safeDescription}">`,
    `<meta property="og:url" content="${safeUrl}">`,
    `<meta property="og:locale" content="${OG_LOCALES[lang]}">`,
    `<meta name="twitter:card" content="${safeImage ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${safeTitle}">`,
    `<meta name="twitter:description" content="${safeDescription}">`,
  ];

  if (safeImage) {
    meta.push(`<meta property="og:image" content="${safeImage}">`);
    meta.push(`<meta property="og:image:alt" content="${safeTitle}">`);
    meta.push(`<meta name="twitter:image" content="${safeImage}">`);
  }

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${safeTitle} — ${escapeHtml(APP_NAME)}</title>
<meta name="description" content="${safeDescription}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${safeUrl}">
${meta.join('\n')}
</head>
<body>
<p><a href="${safeUrl}">${safeTitle}</a></p>
<p>${safeDescription}</p>
</body>
</html>`;
}

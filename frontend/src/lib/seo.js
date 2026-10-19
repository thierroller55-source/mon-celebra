import { APP_NAME } from './brand.js';

const PUBLIC_BASE = (
  import.meta.env.VITE_PUBLIC_URL || 'https://mon-celebra.vercel.app'
).replace(/\/+$/, '');

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href, hreflang) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/** Applique les metadonnees SEO/Open Graph d'un evenement public. */
export function applyEventSeo(event) {
  const lang = ['fr', 'en', 'wo'].includes(event?.language) ? event.language : 'fr';
  const slug = event?.slug;
  const pageUrl = `${PUBLIC_BASE}/${lang}/e/${slug}`;
  const title = event?.title || APP_NAME;
  const description = event?.tagline || event?.description || title;

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:type', 'article');
  upsertMeta('property', 'og:url', pageUrl);
  upsertMeta('property', 'og:locale', lang);
  if (event?.mainImage?.url) upsertMeta('property', 'og:image', event.mainImage.url);

  upsertLink('canonical', pageUrl);
  ['fr', 'en', 'wo'].forEach((code) =>
    upsertLink('alternate', `${PUBLIC_BASE}/${code}/e/${slug}`, code),
  );
  upsertLink('alternate', `${PUBLIC_BASE}/e/${slug}`, 'x-default');

  const isPrivate = event?.visibility === 'password' || event?.visibility === 'private';
  upsertMeta('name', 'robots', isPrivate ? 'noindex, nofollow' : 'index, follow');
}

/** Remet les metadonnees par defaut (pages privees / non evenementielles). */
export function applyNoindex() {
  upsertMeta('name', 'robots', 'noindex, nofollow');
}

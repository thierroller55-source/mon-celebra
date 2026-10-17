export const LOCALES = ['fr', 'en', 'wo'];
export const DEFAULT_LOCALE = 'fr';

export const COOKIE_NAME = 'NEXT_LOCALE';
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LANGUAGE_NAMES = {
  fr: 'Français',
  en: 'English',
  wo: 'Wolof',
};

export const LOCALE_TAGS = {
  fr: 'fr-FR',
  en: 'en-US',
  wo: 'wo-SN',
};

export function isLocale(value) {
  return LOCALES.includes(value);
}

export function normalizeLocale(value) {
  if (!value) return null;
  const code = String(value).slice(0, 2).toLowerCase();
  return isLocale(code) ? code : null;
}

import { DEFAULT_LOCALE, LOCALE_TAGS, isLocale } from '../i18n/config.js';

/**
 * Noms wolof ecrits a la main (orthographe CLAD) car `Intl.DateTimeFormat`
 * ne fournit pas encore de donnees fiables pour la locale `wo`.
 */
export const WOLOF_DAYS = [
  'Dibéer',
  'Altine',
  'Talaata',
  'Àllarba',
  'Alxamis',
  'Àjjuma',
  'Gaawu',
];

export const WOLOF_MONTHS = [
  'Sanwiye',
  'Fewriye',
  'Mars',
  'Awril',
  'Mee',
  'Suwe',
  'Sulet',
  'Ut',
  'Sàttumbar',
  'Oktoobar',
  'Nowàmbar',
  'Desàmbar',
];

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatWolof(date, { withWeekday = false } = {}) {
  const parts = [date.getDate(), WOLOF_MONTHS[date.getMonth()], date.getFullYear()];
  const base = parts.join(' ');
  return withWeekday ? `${WOLOF_DAYS[date.getDay()]} ${base}` : base;
}

/**
 * Formate une date en respectant la locale active (fr, en, wo).
 *
 * @param {string|Date|null} value
 * @param {{ locale?: string, withWeekday?: boolean }} [options]
 */
export function formatDate(value, { locale = DEFAULT_LOCALE, withWeekday = false } = {}) {
  const date = toDate(value);
  if (!date) return '';
  const lang = isLocale(locale) ? locale : DEFAULT_LOCALE;

  if (lang === 'wo') return formatWolof(date, { withWeekday });

  try {
    return new Intl.DateTimeFormat(LOCALE_TAGS[lang] || lang, {
      weekday: withWeekday ? 'long' : undefined,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return formatWolof(date, { withWeekday });
  }
}

/** Heure courte (ex. 18:30) localisee. */
export function formatTime(value, { locale = DEFAULT_LOCALE } = {}) {
  const date = toDate(value);
  if (!date) return '';
  const lang = isLocale(locale) ? locale : DEFAULT_LOCALE;
  try {
    return new Intl.DateTimeFormat(LOCALE_TAGS[lang] || lang, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
}

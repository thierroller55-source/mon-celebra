import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, LOCALES } from './config.js';
import fr from './messages/fr.json';

/**
 * Le francais (langue par defaut et de repli) est charge de maniere statique.
 * Les autres langues sont chargees a la demande (bundle plus leger).
 */
export const LANGUAGE_LOADERS = {
  fr: () => Promise.resolve({ default: fr }),
  en: () => import('./messages/en.json'),
  wo: () => import('./messages/wo.json'),
};

const loaded = new Set([DEFAULT_LOCALE]);

/** Charge (une seule fois) le paquet de la langue demandee. */
export async function ensureLanguage(language) {
  const lang = LOCALES.includes(language) ? language : DEFAULT_LOCALE;
  if (loaded.has(lang)) return;
  const mod = await LANGUAGE_LOADERS[lang]();
  i18next.addResourceBundle(lang, 'translation', mod.default ?? mod, true, true);
  loaded.add(lang);
}

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES,
    resources: { [DEFAULT_LOCALE]: { translation: fr } },
    interpolation: { escapeValue: false, prefix: '{', suffix: '}' },
    returnNull: false,
    returnEmptyString: false,
    saveMissing: false,
    missingKeyHandler: (_lngs, ns, key) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[i18n] cle manquante : ${ns}.${key}`);
      }
    },
  });
}

/**
 * Traducteur lie a une langue precise (ex. langue de l'evenement), en
 * s'assurant que la ressource est chargee. Utilise pour l'affiche/QR.
 */
export async function translatorFor(language) {
  await ensureLanguage(language);
  return i18next.getFixedT(LOCALES.includes(language) ? language : DEFAULT_LOCALE);
}

export default i18next;

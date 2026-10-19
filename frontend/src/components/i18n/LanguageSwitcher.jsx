import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_NAMES } from '../../i18n/config.js';
import { useLocale } from '../../context/LocaleContext.jsx';

/**
 * Selecteur de langue accessible (clavier + lecteur d'ecran).
 * Les libelles restent dans leur propre langue (Français / English / Wolof)
 * et aucun drapeau n'est associe au wolof.
 */
export default function LanguageSwitcher({ className = '', variant = 'light' }) {
  const { locale, setLocale, locales } = useLocale();
  const { t } = useTranslation();

  const base =
    variant === 'dark'
      ? 'border-white/25 bg-white/10 text-white'
      : 'border-celebra-dark/15 bg-celebra-paper text-celebra-dark/70';

  return (
    <label
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${base} ${className}`}
    >
      <Globe size={15} aria-hidden="true" />
      <span className="sr-only">{t('common.chooseLanguage')}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        aria-label={t('common.chooseLanguage')}
        className="cursor-pointer bg-transparent text-sm focus:outline-none"
      >
        {locales.map((code) => (
          <option key={code} value={code} lang={code}>
            {LANGUAGE_NAMES[code]}
          </option>
        ))}
      </select>
    </label>
  );
}

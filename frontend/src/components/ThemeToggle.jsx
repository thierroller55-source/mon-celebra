import { Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext.jsx';

/** Bascule clair / sombre. `variant="dark"` pour un fond sombre. */
export default function ThemeToggle({ className = '', variant = 'light' }) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const base =
    variant === 'dark'
      ? 'border-white/25 bg-white/10 text-white'
      : 'border-celebra-dark/15 bg-celebra-paper text-celebra-dark/70';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t('common.toggleTheme')}
      aria-pressed={isDark}
      title={t('common.toggleTheme')}
      className={`inline-flex items-center justify-center rounded-lg border px-2 py-1.5 ${base} ${className}`}
    >
      {isDark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
    </button>
  );
}

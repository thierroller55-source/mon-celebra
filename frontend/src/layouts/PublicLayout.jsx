import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import { useLocalePath } from '../context/LocaleContext.jsx';
import LanguageSwitcher from '../components/i18n/LanguageSwitcher.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lp = useLocalePath();

  const handleLogout = async () => {
    await logout();
    navigate(lp('/'));
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-celebra-dark/10 bg-celebra-paper">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to={lp('/')} className="font-heading text-lg font-bold text-celebra-gold">
            {t('common.appName')}
          </Link>

          <nav className="flex flex-wrap items-center gap-2" aria-label={t('common.dashboard')}>
            {user ? (
              <>
                <Link to={lp('/dashboard')} className="btn-primary">
                  {t('common.mySpace')}
                </Link>
                <button type="button" className="btn-outline" onClick={handleLogout}>
                  {t('common.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to={lp('/dashboard')} className="btn-primary">
                  {t('common.createEvent')}
                </Link>
                <Link to={lp('/connexion')} className="btn-outline">
                  {t('common.login')}
                </Link>
              </>
            )}
            <a
              href="https://wa.me/221765711533?text=Bonjour%2C%20je%20souhaite%20avoir%20plus%20d%27informations%20sur%20votre%20site%20Mon%20Celebra."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-celebra-dark/10 text-green-600 hover:bg-celebra-gold/10"
              aria-label="Contacter sur WhatsApp"
              title="Contacter sur WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
            <LanguageSwitcher />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-celebra-dark/10 bg-celebra-paper py-6 text-center text-sm text-celebra-dark/60">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {t('common.appName')} — {t('common.footerTagline')}</p>
          <a
            href="https://wa.me/221765711533?text=Bonjour%2C%20je%20souhaite%20avoir%20plus%20d%27informations%20sur%20votre%20site%20Mon%20Celebra."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-celebra-gold hover:underline"
            aria-label="Contacter via WhatsApp"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Contacter sur WhatsApp
          </a>
        </div>
      </footer>
    </div>
  );
}

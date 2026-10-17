import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import { useLocalePath } from '../context/LocaleContext.jsx';
import LanguageSwitcher from '../components/i18n/LanguageSwitcher.jsx';

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
      <header className="sticky top-0 z-40 border-b border-celebra-dark/10 bg-white">
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
            <LanguageSwitcher />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-celebra-dark/10 bg-white py-6 text-center text-sm text-celebra-dark/60">
        &copy; {new Date().getFullYear()} {t('common.appName')} — {t('common.footerTagline')}
      </footer>
    </div>
  );
}

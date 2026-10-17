import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Plus, LogOut, Home, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useLocalePath } from '../context/LocaleContext.jsx';
import NotificationBell from '../components/notifications/NotificationBell.jsx';
import LanguageSwitcher from '../components/i18n/LanguageSwitcher.jsx';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lp = useLocalePath();

  const navItems = [
    { to: lp('/dashboard'), label: t('dashboard.title'), icon: LayoutDashboard, end: true },
    { to: lp('/dashboard/creer'), label: t('common.createEvent'), icon: Plus, end: false },
  ];

  const handleLogout = async () => {
    await logout();
    navigate(lp('/'));
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
      isActive ? 'bg-celebra-gold/10 font-medium text-celebra-gold' : 'text-celebra-dark/70 hover:bg-celebra-dark/5'
    }`;

  return (
    <div className="flex min-h-dvh flex-col bg-celebra-cream lg:flex-row">
      <aside className="border-b border-celebra-dark/10 bg-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to={lp('/')} className="font-heading text-lg font-bold text-celebra-gold">
            {t('common.appName')}
          </Link>
          <Link to={lp('/')} className="btn-outline lg:hidden" aria-label={t('common.home')}>
            <Home size={16} />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:gap-1 lg:p-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to={lp('/admin')} className={navClass}>
              <ShieldCheck size={16} />
              {t('common.admin')}
            </NavLink>
          )}
          <NavLink to={lp('/dashboard/compte')} className={navClass}>
            <User size={16} />
            {t('dashboard.account')}
          </NavLink>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-celebra-dark/10 bg-white px-4 py-3">
          <p className="truncate text-sm text-celebra-dark/70">
            {user?.firstName
              ? t('dashboard.greeting', { name: user.firstName })
              : t('dashboard.greetingGuest')}{' '}
            &#128075;
          </p>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSwitcher />
            {user?.role === 'admin' ? (
              <button type="button" onClick={handleLogout} className="btn-outline">
                <LogOut size={16} />
                {t('common.logout')}
              </button>
            ) : (
              <Link to={lp('/')} className="btn-outline">
                <Home size={16} />
                {t('common.home')}
              </Link>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

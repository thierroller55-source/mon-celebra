import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarDays,
  Flag,
  Layers,
  Palette,
  LogOut,
  Home,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { greetUser } from '../utils/greeting.js';
import { APP_NAME } from '../lib/brand.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

const navItems = [
  { to: '/admin', label: 'Vue d\u2019ensemble', icon: LayoutDashboard, end: true },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users, end: false },
  { to: '/inscription', label: 'Nouvel admin', icon: UserPlus, end: false },
  { to: '/admin/evenements', label: 'Evenements', icon: CalendarDays, end: false },
  { to: '/admin/signalements', label: 'Signalements', icon: Flag, end: false },
  { to: '/admin/categories', label: 'Categories', icon: Layers, end: false },
  { to: '/admin/templates', label: 'Templates', icon: Palette, end: false },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-celebra-cream lg:flex-row">
      <aside className="border-b border-celebra-dark/10 bg-celebra-night text-white lg:w-64 lg:shrink-0 lg:border-b-0">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/admin" className="font-heading text-lg font-bold text-celebra-gold">
            {APP_NAME} · Admin
          </Link>
          <Link to="/" className="btn-outline lg:hidden" aria-label="Retour a l'accueil">
            <Home size={16} />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:gap-1 lg:p-3" aria-label="Navigation admin">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm lg:w-full ${
                  isActive
                    ? 'bg-celebra-gold/20 font-medium text-celebra-gold'
                    : 'text-white/70 hover:bg-white/10'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-celebra-dark/10 bg-celebra-paper px-4 py-3">
          <p className="min-w-0 flex-1 truncate text-sm text-celebra-dark/70">
            {greetUser(user, { withLastName: true })}
            <span className="ml-2 rounded-full bg-celebra-gold/10 px-2 py-0.5 text-xs font-medium text-celebra-gold">
              Administrateur
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <button type="button" onClick={handleLogout} className="btn-outline shrink-0">
              <LogOut size={16} />
              Deconnexion
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

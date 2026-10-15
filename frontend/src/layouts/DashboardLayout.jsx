import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Plus, LogOut, Home, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { greetUser } from '../utils/greeting.js';
import NotificationBell from '../components/notifications/NotificationBell.jsx';

const navItems = [
  { to: '/dashboard', label: 'Mes evenements', icon: LayoutDashboard, end: true },
  { to: '/dashboard/creer', label: 'Creer un evenement', icon: Plus, end: false },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-celebra-cream lg:flex-row">
      <aside className="border-b border-celebra-dark/10 bg-white lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="font-heading text-lg font-bold text-celebra-gold">
            Mon Celebra
          </Link>
          <Link to="/" className="btn-outline lg:hidden" aria-label="Retour a l'accueil">
            <Home size={16} />
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:gap-1 lg:p-3" aria-label="Navigation tableau de bord">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-celebra-gold/10 font-medium text-celebra-gold'
                    : 'text-celebra-dark/70 hover:bg-celebra-dark/5'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-celebra-gold/10 font-medium text-celebra-gold'
                    : 'text-celebra-dark/70 hover:bg-celebra-dark/5'
                }`
              }
            >
              <ShieldCheck size={16} />
              Administration
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-celebra-dark/10 bg-white px-4 py-3">
          <p className="truncate text-sm text-celebra-dark/70">
            {user?.isGuest ? 'Bonjour' : greetUser(user)} &#128075;
          </p>
          <div className="flex items-center gap-2">
            <NotificationBell />
            {user?.role === 'admin' ? (
              <button type="button" onClick={handleLogout} className="btn-outline">
                <LogOut size={16} />
                Deconnexion
              </button>
            ) : (
              <Link to="/" className="btn-outline">
                <Home size={16} />
                Accueil
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

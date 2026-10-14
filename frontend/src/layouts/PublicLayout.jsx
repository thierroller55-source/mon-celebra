import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function PublicLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-celebra-dark/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="font-heading text-xl font-bold text-celebra-gold"
            aria-label="Mon Celebra, accueil"
          >
            Mon Celebra
          </Link>
          <nav className="flex items-center gap-2" aria-label="Navigation principale">
            {user ? (
              <>
                <Link to="/dashboard" className="btn-outline">
                  Tableau de bord
                </Link>
                <button type="button" onClick={handleLogout} className="btn-outline">
                  Deconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/connexion" className="btn-outline">
                  Connexion
                </Link>
                <Link to="/inscription" className="btn-primary">
                  Creer un compte
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-celebra-dark/10 bg-white py-6 text-center text-sm text-celebra-dark/60">
        &copy; {new Date().getFullYear()} Mon Celebra — Chaque moment merite d'etre
        celebre.
      </footer>
    </div>
  );
}

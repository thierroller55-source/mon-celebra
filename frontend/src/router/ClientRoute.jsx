import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { getErrorMessage } from '../services/api.js';

/**
 * Espace client : aucune inscription ni connexion requise. Une session invite
 * est ouverte automatiquement a la premiere visite pour rattacher les
 * evenements crees a ce navigateur.
 */
export default function ClientRoute() {
  const { user, loading, guest } = useAuth();
  const [starting, setStarting] = useState(true);
  const [error, setError] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      setStarting(false);
      return;
    }
    if (attempted.current) return;
    attempted.current = true;
    setStarting(true);
    guest()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setStarting(false));
  }, [loading, user, guest]);

  if (loading || starting) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-2 text-celebra-dark/60">
        <Loader2 className="animate-spin" size={20} />
        Preparation de votre espace...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
          Reessayer
        </button>
      </div>
    );
  }

  if (!user) return null;

  return <Outlet />;
}

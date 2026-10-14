import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mes evenements</h1>
          <p className="text-sm text-celebra-dark/60">
            Gerez vos invitations et suivez vos invites, {user?.firstName}.
          </p>
        </div>
        <Link to="/dashboard/creer" className="btn-primary">
          <Plus size={16} />
          Creer un evenement
        </Link>
      </div>

      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <p className="text-celebra-dark/70">
          Vous n'avez pas encore d'evenement.
        </p>
        <Link to="/dashboard/creer" className="btn-primary">
          Creer mon premier evenement
        </Link>
      </div>
    </div>
  );
}

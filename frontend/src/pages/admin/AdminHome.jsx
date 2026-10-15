import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  MessageSquare,
  Flag,
  Loader2,
} from 'lucide-react';
import { adminService } from '../../services/admin.service.js';
import { getErrorMessage } from '../../services/api.js';

const CARDS = [
  { key: 'users', label: 'Utilisateurs', icon: Users, to: '/admin/utilisateurs' },
  { key: 'events', label: 'Evenements', icon: CalendarDays, to: '/admin/evenements' },
  { key: 'publishedEvents', label: 'Publies', icon: CheckCircle2 },
  { key: 'rsvps', label: 'Confirmations RSVP', icon: ClipboardCheck },
  { key: 'pendingMessages', label: 'Messages en attente', icon: MessageSquare, to: '/admin/evenements' },
  { key: 'openReports', label: 'Signalements ouverts', icon: Flag, to: '/admin/signalements' },
];

export default function AdminHome() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminService
      .stats()
      .then((data) => active && setStats(data))
      .catch((err) => active && setError(getErrorMessage(err)));
    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-celebra-dark/60">
        <Loader2 className="animate-spin" size={20} />
        Chargement...
      </div>
    );
  }

  const maxCount = Math.max(1, ...stats.eventsByCategory.map((c) => c.count));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-1 text-2xl font-bold">Vue d&apos;ensemble</h1>
      <p className="mb-6 text-sm text-celebra-dark/60">
        Statistiques globales de la plateforme.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {CARDS.map(({ key, label, icon: Icon, to }) => {
          const content = (
            <div className="card flex items-center gap-3 p-4 transition-colors hover:border-celebra-gold/40">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-celebra-gold/10 text-celebra-gold">
                <Icon size={18} />
              </span>
              <div>
                <p className="text-2xl font-bold">{stats[key] ?? 0}</p>
                <p className="text-xs text-celebra-dark/50">{label}</p>
              </div>
            </div>
          );
          return to ? (
            <Link key={key} to={to}>
              {content}
            </Link>
          ) : (
            <div key={key}>{content}</div>
          );
        })}
      </div>

      <section className="card p-6">
        <h2 className="mb-4 font-semibold">Evenements par categorie</h2>
        {stats.eventsByCategory.length === 0 ? (
          <p className="text-sm text-celebra-dark/60">Aucun evenement.</p>
        ) : (
          <ul className="space-y-3">
            {stats.eventsByCategory.map((row) => (
              <li key={row.category} className="flex items-center gap-3 text-sm">
                <span className="w-32 shrink-0 capitalize text-celebra-dark/70">
                  {row.category}
                </span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-celebra-dark/5">
                  <span
                    className="block h-full rounded-full bg-celebra-gold"
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </span>
                <span className="w-8 text-right font-medium">{row.count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

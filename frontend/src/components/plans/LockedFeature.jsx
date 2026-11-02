import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LockedFeature({ title, description, actionLabel = 'Voir les offres', to = '/tarifs', className = '' }) {
  return (
    <div className={`card p-4 flex items-start gap-3 border border-celebra-gold/30 ${className}`}>
      <div className="mt-0.5 text-celebra-gold"><Lock size={18} /></div>
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {description && <p className="text-sm text-celebra-dark/70 mt-1">{description}</p>}
        <Link to={to} className="inline-flex mt-2 text-sm text-celebra-gold hover:underline">{actionLabel}</Link>
      </div>
    </div>
  );
}

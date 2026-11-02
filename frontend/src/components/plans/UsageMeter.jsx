export default function UsageMeter({ label, used, limit, className = '' }) {
  if (limit === null || limit === undefined) {
    return (
      <div className={`text-sm ${className}`}>
        <div className="flex items-center justify-between mb-1">
          <span>{label}</span>
          <span className="text-celebra-dark/60">Illimité</span>
        </div>
      </div>
    );
  }
  const pct = Math.min(100, Math.max(0, (used / limit) * 100));
  return (
    <div className={`text-sm ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span>{label}</span>
        <span className="text-celebra-dark/60">{used}/{limit}</span>
      </div>
      <div className="h-2 rounded-full bg-celebra-dark/10 overflow-hidden">
        <div className="h-full bg-celebra-gold" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

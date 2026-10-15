import { useEffect, useMemo, useState } from 'react';

function getTarget(date, startTime) {
  if (!date) return null;
  const iso = `${String(date).slice(0, 10)}T${startTime || '00:00'}:00`;
  const target = new Date(iso);
  return Number.isNaN(target.getTime()) ? null : target;
}

function diffParts(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export default function Countdown({ date, startTime, accent = '#B08D57' }) {
  const target = useMemo(() => getTarget(date, startTime), [date, startTime]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!target) return null;

  const remaining = target.getTime() - now;
  if (remaining <= 0) {
    return (
      <p className="text-center text-sm font-medium" style={{ color: accent }}>
        L&apos;evenement a commence. Bonne celebration !
      </p>
    );
  }

  const parts = diffParts(remaining);
  const items = [
    { value: parts.days, label: 'Jours' },
    { value: parts.hours, label: 'Heures' },
    { value: parts.minutes, label: 'Minutes' },
    { value: parts.seconds, label: 'Secondes' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="card flex min-w-[72px] flex-col items-center px-4 py-3"
        >
          <span className="text-2xl font-bold tabular-nums" style={{ color: accent }}>
            {item.value}
          </span>
          <span className="text-xs uppercase tracking-wide text-celebra-dark/50">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function PlanBadge({ plan, className = '' }) {
  const isPro = plan === 'pro';
  const isPass = plan === 'event_pass';
  if (!isPro && !isPass) {
    return <span className={`rounded-full bg-celebra-dark/5 px-2 py-0.5 text-xs text-celebra-dark/60 ${className}`}>Gratuit</span>;
  }
  return (
    <span className={`rounded-full bg-celebra-gold/15 px-2 py-0.5 text-xs text-celebra-gold ${className}`}>
      {isPro ? 'Pro' : 'Pass Événement'}
    </span>
  );
}

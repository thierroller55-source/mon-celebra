export default function PlanCard({ title, subtitle, priceFcfa, features = [], ctaLabel, onCta, highlighted = false, className = '' }) {
  const priceLabel = priceFcfa === null || priceFcfa === undefined ? 'Bientôt' : `${priceFcfa.toLocaleString('fr-FR')} FCFA`;
  return (
    <div className={`card p-6 flex flex-col ${highlighted ? 'ring-2 ring-celebra-gold' : ''} ${className}`}>
      {highlighted && <span className="self-start mb-2 rounded-full bg-celebra-gold/15 px-2 py-0.5 text-xs text-celebra-gold">Le plus choisi</span>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="text-sm text-celebra-dark/70 mt-1">{subtitle}</p>}
      <p className="mt-3 text-2xl font-bold">{priceLabel}</p>
      <ul className="mt-4 space-y-2 text-sm flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-celebra-gold" />{f}</li>
        ))}
      </ul>
      {ctaLabel && (
        <button className={highlighted ? 'btn-primary mt-4' : 'btn-outline mt-4'} onClick={onCta}>{ctaLabel}</button>
      )}
    </div>
  );
}

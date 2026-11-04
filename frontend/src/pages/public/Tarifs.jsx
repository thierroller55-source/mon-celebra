import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PLAN_CATALOG, PUBLIC_PLAN_IDS } from '../../lib/plans.js';
import PlanCard from '../../components/plans/PlanCard.jsx';
import UpgradeDialog from '../../components/plans/UpgradeDialog.jsx';
import { useNavigate } from 'react-router-dom';

const FAQ = [
  { q: 'Que se passe-t-il à la fin de mon Pass ?', a: "À l'expiration, une période de grâce de 30 jours s'applique, puis les limites du plan gratuit reprennent. Aucune donnée n'est supprimée ; les fonctions premium se verrouillent." },
  { q: 'Mes invités doivent-ils payer ?', a: "Non. Les invités ne sont jamais bloqués : une confirmation de présence est toujours enregistrée." },
  { q: "Puis-je changer d'offre ?", a: "Oui. Vous pouvez passer à une autre formule à tout moment. L'activation se fait après vérification du paiement par l'administrateur." },
  { q: 'Comment payer ?', a: 'Paiement par Wave ou Orange Money. Un code de référence vous est fourni lors de la demande, à indiquer lors du paiement. Activation après vérification.' },
  { q: 'Mes données sont-elles supprimées ?', a: "Non. Aucune donnée n'est supprimée à l'expiration. Seules les fonctions premium sont verrouillées jusqu'à réactivation." },
];

export default function Tarifs() {
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState('event_pass');

  const plans = useMemo(() => PUBLIC_PLAN_IDS.map((id) => PLAN_CATALOG[id]).filter(Boolean), []);

  const comparisonRows = [
    ['Portée', 'Compte', 'Un événement', 'Compte'],
    ['Événements actifs', '1', '1 par pass', '50 (usage raisonnable)'],
    ['Modèles', 'Base', 'Tous', 'Tous + sur mesure'],
    ['Photos par événement', '5', '20', '20'],
    ['RSVP', 'Simple (liste + total)', 'Avancé (export CSV, rappels, statistiques)', 'Idem'],
    ["Livre d'or", '10 messages', 'Illimité', 'Illimité'],
    ['Marque « Créé avec Célébra »', 'Visible', 'Retirée', 'Retirée + logo du client'],
    ['QR code personnalisé', 'Non', 'Oui', 'Oui'],
    ["Durée en ligne", '3 mois après la date', '12 mois', "Tant que proUntil est valide"],
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Des tarifs simples pour chaque événement</h1>
        <p className="mt-2 text-celebra-dark/70">Commencez gratuitement. Passez au Premium quand vous êtes prêt.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const highlighted = plan.id === 'event_pass';
          const price = plan.priceFcfa === null ? null : plan.priceFcfa;
          let ctaLabel = 'Commencer gratuitement';
          if (plan.id === 'event_pass') ctaLabel = 'Choisir le Pass';
          if (plan.id === 'pro') ctaLabel = 'Nous contacter';
          return (
            <PlanCard
              key={plan.id}
              title={plan.id === 'free' ? 'Gratuit' : plan.id === 'event_pass' ? 'Pass Événement' : 'Pro'}
              subtitle={plan.id === 'free' ? 'Pour découvrir Célébra' : plan.id === 'event_pass' ? 'Pour votre mariage, baptême ou anniversaire' : 'Pour les organisateurs, photographes et salles de fêtes'}
              priceFcfa={price}
              highlighted={highlighted}
              ctaLabel={ctaLabel}
              onCta={() => {
                if (plan.id === 'free') {
                  navigate('/dashboard/creer');
                  return;
                }
                if (plan.id === 'event_pass') {
                  setUpgradePlan('event_pass');
                  setUpgradeOpen(true);
                  return;
                }
                if (plan.id === 'pro') {
                  setUpgradePlan('pro');
                  setUpgradeOpen(true);
                  return;
                }
              }}
              features={[
                plan.id === 'free' ? '1 événement actif' : plan.id === 'event_pass' ? '1 événement par pass' : '50 événements actifs (usage raisonnable)',
                `${plan.limits.maxPhotosPerEvent} photos par événement`,
                plan.features.advancedRsvp ? 'RSVP avancé' : 'RSVP simple',
                plan.limits.maxGuestbookMessages === null ? "Livre d'or illimité" : `Livre d'or ${plan.limits.maxGuestbookMessages} messages`,
                plan.features.removeBranding ? 'Sans marque « Créé avec Célébra »' : 'Marque « Créé avec Célébra » visible',
                plan.features.customQr ? 'QR code personnalisé' : 'QR code non personnalisé',
              ]}
            />
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Tableau comparatif</h2>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-celebra-dark/10">
                <th className="text-left py-2">Fonctionnalité</th>
                <th className="text-left py-2">Gratuit</th>
                <th className="text-left py-2">Pass Événement</th>
                <th className="text-left py-2">Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={i} className="border-b border-celebra-dark/5">
                  {row.map((cell, j) => (
                    <td key={j} className="py-2">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-3">
          {['Gratuit', 'Pass Événement', 'Pro'].map((name, col) => (
            <div key={name} className="card p-4">
              <h3 className="font-semibold mb-2">{name}</h3>
              <dl className="space-y-1 text-sm">
                {comparisonRows.map((row, i) => (
                  <div key={i} className="flex justify-between gap-2">
                    <dt className="text-celebra-dark/70">{row[0]}</dt>
                    <dd>{row[col+1]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 card p-4 text-sm">
        <p className="font-medium">Paiement</p>
        <p className="text-celebra-dark/70">Wave et Orange Money. Activation après vérification de votre paiement.</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">FAQ</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details key={i} className="card p-4">
              <summary className="cursor-pointer font-medium">{item.q}</summary>
              <p className="mt-2 text-sm text-celebra-dark/70">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 text-center">
        <h2 className="text-xl font-semibold">Prêt à commencer ?</h2>
        <p className="text-celebra-dark/70 mt-1">Commencez gratuitement. Passez au Premium quand vous êtes prêt.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to="/dashboard/creer" className="btn-primary">Créer un événement</Link>
          <Link to="/contact" className="btn-outline">Contact</Link>
        </div>
      </section>
    <UpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} planRequested={upgradePlan} />
  </div>
);
}

export function getTarifsMetadata(locale = 'fr') {
  const base = 'https://mon-celebra.vercel.app';
  return {
    title: 'Des tarifs simples pour chaque événement | Mon Célébra',
    description: 'Commencez gratuitement. Passez au Premium quand vous êtes prêt. Wave et Orange Money.',
    openGraph: {
      title: 'Des tarifs simples pour chaque événement | Mon Célébra',
      description: 'Commencez gratuitement. Passez au Premium quand vous êtes prêt.',
      url: `${base}/${locale}/tarifs`,
      type: 'website',
    },
  };
}

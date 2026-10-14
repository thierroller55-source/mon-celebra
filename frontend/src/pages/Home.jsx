import { Link } from 'react-router-dom';
import { MapPin, QrCode, Heart, Users } from 'lucide-react';
import { MVP_CATEGORIES, FUTURE_CATEGORIES } from '../utils/constants.js';

const features = [
  {
    icon: QrCode,
    title: 'QR Code & lien unique',
    text: "Chaque evenement possede son adresse et un QR code a mettre sur l'affiche.",
  },
  {
    icon: MapPin,
    title: 'Localisation & itineraire',
    text: 'Le lieu exact, la carte et un bouton pour lancer la navigation.',
  },
  {
    icon: Users,
    title: 'RSVP & livre d\'or',
    text: 'Vos invites confirment leur presence et laissent un message.',
  },
  {
    icon: Heart,
    title: 'Galerie & souvenirs',
    text: 'Rassemblez les photos et racontez les moments forts.',
  },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto w-full max-w-6xl px-4 py-14 text-center sm:py-20">
        <p className="mb-3 inline-block rounded-full bg-celebra-gold/10 px-4 py-1 text-sm font-medium text-celebra-gold">
          Invitations numeriques interactives
        </p>
        <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-tight sm:text-5xl">
          Chaque moment merite d'etre celebre.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-celebra-dark/70 sm:text-lg">
          Creez une page web unique pour votre mariage, anniversaire ou bapteme.
          Partagez-la par lien ou QR code et offrez a vos invites une experience
          memorable.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/inscription" className="btn-primary px-6 py-3 text-base">
            Creer mon evenement
          </Link>
          <Link to="/connexion" className="btn-outline px-6 py-3 text-base">
            J'ai deja un compte
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-14">
        <h2 className="mb-6 text-center text-2xl font-bold">Choisissez votre evenement</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {MVP_CATEGORIES.map((category) => (
            <div
              key={category.slug}
              className="card flex flex-col items-center gap-3 p-6 text-center"
            >
              <span className="text-4xl" aria-hidden="true">
                {category.emoji}
              </span>
              <h3 className="text-lg font-semibold">{category.name}</h3>
              <Link to="/inscription" className="btn-outline mt-2 w-full">
                Commencer
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-celebra-dark/60">
          Et bientot :{' '}
          {FUTURE_CATEGORIES.map((c) => c.name).join(' · ')}
        </p>
      </section>

      <section className="border-t border-celebra-dark/10 bg-white py-14">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">
            Tout ce qu'il faut pour reussir votre evenement
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex flex-col items-start gap-3">
                <span className="rounded-lg bg-celebra-gold/10 p-3 text-celebra-gold">
                  <Icon size={22} />
                </span>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="text-sm text-celebra-dark/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

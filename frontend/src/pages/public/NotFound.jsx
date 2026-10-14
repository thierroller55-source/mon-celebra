import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-heading text-5xl font-bold text-celebra-gold">404</p>
      <h1 className="text-xl font-semibold">Page introuvable</h1>
      <p className="text-sm text-celebra-dark/70">
        La page que vous cherchez n'existe pas ou a ete deplacee.
      </p>
      <Link to="/" className="btn-primary">
        Retour a l'accueil
      </Link>
    </div>
  );
}

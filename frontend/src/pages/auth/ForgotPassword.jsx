import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/auth.service.js';
import { getErrorMessage } from '../../services/api.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setError('Veuillez saisir une adresse email valide.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="card space-y-3 p-6 text-center">
          <h1 className="text-xl font-bold">Demande envoyee</h1>
          <p className="text-sm text-celebra-dark/70">
            Si un compte existe pour <strong>{email}</strong>, un lien de
            reinitialisation vient d&apos;etre envoye.
          </p>
          <Link to="/connexion" className="btn-primary w-full">
            Retour a la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-2 text-center text-2xl font-bold">Mot de passe oublie</h1>
      <p className="mb-6 text-center text-sm text-celebra-dark/60">
        Saisissez votre email pour recevoir un lien de reinitialisation.
      </p>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
        <div>
          <label htmlFor="email" className="label">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Envoi...' : 'Envoyer le lien'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-celebra-dark/70">
        <Link to="/connexion" className="font-medium text-celebra-gold">
          Retour a la connexion
        </Link>
      </p>
    </div>
  );
}

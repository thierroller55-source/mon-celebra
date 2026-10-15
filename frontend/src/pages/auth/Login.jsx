import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getErrorMessage } from '../../services/api.js';
import PasswordField from '../../components/auth/PasswordField.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!EMAIL_RE.test(form.email.trim())) {
      return 'Veuillez saisir une adresse email valide.';
    }
    if (!form.password) {
      return 'Le mot de passe est obligatoire.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const signedIn = await login({ email: form.email.trim(), password: form.password });
      navigate(signedIn?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">Connexion administrateur</h1>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
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
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Mot de passe"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={handleChange}
        />

        <div className="text-right">
          <Link to="/mot-de-passe-oublie" className="text-sm font-medium text-celebra-gold">
            Mot de passe oublie ?
          </Link>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-celebra-dark/70">
        Espace client ?{' '}
        <Link to="/dashboard" className="font-medium text-celebra-gold">
          Creer un evenement sans compte
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-celebra-dark/70">
        <Link to="/inscription" className="font-medium text-celebra-gold">
          Creer un compte administrateur
        </Link>
      </p>
    </div>
  );
}

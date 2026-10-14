import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { getErrorMessage } from '../../services/api.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return 'Le prenom et le nom sont obligatoires.';
    }
    if (!EMAIL_RE.test(form.email)) {
      return 'Veuillez saisir une adresse email valide.';
    }
    if (form.password.length < 8) {
      return 'Le mot de passe doit contenir au moins 8 caracteres.';
    }
    if (form.password !== form.confirmPassword) {
      return 'Les mots de passe ne correspondent pas.';
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
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">Creer un compte</h1>

      {error && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="label">
              Prenom
            </label>
            <input
              id="firstName"
              name="firstName"
              className="input"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="label">
              Nom
            </label>
            <input
              id="lastName"
              name="lastName"
              className="input"
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">
            Adresse email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="password" className="label">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={handleChange}
          />
          <p className="mt-1 text-xs text-celebra-dark/50">
            8 caracteres minimum.
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="input"
            autoComplete="new-password"
            required
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creation...' : 'Creer mon compte'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-celebra-dark/70">
        Deja inscrit ?{' '}
        <Link to="/connexion" className="font-medium text-celebra-gold">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

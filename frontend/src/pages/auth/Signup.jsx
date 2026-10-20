import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { getErrorMessage } from '../../services/api.js';
import PasswordField from '../../components/auth/PasswordField.jsx';
import {
  passwordChecks,
  passwordScore,
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from '../../utils/password.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRENGTH_LABELS = ['Tres faible', 'Faible', 'Moyen', 'Bon', 'Tres bon'];
const STRENGTH_COLORS = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-500'];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const checks = passwordChecks(form.password);
  const score = passwordScore(form.password);
  const showMeter = form.password.length > 0;

  const validate = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return 'Le prenom et le nom sont obligatoires.';
    }
    if (!EMAIL_RE.test(form.email)) {
      return 'Veuillez saisir une adresse email valide.';
    }
    if (!isStrongPassword(form.password)) {
      return PASSWORD_POLICY_MESSAGE;
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
      await signup({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      navigate(redirect || '/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-2 text-center text-2xl font-bold">Creer mon compte</h1>
      <p className="mb-6 text-center text-sm text-celebra-dark/60">
        Un compte vous permet de confirmer votre presence aux evenements.
      </p>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
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
          <label htmlFor="phone" className="label">
            Telephone
          </label>
          <input
            id="phone"
            name="phone"
            className="input"
            autoComplete="tel"
            placeholder="+221 77 123 45 67"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <PasswordField
          id="password"
          name="password"
          label="Mot de passe"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={handleChange}
        >
          {showMeter && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-celebra-dark/10">
                  <div
                    className={`h-full rounded-full transition-all ${STRENGTH_COLORS[score - 1] || ''}`}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
                <span className="w-20 text-right text-xs text-celebra-dark/60">
                  {STRENGTH_LABELS[score - 1] || ''}
                </span>
              </div>
              <ul className="grid gap-1">
                {checks.map((rule) => (
                  <li
                    key={rule.key}
                    className={`flex items-center gap-1.5 text-xs ${
                      rule.ok ? 'text-green-600' : 'text-celebra-dark/50'
                    }`}
                  >
                    {rule.ok ? <Check size={13} /> : <X size={13} />}
                    {rule.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </PasswordField>

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={handleChange}
        >
          {form.confirmPassword.length > 0 && (
            <p
              className={`mt-1 text-xs ${
                form.password === form.confirmPassword ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {form.password === form.confirmPassword
                ? 'Les mots de passe correspondent.'
                : 'Les mots de passe ne correspondent pas.'}
            </p>
          )}
        </PasswordField>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creation...' : 'Creer mon compte'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-celebra-dark/70">
        Deja un compte ?{' '}
        <Link
          to={`/connexion${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
          className="font-medium text-celebra-gold"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}

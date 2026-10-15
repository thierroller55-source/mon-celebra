import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { authService } from '../../services/auth.service.js';
import { getErrorMessage } from '../../services/api.js';
import PasswordField from '../../components/auth/PasswordField.jsx';
import {
  passwordChecks,
  passwordScore,
  isStrongPassword,
  PASSWORD_POLICY_MESSAGE,
} from '../../utils/password.js';

const STRENGTH_LABELS = ['Tres faible', 'Faible', 'Moyen', 'Bon', 'Tres bon'];
const STRENGTH_COLORS = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-lime-500', 'bg-green-500'];

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const checks = passwordChecks(form.password);
  const score = passwordScore(form.password);
  const showMeter = form.password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(form.password)) {
      setError(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await authService.resetPassword(token, form.password);
      navigate('/connexion', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">Nouveau mot de passe</h1>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
        <PasswordField
          id="password"
          name="password"
          label="Nouveau mot de passe"
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
          {submitting ? 'Mise a jour...' : 'Reinitialiser le mot de passe'}
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

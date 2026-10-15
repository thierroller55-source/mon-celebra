import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { userService } from '../../services/user.service.js';
import { getErrorMessage } from '../../services/api.js';
import { authService } from '../../services/auth.service.js';

export default function MonCompte() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await userService.updateMe({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });
      setUser(updated);
      setSuccess('Profil mis à jour avec succès.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (user?.emailVerified) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await authService.resendVerification();
      setSuccess('Email de vérification renvoyé.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mon compte</h1>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="alert" className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="label">Prénom</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              className="input"
              value={form.firstName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="label">Nom</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              className="input"
              value={form.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="label">Adresse email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            value={form.email}
            disabled
            readOnly
          />
          <p className="mt-1 text-xs text-celebra-dark/60">
            {user?.emailVerified ? 'Email vérifié ✓' : 'Email non vérifié'}
            {!user?.emailVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={sending}
                className="ml-2 font-medium text-celebra-gold hover:underline"
              >
                {sending ? 'Envoi...' : 'Renvoyer le lien de vérification'}
              </button>
            )}
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="label">Téléphone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="input"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <a href="/mot-de-passe-oublie" className="btn-outline">
            Changer mon mot de passe
          </a>
        </div>
      </form>
    </div>
  );
}

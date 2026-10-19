import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';
import { useLocale } from '../../context/LocaleContext.jsx';
import { userService } from '../../services/user.service.js';
import { getErrorMessage } from '../../services/api.js';
import { authService } from '../../services/auth.service.js';
import { LANGUAGE_NAMES } from '../../i18n/config.js';

const EMPTY_PASSWORD = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function MonCompte() {
  const { user, setUser } = useAuth();
  const { t } = useTranslation();
  const { locale, setLocale, locales } = useLocale();

  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sending, setSending] = useState(false);

  const [passwords, setPasswords] = useState(EMPTY_PASSWORD);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        email: user.pendingEmail || user.email || '',
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
      const { user: updated, emailChangeRequested } = await userService.updateMe({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        language: locale,
        email: form.email,
      });
      setUser(updated);
      setSuccess(
        emailChangeRequested
          ? t('account.emailChangeRequested', { email: form.email })
          : t('account.saved'),
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords((p) => ({ ...p, [e.target.name]: e.target.value }));
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError(t('account.passwordMismatch'));
      return;
    }

    setSavingPassword(true);
    try {
      await userService.changePassword({
        currentPassword: passwords.currentPassword || undefined,
        newPassword: passwords.newPassword,
      });
      setPasswords(EMPTY_PASSWORD);
      setPasswordSuccess(t('account.passwordChanged'));
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResendVerification = async () => {
    if (user?.emailVerified) return;
    setSending(true);
    setError('');
    setSuccess('');
    try {
      await authService.resendVerification();
      setSuccess(t('account.verificationSent'));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t('account.title')}</h1>

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
            <label htmlFor="firstName" className="label">
              {t('account.firstName')}
            </label>
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
            <label htmlFor="lastName" className="label">
              {t('account.lastName')}
            </label>
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
          <label htmlFor="email" className="label">
            {t('account.email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            value={form.email}
            onChange={handleChange}
          />
          <p className="mt-1 text-xs text-celebra-dark/60">
            {user?.emailVerified ? t('account.emailVerified') : t('account.emailNotVerified')}
            {!user?.emailVerified && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={sending}
                className="ml-2 font-medium text-celebra-gold hover:underline"
              >
                {sending ? t('account.sending') : t('account.resendVerification')}
              </button>
            )}
          </p>
          {user?.pendingEmail && (
            <p className="mt-1 text-xs text-amber-700">
              {t('account.emailPending', { email: user.pendingEmail })}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="label">
            {t('account.phone')}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="input"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label htmlFor="language" className="label">
            {t('account.language')}
          </label>
          <select
            id="language"
            className="input"
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
          >
            {locales.map((code) => (
              <option key={code} value={code} lang={code}>
                {LANGUAGE_NAMES[code]}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-celebra-dark/60">{t('account.languageHint')}</p>
        </div>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? t('editor.submitting') : t('common.save')}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="card mt-6 space-y-4 p-6">
        <h2 className="text-lg font-semibold">{t('account.passwordTitle')}</h2>

        {passwordError && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {passwordError}
          </p>
        )}
        {passwordSuccess && (
          <p role="alert" className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            {passwordSuccess}
          </p>
        )}

        {user?.isGuest ? (
          <p className="text-sm text-celebra-dark/60">{t('account.setPasswordHint')}</p>
        ) : (
          <div>
            <label htmlFor="currentPassword" className="label">
              {t('account.currentPassword')}
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              className="input"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="newPassword" className="label">
              {t('account.newPassword')}
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              className="input"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="label">
              {t('account.confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="input"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
            />
          </div>
        </div>

        <button type="submit" className="btn-outline" disabled={savingPassword}>
          {savingPassword ? t('editor.submitting') : t('account.changePassword')}
        </button>
      </form>
    </div>
  );
}

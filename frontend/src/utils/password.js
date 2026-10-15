/**
 * Politique de mot de passe partagee cote client (doit rester alignee avec
 * backend/src/validators/auth.schema.js).
 */
export const PASSWORD_RULES = [
  { key: 'length', label: 'Au moins 8 caracteres', test: (p) => p.length >= 8 },
  { key: 'lower', label: 'Une minuscule (a-z)', test: (p) => /[a-z]/.test(p) },
  { key: 'upper', label: 'Une majuscule (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'digit', label: 'Un chiffre (0-9)', test: (p) => /[0-9]/.test(p) },
  {
    key: 'special',
    label: 'Un caractere special (!@#$...)',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export function passwordChecks(password = '') {
  return PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(password) }));
}

export function isStrongPassword(password = '') {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

/** Nombre de regles satisfaites (0 a 5) — utile pour une jauge de force. */
export function passwordScore(password = '') {
  return PASSWORD_RULES.filter((rule) => rule.test(password)).length;
}

export const PASSWORD_POLICY_MESSAGE =
  'Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special.';

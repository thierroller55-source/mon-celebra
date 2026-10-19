import { z } from 'zod';

const email = z
  .string({ required_error: "L'email est obligatoire." })
  .trim()
  .toLowerCase()
  .email('Adresse email invalide.');

/**
 * Politique de mot de passe forte appliquee a l'inscription et a la
 * reinitialisation : au moins 8 caracteres avec minuscule, majuscule,
 * chiffre et caractere special. Ne pas appliquer au login pour ne pas
 * bloquer les comptes existants.
 */
export const PASSWORD_POLICY_MESSAGE =
  'Le mot de passe doit contenir au moins 8 caracteres, une majuscule, une minuscule, un chiffre et un caractere special.';

const password = z
  .string({ required_error: 'Le mot de passe est obligatoire.' })
  .min(8, 'Le mot de passe doit contenir au moins 8 caracteres.')
  .max(128, 'Le mot de passe est trop long.')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule.')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule.')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.')
  .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractere special.');

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'Le prenom est obligatoire.').max(60),
  lastName: z.string().trim().min(1, 'Le nom est obligatoire.').max(60),
  email,
  password,
  phone: z.string().trim().max(30).optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string({ required_error: 'Le mot de passe est obligatoire.' }).min(1),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password });

export const verifyEmailSchema = z.object({
  token: z.string({ required_error: 'Le jeton est obligatoire.' }).trim().min(1, 'Le jeton est obligatoire.'),
});

export const updateMeSchema = z
  .object({
    firstName: z.string().trim().min(1).max(60).optional(),
    lastName: z.string().trim().min(1).max(60).optional(),
    phone: z.string().trim().max(30).optional(),
    language: z.enum(['fr', 'en', 'wo']).optional(),
    email: email.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Aucune donnee a mettre a jour.',
  });

export const changePasswordSchema = z.object({
  currentPassword: z.string().max(128).optional(),
  newPassword: password,
});

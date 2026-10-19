import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendEmailVerification } from '../services/emailVerification.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');
  res.json({ success: true, data: user.toJSON() });
});

/**
 * Met a jour le profil. Un changement d'email ne prend effet qu'apres
 * confirmation : l'adresse est stockee dans `pendingEmail` et un lien de
 * verification est envoye a la nouvelle adresse.
 */
export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');

  const { firstName, lastName, phone, language, email } = req.body;

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (language !== undefined) user.language = language;

  let emailChangeRequested = false;
  if (email && email !== user.email) {
    const taken = await User.findOne({
      _id: { $ne: user._id },
      $or: [{ email }, { pendingEmail: email }],
    });
    if (taken) {
      throw ApiError.conflict('Un compte existe deja avec cet email.', 'EMAIL_TAKEN');
    }
    user.pendingEmail = email;
    emailChangeRequested = true;
  }

  await user.save({ validateBeforeSave: false });

  if (emailChangeRequested) {
    await sendEmailVerification(user, email);
  }

  res.json({
    success: true,
    data: { user: user.toJSON(), emailChangeRequested },
  });
});

/**
 * Change le mot de passe du compte connecte. Le mot de passe actuel est exige
 * pour un compte classique ; un invité (mot de passe aleatoire inconnu) peut
 * definir son premier mot de passe sans le fournir.
 */
export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) throw ApiError.notFound('Utilisateur introuvable.');

  const { currentPassword, newPassword } = req.body;

  if (!user.isGuest) {
    const valid = currentPassword ? await user.comparePassword(currentPassword) : false;
    if (!valid) {
      throw ApiError.unauthorized('Mot de passe actuel incorrect.', 'INVALID_CURRENT_PASSWORD');
    }
  }

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  res.json({ success: true, data: { message: 'Mot de passe mis a jour.' } });
});

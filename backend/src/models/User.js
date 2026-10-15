import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, LANGUAGES } from '../config/constants.js';
import { imageSchema } from './shared.js';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, required: true, trim: true, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, maxlength: 30 },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    language: { type: String, enum: LANGUAGES, default: 'fr' },
    avatar: { type: imageSchema, default: undefined },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    isGuest: { type: Boolean, default: false, index: true },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.passwordHash;
  delete obj.resetTokenHash;
  delete obj.resetTokenExpiresAt;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);

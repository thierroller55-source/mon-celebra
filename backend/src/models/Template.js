import mongoose from 'mongoose';

/**
 * Template d'affiche / page. `componentKey` pointe vers un composant du
 * registre frontend (frontend/src/templates/registry.js).
 */
const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    categorySlug: { type: String, required: true, lowercase: true, trim: true, index: true },
    componentKey: { type: String, required: true, trim: true },
    thumbnail: { type: String, default: null },
    layout: { type: mongoose.Schema.Types.Mixed, default: {} },
    isPremium: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Template = mongoose.model('Template', templateSchema);

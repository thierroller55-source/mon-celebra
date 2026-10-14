import mongoose from 'mongoose';

/**
 * Categorie d'evenement. Extensible depuis le dashboard admin sans refonte :
 * ajouter un document suffit. Le frontend lit la liste via l'API.
 */
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    icon: { type: String, default: 'sparkles' },
    description: { type: String, trim: true, maxlength: 300 },
    fieldsSchema: { type: mongoose.Schema.Types.Mixed, default: {} },
    isMvp: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Category = mongoose.model('Category', categorySchema);

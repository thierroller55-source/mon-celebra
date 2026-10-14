import mongoose from 'mongoose';
import { PLACE_TYPES } from '../config/constants.js';

/** Image stockee : url publique + identifiant du stockage (local/Cloudinary). */
export const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
  },
  { _id: false },
);

/** Point GeoJSON [longitude, latitude] pour index 2dsphere. */
export const geoSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined },
  },
  { _id: false },
);

/** Lieu (lieu principal ou lieu secondaire d'un evenement). */
export const locationSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 120 },
    type: { type: String, enum: PLACE_TYPES, default: 'autre' },
    name: { type: String, trim: true, maxlength: 160 },
    address: { type: String, trim: true, maxlength: 300 },
    latitude: { type: Number },
    longitude: { type: Number },
    geo: { type: geoSchema, default: undefined },
    time: { type: String, trim: true },
  },
  { _id: true },
);

/** Etape de programme (heure + intitule). */
export const programItemSchema = new mongoose.Schema(
  {
    time: { type: String, trim: true },
    title: { type: String, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 500 },
  },
  { _id: true },
);

/**
 * Reconstruit la position GeoJSON a partir de latitude/longitude
 * si elle n'a pas ete fournie explicitement.
 */
export function syncGeo(location) {
  if (!location) return;
  const { latitude, longitude } = location;
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    location.geo = { type: 'Point', coordinates: [longitude, latitude] };
  }
}

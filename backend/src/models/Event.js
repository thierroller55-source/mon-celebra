import mongoose from 'mongoose';
import {
  EVENT_STATUS,
  EVENT_VISIBILITY,
  DEFAULT_DESIGN,
} from '../config/constants.js';
import {
  imageSchema,
  locationSchema,
  programItemSchema,
  syncGeo,
} from './shared.js';

const galleryItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    order: { type: Number, default: 0 },
    caption: { type: String, trim: true, maxlength: 200 },
  },
  { _id: true },
);

const designSchema = new mongoose.Schema(
  {
    primaryColor: { type: String, default: DEFAULT_DESIGN.primaryColor },
    secondaryColor: { type: String, default: DEFAULT_DESIGN.secondaryColor },
    fontHeading: { type: String, default: DEFAULT_DESIGN.fontHeading },
    fontBody: { type: String, default: DEFAULT_DESIGN.fontBody },
    background: { type: String, default: DEFAULT_DESIGN.background },
    coverImage: { type: imageSchema, default: undefined },
    customTexts: {
      headline: { type: String, trim: true, maxlength: 160 },
      subtitle: { type: String, trim: true, maxlength: 160 },
    },
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    rsvpEnabled: { type: Boolean, default: true },
    guestbookEnabled: { type: Boolean, default: true },
    guestbookModeration: { type: Boolean, default: true },
    countdownEnabled: { type: Boolean, default: true },
    musicUrl: { type: String, default: null },
  },
  { _id: false },
);

const statsSchema = new mongoose.Schema(
  {
    views: { type: Number, default: 0 },
    rsvpYes: { type: Number, default: 0 },
    rsvpNo: { type: Number, default: 0 },
    rsvpMaybe: { type: Number, default: 0 },
  },
  { _id: false },
);

const eventSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: { type: String, required: true, lowercase: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    tagline: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000 },

    date: { type: Date },
    startTime: { type: String, trim: true },
    endTime: { type: String, trim: true },
    timezone: { type: String, default: 'Africa/Dakar' },

    location: { type: locationSchema, default: undefined },
    locations: { type: [locationSchema], default: [] },

    mainImage: { type: imageSchema, default: undefined },
    gallery: { type: [galleryItemSchema], default: [] },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      default: null,
    },
    design: { type: designSchema, default: () => ({}) },

    program: { type: [programItemSchema], default: [] },

    // Donnees specifiques a la categorie (voir ARCHITECTURE.md 5.5)
    details: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },

    visibility: {
      type: String,
      enum: Object.values(EVENT_VISIBILITY),
      default: EVENT_VISIBILITY.PUBLIC,
      index: true,
    },
    accessCodeHash: { type: String, default: null, select: false },

    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
      index: true,
    },
    publishedAt: { type: Date, default: null },

    settings: { type: settingsSchema, default: () => ({}) },
    stats: { type: statsSchema, default: () => ({}) },
  },
  { timestamps: true },
);

eventSchema.index({ 'location.geo': '2dsphere' });

eventSchema.pre('validate', function syncLocations(next) {
  syncGeo(this.location);
  this.locations?.forEach((loc) => syncGeo(loc));
  next();
});

eventSchema.virtual('isPubliclyVisible').get(function isPubliclyVisible() {
  return this.status === EVENT_STATUS.PUBLISHED;
});

export const Event = mongoose.model('Event', eventSchema);

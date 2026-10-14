import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    reporterEmail: { type: String, trim: true, lowercase: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
  },
  { timestamps: true },
);

export const Report = mongoose.model('Report', reportSchema);

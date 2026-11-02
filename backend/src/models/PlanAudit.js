import mongoose from 'mongoose';

const planAuditSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
      index: true,
    },
    before: { type: mongoose.Schema.Types.Mixed, default: undefined },
    after: { type: mongoose.Schema.Types.Mixed, default: undefined },
    reason: { type: String, trim: true, maxlength: 500, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

planAuditSchema.index({ targetUserId: 1, createdAt: -1 });

function rejectMutation(next) {
  next(new Error('PlanAudit est un journal immuable'));
}

planAuditSchema.pre(
  ['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'],
  rejectMutation,
);

export const PlanAudit = mongoose.model('PlanAudit', planAuditSchema);

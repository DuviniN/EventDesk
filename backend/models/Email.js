const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['order_confirmation','event_reminder','organizer_update','promo'], required: true },
    to: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    status: { type: String, enum: ['queued','sent','failed'], default: 'queued' },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    errorMessage: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Email', emailSchema);

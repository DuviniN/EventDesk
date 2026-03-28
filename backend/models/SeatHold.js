const mongoose = require('mongoose');

const seatHoldSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    seatIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true }],
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

// TTL cleanup: remove hold docs right after expiry.
seatHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
seatHoldSchema.index({ eventId: 1, expiresAt: 1 });

module.exports = mongoose.model('SeatHold', seatHoldSchema);

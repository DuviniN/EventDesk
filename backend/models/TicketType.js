const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    // tier categorizes the ticket (e.g., VIP, Regular); allow event-specific labels
    tier: { type: String, default: 'regular', trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    quantityTotal: { type: Number, default: 0 },
    quantitySold: { type: Number, default: 0 },
    saleStart: { type: Date },
    saleEnd: { type: Date },
    maxPerOrder: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('TicketType', ticketTypeSchema);

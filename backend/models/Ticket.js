const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema(
  {
    name: String,
    email: String
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true },
    ticketCode: { type: String, required: true, unique: true },
    attendee: attendeeSchema,
    status: { type: String, enum: ['valid', 'checked_in', 'cancelled', 'refunded'], default: 'valid' },
    checkedInAt: { type: Date },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);

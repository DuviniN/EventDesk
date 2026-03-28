const mongoose = require('mongoose');

const seatAssignmentSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true, index: true },
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketTypeId: { type: mongoose.Schema.Types.ObjectId, ref: 'TicketType', required: true }
  },
  { timestamps: true }
);

seatAssignmentSchema.index({ eventId: 1, seatId: 1 }, { unique: true });

module.exports = mongoose.model('SeatAssignment', seatAssignmentSchema);

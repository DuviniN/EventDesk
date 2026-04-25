const mongoose = require('mongoose');

const seatLabelSchema = new mongoose.Schema(
  {
    section: { type: String },
    row: { type: String },
    number: { type: String }
  },
  { _id: false }
);

const seatSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    layoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'VenueLayout', required: true, index: true },
    label: { type: seatLabelSchema },
    category: { type: String, default: 'regular', trim: true },
    // Relative position in [0..1] so layout scales responsively
    x: { type: Number, required: true, min: 0, max: 1 },
    y: { type: Number, required: true, min: 0, max: 1 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

seatSchema.index(
  { eventId: 1, 'label.section': 1, 'label.row': 1, 'label.number': 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model('Seat', seatSchema);

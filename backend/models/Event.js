const mongoose = require('mongoose');

// Event schema for conferences / meetups
const venueSchema = new mongoose.Schema(
  {
    name: String,
    address: String,
    city: String,
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    categories: [{ type: String }],
    startAt: { type: Date },
    endAt: { type: Date },
    venue: venueSchema,
    capacity: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published', 'cancelled'], default: 'draft' },
    checkInCodeHash: { type: String },
    checkInCodePlain: { type: String },
    checkInCodeUpdatedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);

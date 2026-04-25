const mongoose = require('mongoose');

const venueLayoutSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, unique: true },
    assetType: { type: String, enum: ['svg', 'image'], default: 'image' },
    assetDataUrl: { type: String, default: '' },
    version: { type: Number, default: 1 },
    publishedAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('VenueLayout', venueLayoutSchema);

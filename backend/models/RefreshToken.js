const mongoose = require('mongoose');

// Stores refresh tokens for issued tokens. In production it's recommended
// to store a hash of the token instead of the raw token string to avoid
// leakage if the DB is compromised.
const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    createdByIp: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);

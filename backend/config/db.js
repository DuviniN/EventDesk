const mongoose = require('mongoose');

/**
 * Connect to MongoDB with non-fatal failure handling.
 * If the initial connection fails (for example because Atlas hasn't whitelisted
 * your IP), the function will log a helpful message and keep retrying every
 * `retryIntervalMs` milliseconds. It will NOT call process.exit so the
 * application can continue running for local development and return better
 * error messages to clients.
 */
const retryIntervalMs = parseInt(process.env.MONGO_RETRY_INTERVAL_MS, 10) || 15000;

const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI not provided — set it in your .env to persist users/events.');
    }

    const tryConnect = async () => {
        try {
            await mongoose.connect(uri, { connectTimeoutMS: 10000 });
            console.log('MongoDB connected');
            return true;
        } catch (err) {
            console.error('\nMongoDB connection error:', err.message);
            // surface connection errors so API returns 500 instead of “success” without persistence
            throw err;
            return false;
        }
    };

    // Try once immediately, then keep retrying in background until success.
    await tryConnect();
    return null;
};

module.exports = connectDB;
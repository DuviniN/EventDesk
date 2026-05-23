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
const connectTimeoutMS = parseInt(process.env.MONGO_CONNECT_TIMEOUT_MS, 10) || 10000;

const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
);

let connectPromise = null;
let lastError = null;
let lastAttemptAt = null;
let lastConnectedAt = null;

mongoose.connection.on('connected', () => {
    lastError = null;
    lastConnectedAt = new Date().toISOString();
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
});

mongoose.connection.on('error', (err) => {
    lastError = err;
});

mongoose.connection.on('disconnected', () => {
    // keep lastError as-is; disconnections can happen without an explicit error
});

function maskMongoUri(uri) {
    if (!uri) return null;

    // Strip credentials: mongodb(+srv)://user:pass@host/... -> mongodb(+srv)://***:***@host/...
    return uri.replace(/:\/\/([^:@/]+):([^@/]+)@/i, '://***:***@');
}

function getMongoDiagnostics() {
    const uri = process.env.MONGO_URI;
    const readyState = mongoose.connection ? mongoose.connection.readyState : null;
    return {
        configured: Boolean(uri),
        uriMasked: maskMongoUri(uri),
        readyState,
        lastAttemptAt,
        lastConnectedAt,
        lastError: lastError ? (lastError.message || String(lastError)) : null
    };
}

async function connectDB(options = {}) {
    const { strict = false, retryOnFail = false } = options;
    const uri = process.env.MONGO_URI;

    if (!uri) {
        const err = new Error('MONGO_URI not provided');
        lastError = err;
        // eslint-disable-next-line no-console
        console.warn('MongoDB not configured: MONGO_URI is missing. Set it in backend/.env or your hosting provider env vars.');
        if (strict) throw err;
        return false;
    }

    // Already connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
        return true;
    }

    // If a connect is already in progress, await it
    if (connectPromise) {
        try {
            return await connectPromise;
        } catch (err) {
            if (strict) throw err;
            return false;
        }
    }

    lastAttemptAt = new Date().toISOString();
    connectPromise = (async () => {
        try {
            await mongoose.connect(uri, { connectTimeoutMS });
            return true;
        } catch (err) {
            lastError = err;
            // eslint-disable-next-line no-console
            console.error('MongoDB connection error:', err.message);
            return false;
        } finally {
            connectPromise = null;
        }
    })();

    const ok = await connectPromise;

    // Retry loop is useful for long-running servers, but not for serverless.
    const shouldRetry = (retryOnFail || process.env.MONGO_RETRY_ON_FAIL === 'true') && !isServerless;
    if (!ok && shouldRetry) {
        setTimeout(() => {
            connectDB({ strict: false, retryOnFail: true }).catch(() => {});
        }, retryIntervalMs);
    }

    if (!ok && strict) {
        throw (lastError || new Error('MongoDB connection failed'));
    }

    return ok;
}

module.exports = {
    connectDB,
    getMongoDiagnostics
};
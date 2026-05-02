const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// CORS configuration
const devLocalhostOrigin = /^http:\/\/localhost:\d+$/;
const explicitOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser tools (like curl/postman) with no Origin header
      if (!origin) return callback(null, true);

      // explicit allow-list (production / staging)
      if (explicitOrigins.includes(origin)) return callback(null, true);

      // dev: Vite can pick any open port
      if (process.env.NODE_ENV !== 'production' && devLocalhostOrigin.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(cookieParser());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/events", require("./routes/event.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));
app.use("/api/health", require("./routes/health.routes"));

module.exports = app;

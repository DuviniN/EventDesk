const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/events", require("./routes/event.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));

module.exports = app;

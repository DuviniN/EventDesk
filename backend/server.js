require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/db");

// Try to connect, but don't crash the server on failure.
// Health endpoints will report connection status.
connectDB({ strict: false, retryOnFail: true }).catch(() => {});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

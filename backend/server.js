const express = require("express");
const cors = require("cors");
const uploadRoute = require("./routes/upload");
const consumptionRoute = require("./routes/consumption");
const metricsRoute = require("./routes/metrics");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/upload", uploadRoute);
app.use("/api/consumption", consumptionRoute);
app.use("/api/metrics", metricsRoute);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Ignore debugger disconnect signals
process.on("SIGUSR1", () => {
  console.log("Received SIGUSR1 - ignoring");
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log("Press Ctrl+C to stop");
});

// Keep server alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const testRoutes = require("./routes/tests");
const bookingRoutes = require("./routes/bookings");

const app = express();

// Middleware
app.use(express.json());

// Allow all origins in dev (to avoid CORS issues)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/bookings", bookingRoutes);

// Simple test route
app.get("/", (req, res) => {
  res.send("Backend is running with MongoDB Atlas!");
});

// MongoDB connection + server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    // Helps avoid “hang forever” when Atlas can’t be reached
    serverSelectionTimeoutMS: 15000,

    // Very helpful on Windows networks where IPv6/DNS causes TLS weirdness
    family: 4,
  })
  .then(() => {
    console.log("✅ MongoDB Atlas connected successfully!");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Atlas connection error (full):", err);
    console.error("❌ Message:", err?.message);
  });

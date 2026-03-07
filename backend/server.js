// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const testRoutes = require("./routes/tests");
const bookingRoutes = require("./routes/bookings");
const consultationRoutes = require("./routes/consultations");
const messageRoutes = require("./routes/messages");

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

// Make io available inside routes if needed later
app.set("io", io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Static uploads folder for image/pdf attachments
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/messages", messageRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running with MongoDB Atlas + Socket.IO!");
});

// Socket.IO events
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join consultation room
  socket.on("join_consultation", (consultationId) => {
    if (!consultationId) return;
    socket.join(consultationId);
    console.log(`Socket ${socket.id} joined consultation ${consultationId}`);
  });

  // Leave consultation room
  socket.on("leave_consultation", (consultationId) => {
    if (!consultationId) return;
    socket.leave(consultationId);
    console.log(`Socket ${socket.id} left consultation ${consultationId}`);
  });

  /**
   * IMPORTANT:
   * Message is already saved by REST API.
   * This socket event should ONLY broadcast the saved message.
   */
  socket.on("send_message", (payload) => {
    try {
      const { consultationId, _id } = payload || {};

      if (!consultationId) {
        socket.emit("message_error", {
          message: "Missing consultationId.",
        });
        return;
      }

      // Broadcast saved message to everyone in this consultation room
      io.to(consultationId).emit("receive_message", payload);

      console.log(
        `Broadcasted message ${_id || "(no-id)"} to consultation ${consultationId}`
      );
    } catch (err) {
      console.error("Socket broadcast error:", err);
      socket.emit("message_error", {
        message: err?.message || "Failed to broadcast message.",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// MongoDB connection + server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is missing in .env file");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    family: 4,
  })
  .then(() => {
    console.log("MongoDB Atlas connected successfully!");
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Atlas connection error (full):", err);
    console.error("Message:", err?.message);
  });

module.exports = { app, server, io };
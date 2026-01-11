// backend/models/booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ✅ Each test row has its own status (so Technician can update per row)
    tests: [
      {
        testId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Test",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },

        // ✅ per-test workflow status (row status)
        status: {
          type: String,
          enum: ["Awaiting Collection", "Sample Collected", "Processing", "Published"],
          default: "Awaiting Collection",
        },

        // ✅ NEW: result fields (used by TechnicianDashboard "Enter Result")
        result: { type: String, default: "" },
        notes: { type: String, default: "" },
        publishedAt: { type: Date },
      },
    ],

    totalAmount: { type: Number, required: true, min: 0 },

    // ✅ Optional overall status (we can auto-sync this from tests[])
    bookingStatus: {
      type: String,
      enum: ["Booked", "Sample Collected", "Processing", "Report Published"],
      default: "Booked",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);

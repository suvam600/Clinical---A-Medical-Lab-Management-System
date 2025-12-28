const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tests: [
      {
        testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],

    totalAmount: { type: Number, required: true, min: 0 },

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

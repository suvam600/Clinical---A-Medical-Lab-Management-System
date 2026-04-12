// backend/models/booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    patientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Each booked test row
    tests: [
      {
        testId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Test",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },

        // Per-test workflow status
        status: {
          type: String,
          enum: ["Awaiting Collection", "Sample Collected", "Processing", "Published"],
          default: "Awaiting Collection",
        },

        // Result fields
        result: { type: String, default: "" },
        notes: { type: String, default: "" },
        publishedAt: { type: Date },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Overall booking workflow status
    bookingStatus: {
      type: String,
      enum: ["Booked", "Sample Collected", "Processing", "Report Published"],
      default: "Booked",
    },

    // Payment status
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    // Optional payment gateway name
    paymentGateway: {
      type: String,
      enum: ["eSewa", "Cash", "None"],
      default: "None",
    },

    // eSewa payment details
    esewa: {
      transaction_uuid: { type: String, default: "" },
      product_code: { type: String, default: "" },

      amount: { type: Number, default: 0 },
      tax_amount: { type: Number, default: 0 },
      product_service_charge: { type: Number, default: 0 },
      product_delivery_charge: { type: Number, default: 0 },
      total_amount: { type: Number, default: 0 },

      signature: { type: String, default: "" },
      transaction_code: { type: String, default: "" },

      status: {
        type: String,
        enum: ["PENDING", "COMPLETE", "FAILED", "CANCELED", "NOT_FOUND", ""],
        default: "",
      },

      initiatedAt: { type: Date },
      paidAt: { type: Date },

      rawResponse: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
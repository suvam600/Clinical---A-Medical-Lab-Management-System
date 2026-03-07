const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultation", consultationSchema);
const mongoose = require("mongoose");

const doctorApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: String,
    email: String,

    degree: String,
    specialization: String,
    experience: String,
    description: String,

    proofFiles: [String], // file paths

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "DoctorApplication",
  doctorApplicationSchema
);
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    degree: {
      type: String,
      required: true,
    },

    specialization: {
      type: String,
      required: true,
    },

    experience: {
      type: String,
    },

    description: {
      type: String,
    },

    consultationFee: {
      type: Number,
      default: 0,
    },

    availableDays: {
      type: [String],
      default: [],
    },

    profileImage: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
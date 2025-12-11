// backend/models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["patient", "technician", "doctor", "admin"],
      default: "patient",
    },
    citizenshipId: { type: String }, // for patients (optional)
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;

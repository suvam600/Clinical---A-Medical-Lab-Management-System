// backend/models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true, // index created here
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["patient", "technician", "doctor", "admin"],
      default: "patient",
    },

    // Citizenship ID = unique patient identifier
    citizenshipId: {
      type: String,
      unique: true, // index created here
      sparse: true, // allows null for non-patient users
      trim: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;

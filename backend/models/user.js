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
      unique: true,
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
      unique: true,
      sparse: true,
      trim: true,
    },

    // Email verification fields for newly created users
    isVerified: {
      type: Boolean,
      default: undefined,
    },

    verificationCode: {
      type: String,
      default: null,
    },

    verificationCodeExpires: {
      type: Date,
      default: null,
    },

    // Password reset fields
    resetCode: {
      type: String,
      default: null,
    },

    resetCodeExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      required: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    senderRole: {
      type: String,
      enum: ["patient", "doctor"],
      required: true,
    },

    text: {
      type: String,
      default: "",
    },

    fileUrl: {
      type: String,
      default: "",
    },

    fileType: {
      type: String,
      enum: ["image", "pdf", "none"],
      default: "none",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
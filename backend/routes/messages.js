// backend/routes/messages.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const Message = require("../models/message");
const Consultation = require("../models/consultation");
const { authRequired } = require("../middleware/authMiddleware");

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeOriginal = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeOriginal}`);
  },
});

function fileFilter(req, file, cb) {
  const allowedMimeTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, PNG, JPG, JPEG, and WEBP files are allowed."));
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

// Helper: verify current user belongs to consultation
async function canAccessConsultation(user, consultationId) {
  const consultation = await Consultation.findById(consultationId);
  if (!consultation) return { ok: false, consultation: null };

  const uid = String(user.userId);
  const isPatient = String(consultation.patientId) === uid;
  const isDoctor = String(consultation.doctorId) === uid;

  if (!isPatient && !isDoctor) {
    return { ok: false, consultation };
  }

  return { ok: true, consultation };
}

/**
 * GET /api/messages/:consultationId
 * Fetch all messages for one consultation
 */
router.get("/:consultationId", authRequired, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const access = await canAccessConsultation(req.user, consultationId);
    if (!access.consultation) {
      return res.status(404).json({ success: false, message: "Consultation not found." });
    }
    if (!access.ok) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    const messages = await Message.find({ consultationId }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      data: messages,
    });
  } catch (err) {
    console.error("❌ Get messages error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load messages.",
    });
  }
});

/**
 * POST /api/messages/:consultationId/text
 * Save a normal text message
 */
router.post("/:consultationId/text", authRequired, async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { text } = req.body;

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        success: false,
        message: "Message text is required.",
      });
    }

    const access = await canAccessConsultation(req.user, consultationId);
    if (!access.consultation) {
      return res.status(404).json({ success: false, message: "Consultation not found." });
    }
    if (!access.ok) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }

    const message = await Message.create({
      consultationId,
      senderId: req.user.userId,
      senderRole: req.user.role,
      text: String(text).trim(),
      fileUrl: "",
      fileType: "none",
    });

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (err) {
    console.error("❌ Save text message error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to save message.",
    });
  }
});

/**
 * POST /api/messages/:consultationId/file
 * Upload PDF/image and save as message
 */
router.post(
  "/:consultationId/file",
  authRequired,
  upload.single("file"),
  async (req, res) => {
    try {
      const { consultationId } = req.params;

      const access = await canAccessConsultation(req.user, consultationId);
      if (!access.consultation) {
        return res.status(404).json({ success: false, message: "Consultation not found." });
      }
      if (!access.ok) {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File is required.",
        });
      }

      const mime = req.file.mimetype || "";
      const fileType = mime === "application/pdf" ? "pdf" : "image";

      const fileUrl = `/uploads/${req.file.filename}`;

      const message = await Message.create({
        consultationId,
        senderId: req.user.userId,
        senderRole: req.user.role,
        text: "",
        fileUrl,
        fileType,
      });

      return res.status(201).json({
        success: true,
        data: message,
      });
    } catch (err) {
      console.error("❌ Upload file message error:", err);
      return res.status(500).json({
        success: false,
        message: err?.message || "Failed to upload file.",
      });
    }
  }
);

module.exports = router;
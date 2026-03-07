// backend/routes/consultations.js
const express = require("express");
const router = express.Router();

const Consultation = require("../models/consultation");
const User = require("../models/user");
const { authRequired } = require("../middleware/authMiddleware");

/**
 * Helper: check whether current user belongs to consultation
 */
function canAccessConsultation(user, consultation) {
  if (!user || !consultation) return false;

  const uid = String(user.userId);
  return (
    String(consultation.patientId) === uid ||
    String(consultation.doctorId) === uid
  );
}

/**
 * POST /api/consultations/request
 * Patient requests a doctor consultation
 */
router.post("/request", authRequired, async (req, res) => {
  try {
    if (req.user?.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can request consultation.",
      });
    }

    // For now, use the first doctor account found in DB
    const doctor = await User.findOne({ role: "doctor" }).sort({ createdAt: 1 });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor account not available.",
      });
    }

    // Prevent multiple active consultations for same patient
    const existing = await Consultation.findOne({
      patientId: req.user.userId,
      status: "Active",
    })
      .populate("patientId", "name email citizenshipId")
      .populate("doctorId", "name email role");

    if (existing) {
      return res.json({
        success: true,
        message: "Active consultation already exists.",
        data: existing,
      });
    }

    const consultation = await Consultation.create({
      patientId: req.user.userId,
      doctorId: doctor._id,
      status: "Active",
    });

    const populated = await Consultation.findById(consultation._id)
      .populate("patientId", "name email citizenshipId")
      .populate("doctorId", "name email role");

    return res.status(201).json({
      success: true,
      message: "Consultation created successfully.",
      data: populated,
    });
  } catch (err) {
    console.error("❌ Consultation request error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to create consultation.",
    });
  }
});

/**
 * GET /api/consultations/patient
 * Patient sees own consultations
 */
router.get("/patient", authRequired, async (req, res) => {
  try {
    if (req.user?.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can view patient consultations.",
      });
    }

    const consultations = await Consultation.find({
      patientId: req.user.userId,
    })
      .populate("doctorId", "name email role")
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.json({
      success: true,
      data: consultations,
    });
  } catch (err) {
    console.error("❌ Patient consultations error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load consultations.",
    });
  }
});

/**
 * GET /api/consultations/doctor
 * Doctor sees consultation list
 */
router.get("/doctor", authRequired, async (req, res) => {
  try {
    if (req.user?.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Doctor only.",
      });
    }

    const consultations = await Consultation.find({
      doctorId: req.user.userId,
    })
      .populate("patientId", "name email citizenshipId")
      .populate("doctorId", "name email role")
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.json({
      success: true,
      data: consultations,
    });
  } catch (err) {
    console.error("❌ Doctor consultations error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load doctor consultations.",
    });
  }
});

/**
 * GET /api/consultations/:consultationId
 * Patient or doctor opens a single consultation
 */
router.get("/:consultationId", authRequired, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId)
      .populate("patientId", "name email citizenshipId")
      .populate("doctorId", "name email role");

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    const patientIdValue =
      consultation.patientId && consultation.patientId._id
        ? consultation.patientId._id
        : consultation.patientId;

    const doctorIdValue =
      consultation.doctorId && consultation.doctorId._id
        ? consultation.doctorId._id
        : consultation.doctorId;

    const allowed =
      String(patientIdValue) === String(req.user.userId) ||
      String(doctorIdValue) === String(req.user.userId);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    return res.json({
      success: true,
      data: consultation,
    });
  } catch (err) {
    console.error("❌ Get single consultation error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load consultation.",
    });
  }
});

/**
 * PATCH /api/consultations/:consultationId/close
 * Doctor closes consultation
 */
router.patch("/:consultationId/close", authRequired, async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    if (String(consultation.doctorId) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned doctor can close this consultation.",
      });
    }

    consultation.status = "Closed";
    await consultation.save();

    const populated = await Consultation.findById(consultation._id)
      .populate("patientId", "name email citizenshipId")
      .populate("doctorId", "name email role");

    return res.json({
      success: true,
      message: "Consultation closed successfully.",
      data: populated,
    });
  } catch (err) {
    console.error("❌ Close consultation error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to close consultation.",
    });
  }
});

module.exports = router;
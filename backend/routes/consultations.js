const express = require("express");
const router = express.Router();

const Consultation = require("../models/consultation");
const Doctor = require("../models/Doctor");
const User = require("../models/user");
const { authRequired } = require("../middleware/authMiddleware");
const { sendEmail } = require("../utils/sendEmail");

/**
 * Helper: check whether current user belongs to consultation
 */
function canAccessConsultation(user, consultation) {
  if (!user || !consultation) return false;

  const uid = String(user.userId);

  const patientIdValue =
    consultation.patientId && consultation.patientId._id
      ? consultation.patientId._id
      : consultation.patientId;

  const doctorUserIdValue =
    consultation.doctorId &&
    consultation.doctorId.userId &&
    consultation.doctorId.userId._id
      ? consultation.doctorId.userId._id
      : consultation.doctorId?.userId || consultation.doctorId;

  return String(patientIdValue) === uid || String(doctorUserIdValue) === uid;
}

/**
 * GET /api/consultations/doctors
 * Patient gets doctor list, optionally filtered by specialization
 */
router.get("/doctors", authRequired, async (req, res) => {
  try {
    const { specialization } = req.query;

    const filter = {};
    if (specialization) {
      filter.specialization = specialization;
    }

    const doctors = await Doctor.find(filter)
      .populate("userId", "name email")
      .sort({ specialization: 1, name: 1 });

    return res.json({
      success: true,
      data: doctors,
    });
  } catch (err) {
    console.error("Fetch doctors error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch doctors.",
    });
  }
});

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

    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "doctorId is required.",
      });
    }

    const doctor = await Doctor.findById(doctorId).populate(
      "userId",
      "name email role"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Selected doctor not found.",
      });
    }

    const existing = await Consultation.findOne({
      patientId: req.user.userId,
      status: "Active",
    })
      .populate("patientId", "name email citizenshipId")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "name email role",
        },
      });

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
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "name email role",
        },
      });

    try {
      const patient = await User.findById(req.user.userId).select(
        "name email citizenshipId"
      );

      const doctorEmail = doctor.userId?.email;

      if (doctorEmail) {
        const subject = "Clinical - New Consultation Request";

        const html = `
          <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
            <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">

              <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Clinical</h2>
                <p style="margin: 5px 0 0;">Medical Lab Management System</p>
              </div>

              <div style="padding: 30px;">
                <h3 style="color: #333;">New Consultation Request</h3>

                <p style="color: #555; font-size: 14px;">
                  A patient has requested a doctor consultation.
                </p>

                <p style="margin: 15px 0; font-size: 14px;">
                  <strong>Patient Name:</strong> ${patient?.name || "Patient"}
                </p>

                <p style="margin: 15px 0; font-size: 14px;">
                  <strong>Patient Email:</strong> ${patient?.email || "N/A"}
                </p>

                <p style="margin: 15px 0; font-size: 14px;">
                  <strong>Citizenship ID:</strong> ${patient?.citizenshipId || "N/A"}
                </p>

                <p style="color: #555; font-size: 14px;">
                  Please log in to the Clinical system to view this consultation.
                </p>
              </div>

              <div style="background: #f4f6f8; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} Clinical. All rights reserved.
              </div>

            </div>
          </div>
        `;

        await sendEmail(doctorEmail, subject, html);
        console.log("Doctor consultation email sent to:", doctorEmail);
      }
    } catch (emailErr) {
      console.error("Doctor consultation email failed:", emailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Consultation created successfully.",
      data: populated,
    });
  } catch (err) {
    console.error("Consultation request error:", err);
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
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "name email role",
        },
      })
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.json({
      success: true,
      data: consultations,
    });
  } catch (err) {
    console.error("Patient consultations error:", err);
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

    const doctorProfile = await Doctor.findOne({
      userId: req.user.userId,
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    const consultations = await Consultation.find({
      doctorId: doctorProfile._id,
    })
      .populate("patientId", "name email citizenshipId")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "name email role",
        },
      })
      .sort({ updatedAt: -1, createdAt: -1 });

    return res.json({
      success: true,
      data: consultations,
    });
  } catch (err) {
    console.error("Doctor consultations error:", err);
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
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "name email role",
        },
      });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    const allowed = canAccessConsultation(req.user, consultation);

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
    console.error("Get single consultation error:", err);
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

    const consultation = await Consultation.findById(consultationId).populate(
      "doctorId"
    );

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: "Consultation not found.",
      });
    }

    const doctorUserId =
      consultation.doctorId && consultation.doctorId.userId
        ? consultation.doctorId.userId
        : consultation.doctorId;

    if (String(doctorUserId) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned doctor can close this consultation.",
      });
    }

    consultation.status = "Closed";
    await consultation.save();

    const populated = await Consultation.findById(consultation._id)
      .populate("patientId", "name email citizenshipId")
      .populate({
        path: "doctorId",
        populate: {
          path: "userId",
          select: "name email role",
        },
      });

    return res.json({
      success: true,
      message: "Consultation closed successfully.",
      data: populated,
    });
  } catch (err) {
    console.error("Close consultation error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to close consultation.",
    });
  }
});

module.exports = router;
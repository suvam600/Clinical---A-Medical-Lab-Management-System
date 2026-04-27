const express = require("express");
const router = express.Router();
const multer = require("multer");

const DoctorApplication = require("../models/DoctorApplication");
const User = require("../models/user");
const Doctor = require("../models/Doctor");
const { authRequired } = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const upload = multer({ storage });

// Apply for doctor
router.post(
  "/apply",
  authRequired,
  upload.array("proofFiles", 5),
  async (req, res) => {
    try {
      const { degree, specialization, experience, description } = req.body;

      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const files = (req.files || []).map((file) => `/uploads/${file.filename}`);

      const application = await DoctorApplication.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        degree,
        specialization,
        experience,
        description,
        proofFiles: files,
        status: "Pending",
      });

      return res.status(201).json({
        success: true,
        message: "Doctor application submitted successfully.",
        data: application,
      });
    } catch (err) {
      console.error("Doctor apply error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Error submitting application.",
      });
    }
  }
);

// Admin: get all applications
router.get("/", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only." });
    }

    const applications = await DoctorApplication.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: applications,
    });
  } catch (err) {
    console.error("Fetch doctor applications error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Error fetching applications.",
    });
  }
});

// Admin: approve application
router.patch("/:id/approve", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only." });
    }

    const application = await DoctorApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    const user = await User.findById(application.userId);

    if (!user) {
      return res.status(404).json({ message: "Applicant user not found." });
    }

    user.role = "doctor";
    await user.save();

    const existingDoctor = await Doctor.findOne({
      userId: application.userId,
    });

    if (!existingDoctor) {
      await Doctor.create({
        userId: application.userId,
        name: user.name,
        degree: application.degree,
        specialization: application.specialization,
        experience: application.experience,
        description: application.description,
      });
    }

    application.name = application.name || user.name;
    application.email = application.email || user.email;
    application.status = "Approved";
    await application.save();

    return res.json({
      success: true,
      message: "Application approved successfully.",
    });
  } catch (err) {
    console.error("Approve doctor application error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Error approving application.",
    });
  }
});

// Admin: reject application
router.patch("/:id/reject", authRequired, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only." });
    }

    const application = await DoctorApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    application.status = "Rejected";
    await application.save();

    return res.json({
      success: true,
      message: "Application rejected successfully.",
    });
  } catch (err) {
    console.error("Reject doctor application error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Error rejecting application.",
    });
  }
});

module.exports = router;
// backend/routes/admin.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Test = require("../models/test");
const Doctor = require("../models/Doctor"); // ✅ ADDED
const { authRequired, requireRole } = require("../middleware/authMiddleware");

const router = express.Router();

// All admin routes require logged-in ADMIN
router.use(authRequired, requireRole("admin"));

const ALLOWED_ROLES = ["patient", "technician", "doctor", "admin"];

/**
 * GET /api/admin/users
 */
router.get("/users", async (req, res) => {
  try {
    const role = (req.query.role || "").toLowerCase().trim();
    const filter = role ? { role } : {};

    const users = await User.find(filter)
      .select("_id name email role citizenshipId createdAt")
      .sort({ createdAt: -1 });

    const mapped = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      citizenshipId: u.citizenshipId || null,
      createdAt: u.createdAt,
    }));

    res.json({ users: mapped });
  } catch (err) {
    console.error("Admin list users error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * POST /api/admin/users
 */
router.post("/users", async (req, res) => {
  try {
    let { name, email, password, role, citizenshipId } = req.body;

    name = (name || "").trim();
    email = (email || "").trim().toLowerCase();
    role = (role || "").trim().toLowerCase();
    citizenshipId = (citizenshipId || "").trim();

    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "name, email, password, role are required." });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    if (role === "patient" && !citizenshipId) {
      return res
        .status(400)
        .json({ message: "citizenshipId is required for patient accounts." });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    if (citizenshipId) {
      const existingCid = await User.findOne({ citizenshipId });
      if (existingCid) {
        return res
          .status(400)
          .json({ message: "Citizenship ID is already in use." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      citizenshipId: citizenshipId || null,
    });

    res.status(201).json({
      message: "User created successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        citizenshipId: user.citizenshipId || null,
      },
    });
  } catch (err) {
    console.error("Admin create user error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

/**
 * DELETE /api/admin/users/:id
 */
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user.userId) === String(id)) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own admin account." });
    }

    const deleted = await User.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ FIX: remove doctor profile also
    await Doctor.deleteMany({ userId: id });

    res.json({ message: "User and doctor profile deleted successfully." });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

/* =========================================================
    TEST MANAGEMENT ROUTES
   ========================================================= */

router.get("/tests", async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    res.json({ success: true, data: tests });
  } catch (err) {
    console.error("Admin list tests error:", err);
    res.status(500).json({ success: false, message: "Failed to load tests" });
  }
});

router.delete("/tests/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Test.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Test not found." });
    }

    res.json({ success: true, message: "Test removed successfully." });
  } catch (err) {
    console.error("Admin delete test error:", err);
    res.status(500).json({ success: false, message: "Failed to remove test" });
  }
});

router.patch("/tests/:id/toggle", async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found." });
    }

    test.isActive = !test.isActive;
    await test.save();

    res.json({
      success: true,
      message: `Test ${test.isActive ? "enabled" : "disabled"} successfully.`,
      data: test,
    });
  } catch (err) {
    console.error("Admin toggle test error:", err);
    res.status(500).json({ success: false, message: "Failed to update test" });
  }
});

module.exports = router;
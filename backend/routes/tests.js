// backend/routes/tests.js
const express = require("express");
const router = express.Router();
const Test = require("../models/test");

const { authRequired, requireRole } = require("../middleware/authMiddleware");

// ✅ PATIENT (public): GET all active tests
router.get("/", async (req, res) => {
  try {
    const tests = await Test.find({ isActive: true }).sort({ name: 1 });
    return res.json({ success: true, data: tests });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load tests" });
  }
});

// ✅ ADMIN: GET all tests (active + inactive)
router.get("/all", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const tests = await Test.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: tests });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load tests" });
  }
});

// ✅ ADMIN: DELETE a test (hard delete)
router.delete("/:id", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Test.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    return res.json({ success: true, message: "Test removed successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to remove test" });
  }
});

// ✅ (OPTIONAL but recommended) ADMIN: Disable/Enable instead of delete
router.patch("/:id/toggle", authRequired, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    test.isActive = !test.isActive;
    await test.save();

    return res.json({
      success: true,
      message: `Test ${test.isActive ? "enabled" : "disabled"} successfully`,
      data: test,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update test" });
  }
});

module.exports = router;

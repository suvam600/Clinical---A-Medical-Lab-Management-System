// backend/routes/bookings.js
const express = require("express");
const router = express.Router();

const Booking = require("../models/booking");
const Test = require("../models/test");
const { authRequired } = require("../middleware/authMiddleware");

/**
 * ✅ POST /api/bookings
 * Patient creates booking with multiple tests
 * body: { testIds: ["...", "..."] }
 */
router.post("/", authRequired, async (req, res) => {
  try {
    const { testIds } = req.body;

    // Helpful logs (remove later if you want)
    console.log("✅ BOOKING CREATE body:", req.body);
    console.log("✅ BOOKING CREATE user:", req.user);

    // Token payload safety
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Token payload missing userId.",
      });
    }

    // Validate testIds
    if (!Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least 1 test.",
      });
    }

    // Load selected tests (only active ones)
    const tests = await Test.find({ _id: { $in: testIds }, isActive: true });

    if (!tests || tests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected tests not found.",
      });
    }

    // Snapshot tests into booking (so price/name remains even if admin changes test later)
    const bookingTests = tests.map((t) => ({
      testId: t._id,
      name: t.name,
      price: t.price,
    }));

    const totalAmount = bookingTests.reduce(
      (sum, t) => sum + (Number(t.price) || 0),
      0
    );

    const booking = await Booking.create({
      patientUserId: req.user.userId, // ✅ correct from JWT
      tests: bookingTests,
      totalAmount,
      bookingStatus: "Booked",
      paymentStatus: "Pending",
    });

    return res.json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (err) {
    console.error("❌ Booking create error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to create booking",
    });
  }
});

/**
 * ✅ GET /api/bookings/mine
 * Patient sees own bookings
 */
router.get("/mine", authRequired, async (req, res) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Token payload missing userId.",
      });
    }

    const bookings = await Booking.find({
      patientUserId: req.user.userId,
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error("❌ Booking mine error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load bookings",
    });
  }
});

/**
 * ✅ GET /api/bookings/queue
 * Technician/Admin sees all active bookings + patient info (citizenshipId is the unique identifier)
 */
router.get("/queue", authRequired, async (req, res) => {
  try {
    // Only technician or admin
    if (req.user?.role !== "technician" && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Show bookings that are still active (not finished)
    const bookings = await Booking.find({
      bookingStatus: { $ne: "Report Published" },
    })
      .populate("patientUserId", "name citizenshipId email")
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: bookings });
  } catch (err) {
    console.error("❌ Booking queue error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load queue",
    });
  }
});

module.exports = router;

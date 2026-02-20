// backend/routes/bookings.js
const express = require("express");
const router = express.Router();

const Booking = require("../models/booking");
const Test = require("../models/test");
const { authRequired } = require("../middleware/authMiddleware");

// Allowed per-test statuses
const TEST_STATUSES = [
  "Awaiting Collection",
  "Sample Collected",
  "Processing",
  "Published",
];

// Helper: update bookingStatus based on tests[] statuses
function deriveBookingStatus(booking) {
  const statuses = (booking.tests || []).map(
    (t) => t.status || "Awaiting Collection"
  );

  if (statuses.length === 0) return "Booked";

  if (statuses.every((s) => s === "Published")) return "Report Published";
  if (statuses.some((s) => s === "Processing")) return "Processing";
  if (statuses.some((s) => s === "Sample Collected")) return "Sample Collected";
  return "Booked";
}

/**
 * ✅ POST /api/bookings
 * Patient creates booking with multiple tests
 * body: { testIds: ["...", "..."] }
 */
router.post("/", authRequired, async (req, res) => {
  try {
    const { testIds } = req.body;

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Token payload missing userId.",
      });
    }

    if (!Array.isArray(testIds) || testIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least 1 test.",
      });
    }

    const tests = await Test.find({ _id: { $in: testIds }, isActive: true });

    if (!tests || tests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected tests not found.",
      });
    }

    // Snapshot tests into booking + ✅ per-test status
    const bookingTests = tests.map((t) => ({
      testId: t._id,
      name: t.name,
      price: t.price,
      status: "Awaiting Collection",
    }));

    const totalAmount = bookingTests.reduce(
      (sum, t) => sum + (Number(t.price) || 0),
      0
    );

    const booking = await Booking.create({
      patientUserId: req.user.userId,
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
 * Technician/Admin sees bookings + patient info
 *
 * Default behaviour (UNCHANGED): excludes fully published bookings
 * Optional: ?includePublished=1 -> includes fully published bookings too
 */
router.get("/queue", authRequired, async (req, res) => {
  try {
    if (req.user?.role !== "technician" && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const includePublished = String(req.query.includePublished || "") === "1";

    const filter = includePublished
      ? {} // ✅ include all bookings
      : { bookingStatus: { $ne: "Report Published" } }; // ✅ keep old behaviour

    const bookings = await Booking.find(filter)
      .populate("patientUserId", "name citizenshipId email")
      .sort({ createdAt: -1 });

    // Backward compatible: default missing tests[].status in response
    const mapped = bookings.map((b) => {
      const obj = b.toObject();
      obj.tests = (obj.tests || []).map((t) => ({
        ...t,
        status: t.status || "Awaiting Collection",
      }));
      return obj;
    });

    return res.json({ success: true, data: mapped });
  } catch (err) {
    console.error("❌ Booking queue error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load queue",
    });
  }
});

/**
 * ✅ PATCH /api/bookings/:bookingId/tests/:itemId/status
 * Technician/Admin updates ONE test row status
 * body: { status: "Processing" }
 */
router.patch("/:bookingId/tests/:itemId/status", authRequired, async (req, res) => {
  try {
    if (req.user?.role !== "technician" && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { bookingId, itemId } = req.params;
    const { status } = req.body;

    if (!TEST_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value.",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    const testItem = booking.tests.id(itemId);
    if (!testItem) {
      return res
        .status(404)
        .json({ success: false, message: "Test item not found." });
    }

    // forward-only flow
    const order = {
      "Awaiting Collection": 0,
      "Sample Collected": 1,
      Processing: 2,
      Published: 3,
    };

    const current = testItem.status || "Awaiting Collection";
    if (order[status] < order[current]) {
      return res.status(400).json({
        success: false,
        message: `Cannot move backwards from "${current}" to "${status}".`,
      });
    }

    testItem.status = status;

    // auto-sync bookingStatus
    booking.bookingStatus = deriveBookingStatus(booking);
    await booking.save();

    return res.json({
      success: true,
      message: "Status updated successfully.",
      data: booking,
    });
  } catch (err) {
    console.error("❌ Update status error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to update status",
    });
  }
});

/**
 * ✅ PUT /api/bookings/:bookingId/tests/:itemId/result
 * Technician/Admin enters result for ONE test row and publishes it
 * body: { result: "...", notes?: "..." }
 */
router.put("/:bookingId/tests/:itemId/result", authRequired, async (req, res) => {
  try {
    if (req.user?.role !== "technician" && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const { bookingId, itemId } = req.params;
    const { result, notes } = req.body;

    if (!result || String(result).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Result is required.",
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found." });
    }

    const testItem = booking.tests.id(itemId);
    if (!testItem) {
      return res.status(404).json({ success: false, message: "Test item not found." });
    }

    // forward-only flow (same ordering you used)
    const order = {
      "Awaiting Collection": 0,
      "Sample Collected": 1,
      Processing: 2,
      Published: 3,
    };

    const current = testItem.status || "Awaiting Collection";

    // ✅ strict rule: only allow publishing if already Processing
    if (order[current] < order["Processing"]) {
      return res.status(400).json({
        success: false,
        message: `Cannot publish result while status is "${current}". Move it to "Processing" first.`,
      });
    }

    // save result + publish
    testItem.result = String(result);
    testItem.notes = notes ? String(notes) : "";
    testItem.publishedAt = new Date();
    testItem.status = "Published";

    booking.bookingStatus = deriveBookingStatus(booking);
    await booking.save();

    return res.json({
      success: true,
      message: "Result saved and test published.",
      data: booking,
    });
  } catch (err) {
    console.error("❌ Enter result error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to save result",
    });
  }
});

module.exports = router;

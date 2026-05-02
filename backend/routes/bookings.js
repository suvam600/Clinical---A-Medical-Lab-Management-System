// backend/routes/bookings.js
const express = require("express");
const router = express.Router();

const Booking = require("../models/booking");
const Test = require("../models/test");
const User = require("../models/user");
const { authRequired } = require("../middleware/authMiddleware");
const { sendResultEmail, sendEmail } = require("../utils/sendEmail");

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
 * POST /api/bookings
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

    // Notify all technicians when a new test booking is created
    try {
      const technicians = await User.find({ role: "technician" }).select(
        "name email"
      );

      if (technicians.length > 0) {
        const patient = await User.findById(req.user.userId).select(
          "name email citizenshipId"
        );

        const testNames = bookingTests.map((t) => t.name).join(", ");

        const subject = "Clinical - New Test Booking";

        const html = `
          <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
            <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">

              <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 20px; text-align: center;">
                <h2 style="margin: 0;">Clinical</h2>
                <p style="margin: 5px 0 0;">Medical Lab Management System</p>
              </div>

              <div style="padding: 30px;">
                <h3 style="color: #333;">New Test Booking Received</h3>

                <p style="color: #555; font-size: 14px;">
                  A patient has booked new lab tests.
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

                <p style="margin: 15px 0; font-size: 14px;">
                  <strong>Tests:</strong> ${testNames}
                </p>

                <p style="margin: 15px 0; font-size: 14px;">
                  <strong>Total Amount:</strong> Rs. ${totalAmount}
                </p>

                <p style="color: #555; font-size: 14px;">
                  Please log in to the Clinical system to proceed with sample collection.
                </p>
              </div>

              <div style="background: #f4f6f8; padding: 15px; text-align: center; font-size: 12px; color: #999;">
                © ${new Date().getFullYear()} Clinical. All rights reserved.
              </div>

            </div>
          </div>
        `;

        for (const technician of technicians) {
          if (technician.email) {
            await sendEmail(technician.email, subject, html);
          }
        }

        console.log("Technician booking notification emails sent");
      }
    } catch (emailErr) {
      console.error("Technician booking email failed:", emailErr.message);
    }

    return res.json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (err) {
    console.error("Booking create error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to create booking",
    });
  }
});

/**
 * GET /api/bookings/mine
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
    console.error("Booking mine error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load bookings",
    });
  }
});

/**
 * GET /api/bookings/queue
 * Technician/Admin sees bookings + patient info
 */
router.get("/queue", authRequired, async (req, res) => {
  try {
    if (req.user?.role !== "technician" && req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const includePublished = String(req.query.includePublished || "") === "1";

    const filter = includePublished
      ? {}
      : { bookingStatus: { $ne: "Report Published" } };

    const bookings = await Booking.find(filter)
      .populate("patientUserId", "name citizenshipId email")
      .sort({ createdAt: -1 });

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
    console.error("Booking queue error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load queue",
    });
  }
});

/**
 * PATCH /api/bookings/:bookingId/tests/:itemId/status
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

    booking.bookingStatus = deriveBookingStatus(booking);
    await booking.save();

    return res.json({
      success: true,
      message: "Status updated successfully.",
      data: booking,
    });
  } catch (err) {
    console.error("Update status error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to update status",
    });
  }
});

/**
 * PUT /api/bookings/:bookingId/tests/:itemId/result
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
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    const testItem = booking.tests.id(itemId);
    if (!testItem) {
      return res.status(404).json({
        success: false,
        message: "Test item not found.",
      });
    }

    const order = {
      "Awaiting Collection": 0,
      "Sample Collected": 1,
      Processing: 2,
      Published: 3,
    };

    const current = testItem.status || "Awaiting Collection";

    if (order[current] < order["Processing"]) {
      return res.status(400).json({
        success: false,
        message: `Cannot publish result while status is "${current}". Move it to "Processing" first.`,
      });
    }

    const wasAlreadyPublished = testItem.status === "Published";

    testItem.result = String(result);
    testItem.notes = notes ? String(notes) : "";
    testItem.publishedAt = new Date();
    testItem.status = "Published";

    booking.bookingStatus = deriveBookingStatus(booking);
    await booking.save();

    // Send email only first time result is published
    if (!wasAlreadyPublished) {
      try {
        const patient = await User.findById(booking.patientUserId).select(
          "name email"
        );

        if (patient?.email) {
          await sendResultEmail(patient.email, patient.name, testItem.name);
          console.log("Result published email sent to:", patient.email);
        }
      } catch (emailErr) {
        console.error("Result email failed:", emailErr.message);
      }
    }

    return res.json({
      success: true,
      message: "Result saved and test published.",
      data: booking,
    });
  } catch (err) {
    console.error("Enter result error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to save result",
    });
  }
});

module.exports = router;
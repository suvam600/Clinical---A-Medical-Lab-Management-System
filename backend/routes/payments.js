// backend/routes/payments.js
const express = require("express");
const crypto = require("crypto");
const axios = require("axios");

const router = express.Router();

const Booking = require("../models/booking");
const { authRequired } = require("../middleware/authMiddleware");

// eSewa UAT config
const ESEWA_FORM_URL =
  process.env.ESEWA_FORM_URL ||
  "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

const ESEWA_STATUS_URL =
  process.env.ESEWA_STATUS_URL ||
  "https://uat.esewa.com.np/api/epay/transaction/status/";

const ESEWA_PRODUCT_CODE =
  process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";

const ESEWA_SECRET_KEY =
  process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const SIGNED_FIELD_NAMES = "total_amount,transaction_uuid,product_code";

function createEsewaSignature({ total_amount, transaction_uuid, product_code }) {
  const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;

  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
}

function createResponseSignature({
  transaction_code,
  status,
  total_amount,
  transaction_uuid,
  product_code,
  signed_field_names,
}) {
  const message =
    `transaction_code=${transaction_code},status=${status},total_amount=${total_amount},` +
    `transaction_uuid=${transaction_uuid},product_code=${product_code},signed_field_names=${signed_field_names}`;

  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(message)
    .digest("base64");
}

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Payments route is working",
  });
});

/**
 * POST /api/payments/esewa/initiate/:bookingId
 * Start payment for an existing booking
 */
router.post("/esewa/initiate/:bookingId", authRequired, async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: "Token payload missing userId.",
      });
    }

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (String(booking.patientUserId) !== String(req.user.userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to pay for this booking.",
      });
    }

    if (String(booking.paymentStatus || "").toLowerCase() === "paid") {
      return res.status(400).json({
        success: false,
        message: "This booking is already paid.",
      });
    }

    const amount = Number(booking.totalAmount || 0);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking amount.",
      });
    }

    const tax_amount = 0;
    const product_service_charge = 0;
    const product_delivery_charge = 0;
    const total_amount =
      amount + tax_amount + product_service_charge + product_delivery_charge;

    const transaction_uuid = `${booking._id}-${Date.now()}`;
    const product_code = ESEWA_PRODUCT_CODE;

    const signature = createEsewaSignature({
      total_amount,
      transaction_uuid,
      product_code,
    });

    booking.paymentGateway = "eSewa";
    booking.paymentStatus = "Pending";
    booking.esewa = {
      transaction_uuid,
      product_code,
      amount,
      tax_amount,
      product_service_charge,
      product_delivery_charge,
      total_amount,
      signature,
      transaction_code: "",
      status: "PENDING",
      initiatedAt: new Date(),
      paidAt: null,
      rawResponse: null,
    };

    await booking.save();

    console.log("eSewa initiate saved booking:", {
      bookingId: booking._id.toString(),
      transaction_uuid,
      total_amount,
      product_code,
    });

    return res.json({
      success: true,
      message: "eSewa payment initiated successfully.",
      data: {
        bookingId: booking._id,
        form_url: ESEWA_FORM_URL,
        amount,
        tax_amount,
        total_amount,
        transaction_uuid,
        product_code,
        product_service_charge,
        product_delivery_charge,
        success_url: `${BACKEND_URL}/api/payments/esewa/success`,
        failure_url: `${BACKEND_URL}/api/payments/esewa/failure`,
        signed_field_names: SIGNED_FIELD_NAMES,
        signature,
      },
    });
  } catch (err) {
    console.error("eSewa initiate error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to initiate eSewa payment",
    });
  }
});

/**
 * GET /api/payments/esewa/success
 * eSewa redirects here with ?data=<base64-json>
 */
router.get("/esewa/success", async (req, res) => {
  try {
    const encodedData = req.query.data;
    console.log("eSewa success raw query:", req.query);

    if (!encodedData) {
      console.log("eSewa success: no data received");
      return res.redirect(
        `${FRONTEND_URL}/dashboard?payment=failed&reason=no_data`
      );
    }

    let decoded;
    try {
      decoded = JSON.parse(
        Buffer.from(encodedData, "base64").toString("utf8")
      );
      console.log("eSewa decoded response:", decoded);
    } catch (e) {
      console.log("eSewa success: invalid base64/JSON response");
      return res.redirect(
        `${FRONTEND_URL}/dashboard?payment=failed&reason=invalid_response`
      );
    }

    const {
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
      signature,
    } = decoded || {};

    console.log("eSewa transaction_uuid:", transaction_uuid);

    if (!transaction_uuid) {
      console.log("eSewa success: missing transaction_uuid");
      return res.redirect(
        `${FRONTEND_URL}/dashboard?payment=failed&reason=missing_transaction`
      );
    }

    const booking = await Booking.findOne({
      "esewa.transaction_uuid": transaction_uuid,
    });

    console.log("eSewa matched booking:", booking ? booking._id.toString() : null);

    if (!booking) {
      console.log("eSewa success: booking not found");
      return res.redirect(
        `${FRONTEND_URL}/dashboard?payment=failed&reason=booking_not_found`
      );
    }

    const expectedSignature = createResponseSignature({
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
    });

    console.log("eSewa received signature:", signature);
    console.log("eSewa expected signature:", expectedSignature);

    if (signature !== expectedSignature) {
      console.log("eSewa success: signature mismatch");
      booking.paymentStatus = "Failed";
      booking.esewa.status = "FAILED";
      booking.esewa.rawResponse = {
        stage: "signature_mismatch",
        decoded,
        expectedSignature,
        receivedSignature: signature,
      };
      await booking.save();

      return res.redirect(
        `${FRONTEND_URL}/dashboard?payment=failed&reason=signature_mismatch`
      );
    }

    const statusUrl =
      `${ESEWA_STATUS_URL}?product_code=${encodeURIComponent(product_code)}` +
      `&total_amount=${encodeURIComponent(total_amount)}` +
      `&transaction_uuid=${encodeURIComponent(transaction_uuid)}`;

    console.log("eSewa status check URL:", statusUrl);

    let verifyData = {};
    try {
      const verifyResponse = await axios.get(statusUrl);
      verifyData = verifyResponse.data || {};
      console.log("eSewa verify response:", verifyData);
    } catch (err) {
      console.log("eSewa status API failed, using redirect data instead");
      verifyData.status = status;
      verifyData.transaction_code = transaction_code;
      verifyData.fallback = true;
    }

    if (verifyData.status === "COMPLETE" || status === "COMPLETE") {
      booking.paymentStatus = "Paid";
      booking.paymentGateway = "eSewa";
      booking.esewa.status = "COMPLETE";
      booking.esewa.transaction_code =
        verifyData.transaction_code || transaction_code || "";
      booking.esewa.paidAt = new Date();
      booking.esewa.rawResponse = {
        stage: verifyData.fallback ? "redirect_fallback_success" : "verified_success",
        decoded,
        verifyData,
      };

      await booking.save();

      console.log("eSewa payment marked as Paid for booking:", booking._id.toString());

      return res.redirect(
        `${FRONTEND_URL}/dashboard?payment=success&bookingId=${booking._id}`
      );
    }

    console.log("eSewa verify status not COMPLETE:", verifyData.status);

    booking.paymentStatus = "Failed";
    booking.esewa.status = verifyData.status || "FAILED";
    booking.esewa.rawResponse = {
      stage: "verification_failed",
      decoded,
      verifyData,
    };
    await booking.save();

    return res.redirect(
      `${FRONTEND_URL}/dashboard?payment=failed&reason=${encodeURIComponent(
        verifyData.status || "verification_failed"
      )}`
    );
  } catch (err) {
    console.error("eSewa success handler error:", err);
    return res.redirect(
      `${FRONTEND_URL}/dashboard?payment=failed&reason=server_error`
    );
  }
});

/**
 * GET /api/payments/esewa/failure
 * eSewa redirects here if payment fails/cancels
 */
router.get("/esewa/failure", async (req, res) => {
  try {
    console.log("eSewa failure raw query:", req.query);

    const transaction_uuid = req.query.transaction_uuid;

    if (transaction_uuid) {
      const booking = await Booking.findOne({
        "esewa.transaction_uuid": transaction_uuid,
      });

      if (booking) {
        booking.paymentStatus = "Failed";
        booking.esewa.status = "FAILED";
        booking.esewa.rawResponse = {
          stage: "failure_redirect",
          query: req.query,
        };
        await booking.save();
      }
    }

    return res.redirect(
      `${FRONTEND_URL}/dashboard?payment=failed&reason=user_cancelled_or_failed`
    );
  } catch (err) {
    console.error("eSewa failure handler error:", err);
    return res.redirect(
      `${FRONTEND_URL}/dashboard?payment=failed&reason=server_error`
    );
  }
});

/**
 * Optional helper
 * GET /api/payments/esewa/status/:bookingId
 */
router.get("/esewa/status/:bookingId", authRequired, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (
      String(booking.patientUserId) !== String(req.user.userId) &&
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    return res.json({
      success: true,
      data: {
        bookingId: booking._id,
        paymentStatus: booking.paymentStatus,
        paymentGateway: booking.paymentGateway,
        esewa: booking.esewa || null,
      },
    });
  } catch (err) {
    console.error("eSewa status fetch error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to load payment status",
    });
  }
});

module.exports = router;
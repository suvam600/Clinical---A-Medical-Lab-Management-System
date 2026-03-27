// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, citizenshipId } = req.body;

    console.log("Register body:", req.body);

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }

    // citizenshipId as unique
    if (!citizenshipId) {
      return res.status(400).json({ message: "Citizenship ID is required." });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const existingCitizen = await User.findOne({ citizenshipId });
    if (existingCitizen) {
      return res
        .status(400)
        .json({ message: "Citizenship ID is already registered." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const verificationCodeExpires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "patient",
      citizenshipId,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
    });

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Verify Your Email</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering.</p>
        <p>Your verification code is:</p>
        <h1 style="letter-spacing: 6px; font-size: 32px;">${verificationCode}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    await sendEmail(user.email, "Your verification code", html);

    return res.status(201).json({
      message:
        "User registered successfully. Please check your email for the verification code.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        citizenshipId: user.citizenshipId,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// POST /api/auth/verify-code
router.post("/verify-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required." });
    }

    const user = await User.findOne({
      email,
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification code.",
      });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;

    await user.save();

    return res.json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err) {
    console.error("Verify code error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login body:", req.body);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    // Only newly created users with isVerified === false are blocked
    // Old users with isVerified undefined can still log in
    if (user.isVerified === false) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        citizenshipId: user.citizenshipId,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
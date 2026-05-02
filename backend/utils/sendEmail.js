const nodemailer = require("nodemailer");

// ============================
// Transporter Setup
// ============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ============================
// Verify Transporter
// ============================
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email config error:", error);
  } else {
    console.log("✅ Email server is ready");
  }
});

// ============================
// Generic Send Email Function
// ============================
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Clinical" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw err;
  }
};

// ============================
// ✨ Verification Email Template
// ============================
const sendVerificationEmail = async (to, code) => {
  const subject = "Clinical - Email Verification";

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">

      <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Clinical</h2>
        <p style="margin: 5px 0 0;">Medical Lab Management System</p>
      </div>

      <div style="padding: 30px; text-align: center;">
        <h3 style="margin-bottom: 10px; color: #333;">Verify Your Email</h3>
        <p style="color: #555; font-size: 14px;">
          Thank you for registering with <strong>Clinical</strong>.<br/>
          Please use the verification code below to complete your signup.
        </p>

        <div style="
          margin: 25px 0;
          padding: 15px;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 5px;
          color: #2E7D32;
          background: #f1f8f4;
          border-radius: 8px;
        ">
          ${code}
        </div>

        <p style="font-size: 13px; color: #777;">
          This code will expire in 10 minutes.
        </p>

        <p style="font-size: 13px; color: #777; margin-top: 20px;">
          If you did not request this, please ignore this email.
        </p>
      </div>

      <div style="background: #f4f6f8; padding: 15px; text-align: center; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Clinical. All rights reserved.
      </div>

    </div>
  </div>
  `;

  return sendEmail(to, subject, html);
};

// ============================
// 🧪 Result Published Email Template
// ============================
const sendResultEmail = async (to, name, testName) => {
  const subject = "Clinical - Your Test Result is Ready";

  const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08);">

      <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Clinical</h2>
        <p style="margin: 5px 0 0;">Medical Lab Management System</p>
      </div>

      <div style="padding: 30px;">
        <h3 style="color: #333;">Hello ${name || "Patient"},</h3>

        <p style="color: #555; font-size: 14px;">
          Your lab test result has been successfully published.
        </p>

        <p style="margin: 15px 0; font-size: 14px;">
          <strong>Test Name:</strong> ${testName || "Lab Test"}
        </p>

        <p style="color: #555; font-size: 14px;">
          You can now log in to your dashboard to view or download your report.
        </p>

          <p style="margin-top: 20px; font-size: 14px; color: #333;">
  Please open the Clinical website to check your report.
</p>

        <p style="font-size: 13px; color: #777; margin-top: 20px;">
          Thank you for choosing Clinical.
        </p>
      </div>

      <div style="background: #f4f6f8; padding: 15px; text-align: center; font-size: 12px; color: #999;">
        © ${new Date().getFullYear()} Clinical. All rights reserved.
      </div>

    </div>
  </div>
  `;

  return sendEmail(to, subject, html);
};

// ============================
// Export Functions
// ============================
module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendResultEmail,
};
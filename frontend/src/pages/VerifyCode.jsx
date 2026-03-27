// src/pages/VerifyCode.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";

const API_BASE = "/api";

const VerifyCode = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const email = localStorage.getItem("verifyEmail");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!code) {
      setError("Please enter the verification code.");
      return;
    }

    if (!email) {
      setError("Missing email. Please register again.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification failed.");
      }

      setSuccessMsg("Email verified successfully!");

      // cleanup
      localStorage.removeItem("verifyEmail");

      // redirect to login
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <AuthCard
          title="Verify your email"
          subtitle="Enter the 6-digit code sent to your email."
          footerText="Didn't receive code?"
          footerLinkText="Register again"
          footerLinkTo="/register"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Verification Code"
              name="code"
              type="text"
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                {error}
              </p>
            )}

            {successMsg && (
              <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1">
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-400/40 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        </AuthCard>
      </div>
    </div>
  );
};

export default VerifyCode;
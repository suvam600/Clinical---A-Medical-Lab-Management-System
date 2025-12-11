// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";
import bg from "../assets/medical-bg.svg";

const API_BASE = "/api";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    citizenshipId: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          citizenshipId: form.citizenshipId,
          role: "patient", // default role
        }),
      });

      // Read as text first, then safely parse JSON so we avoid “Unexpected end of JSON input”
      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // response was not valid JSON, leave data as {}
      }

      if (!res.ok) {
        throw new Error(data.message || text || "Registration failed");
      }

      setSuccessMsg(
        data.message || "Registration successful. You can now sign in."
      );

      // After short delay redirect to login
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white text-slate-900 flex">
      {/* Left visual side */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={bg}
            alt="Medical background"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-sky-200/70 via-blue-200/60 to-white" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-blue-100 px-4 py-1 text-xs font-medium text-blue-700 mb-6 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Patient registration
            </div>
            <h2 className="text-4xl xl:text-5xl font-semibold text-slate-900 leading-tight">
              Create your <span className="text-blue-600">Clinical</span>{" "}
              account
            </h2>
            <p className="mt-4 text-sm xl:text-base text-slate-700 max-w-lg">
              Register once using your email and Citizenship ID to access lab
              tests, reports and consultations.
            </p>
          </div>
        </div>
      </div>

      {/* Right form side */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-8">
        <AuthCard
          title="Create your account"
          subtitle="Fill the details below to register as a patient."
          footerText="Already have an account?"
          footerLinkText="Sign in"
          footerLinkTo="/"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              name="name"
              type="text"
              required
              placeholder="Patient Name"
              value={form.name}
              onChange={handleChange}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />
            <Input
              label="Citizenship ID"
              name="citizenshipId"
              type="text"
              required
              placeholder="01-01-000000"
              value={form.citizenshipId}
              onChange={handleChange}
            />
            <Input
              label="Password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />
            <Input
              label="Confirm password"
              name="confirmPassword"
              type="password"
              required
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
            />

            {/* Error / success messages */}
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
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-[11px] text-slate-500">
            By creating an account you agree to Clinical&apos;s terms and
            privacy policy.
          </p>
        </AuthCard>
      </div>
    </div>
  );
};

export default Register;

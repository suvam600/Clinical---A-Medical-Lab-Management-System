// src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";
import bg from "../assets/medical-bg.svg";

const API_BASE = "/api";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // non-JSON response
      }

      if (!res.ok) {
        throw new Error(data.message || text || "Login failed");
      }

      // Save token + user
      if (data.token) {
        localStorage.setItem("token", data.token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Role-based navigation
      if (data.user?.role === "technician") {
        navigate("/technician"); // TechnicianDashboard route
      } else {
        navigate("/dashboard");  // Patient dashboard
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white text-slate-900 flex">
      {/* Left / Background side */}
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
              Secure Lab Management
            </div>
            <h2 className="text-4xl xl:text-5xl font-semibold text-slate-900 leading-tight">
              Welcome to <span className="text-blue-600">Clinical</span>
            </h2>
            <p className="mt-4 text-sm xl:text-base text-slate-700 max-w-lg">
              Manage patients, tests, and lab reports in one secure platform.
              Fast, accurate, and designed for modern medical labs in Nepal.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md text-xs text-slate-700">
            <div className="rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm">
              <p className="font-semibold text-sm mb-1">Real-time tracking</p>
              <p>Follow every sample from collection to report.</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm">
              <p className="font-semibold text-sm mb-1">Secure records</p>
              <p>Encrypted patient profiles with Citizenship ID.</p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-white/90 p-4 shadow-sm">
              <p className="font-semibold text-sm mb-1">Doctor access</p>
              <p>Instant access to lab reports & notes.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right / Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-8">
        <AuthCard
          title="Sign in to Clinical"
          subtitle="Access your lab dashboard, manage tests and medical reports."
          footerText="Don't have an account?"
          footerLinkText="Create an account"
          footerLinkTo="/register"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
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
              label="Password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
            />

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-2 py-1">
                {error}
              </p>
            )}

            {/* Keep me signed in + Forgot password */}
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Keep me signed in</span>
              </label>
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-400/40 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or continue as</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Buttons */}
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 transition">
              Patient
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 transition">
              Staff / Doctor
            </button>
          </div>
        </AuthCard>
      </div>
    </div>
  );
};

export default Login;

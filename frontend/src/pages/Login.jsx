import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard";
import Input from "../components/Input";

const API_BASE = "/api";

const Login = () => {
  const [mode, setMode] = useState("login"); // login | forgot | reset

  const [form, setForm] = useState({
    email: "",
    password: "",
    code: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed.");

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const role = (data.user.role || "").toLowerCase();

      if (role === "admin") navigate("/admin");
      else if (role === "technician") navigate("/technician");
      else if (role === "doctor") navigate("/doctor");
      else navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // SEND RESET CODE
  const handleForgot = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send code.");

      setMessage("Code sent to your email.");
      setMode("reset");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // RESET PASSWORD
  const handleReset = async () => {
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          code: form.code.trim(),
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password.");

      setMessage("Password reset successful. You can login.");
      setMode("login");
      setForm((prev) => ({
        ...prev,
        password: "",
        code: "",
        newPassword: "",
      }));
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-white px-4">
      <div className="w-full max-w-md">
        <AuthCard
          title={
            mode === "login"
              ? "Sign in"
              : mode === "forgot"
              ? "Forgot Password"
              : "Reset Password"
          }
          subtitle="Secure access to your account"
        >
          {/* LOGIN */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
              />

              <Input
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
              />

              <div className="flex justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setMessage("");
                    setMode("forgot");
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-white font-semibold hover:bg-blue-700 disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>

              {/* ✅ RESTORED SIGN UP LINK */}
              <p className="text-center text-sm text-slate-600 mt-4">
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create an account
                </button>
              </p>
            </form>
          )}

          {/* FORGOT */}
          {mode === "forgot" && (
            <div className="space-y-4">
              <Input
                label="Enter your email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />

              <button
                type="button"
                onClick={handleForgot}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-white font-semibold hover:bg-blue-700 disabled:opacity-70"
              >
                {loading ? "Sending..." : "Send Code"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setMode("login");
                }}
                className="text-sm text-slate-600 hover:text-blue-600"
              >
                Back to login
              </button>
            </div>
          )}

          {/* RESET */}
          {mode === "reset" && (
            <div className="space-y-4">
              <Input
                label="Verification Code"
                name="code"
                type="text"
                value={form.code}
                onChange={handleChange}
                placeholder="Enter 6-digit code"
                required
              />

              <Input
                label="New Password"
                name="newPassword"
                type="password"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                required
              />

              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-white font-semibold hover:bg-blue-700 disabled:opacity-70"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError("");
                  setMessage("");
                  setMode("login");
                }}
                className="text-sm text-slate-600 hover:text-blue-600"
              >
                Back to login
              </button>
            </div>
          )}

          {message && <p className="mt-3 text-sm text-green-600">{message}</p>}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </AuthCard>
      </div>
    </div>
  );
};

export default Login;
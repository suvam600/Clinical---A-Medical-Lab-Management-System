import React, { useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Settings, X } from "lucide-react";

const API_BASE = "/api";

export default function PatientLayout() {
  const navigate = useNavigate();

  const [showSettings, setShowSettings] = useState(false);
  const [activeModal, setActiveModal] = useState(""); // profile | reset | terms
  const [loading, setLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const [resetForm, setResetForm] = useState({
    code: "",
    newPassword: "",
  });

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const patientName = user?.name || "Patient";
  const patientEmail = user?.email || "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const openModal = (name) => {
    setShowSettings(false);
    setSettingsError("");
    setSettingsMessage("");
    setActiveModal(name);
  };

  const closeModal = () => {
    setActiveModal("");
    setSettingsError("");
    setSettingsMessage("");
    setResetForm({
      code: "",
      newPassword: "",
    });
  };

  const handleSendResetCode = async () => {
    try {
      setLoading(true);
      setSettingsError("");
      setSettingsMessage("");

      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: patientEmail }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to send code.");
      }

      setSettingsMessage("Verification code sent to your registered email.");
    } catch (err) {
      setSettingsError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setSettingsError("");
      setSettingsMessage("");

      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: patientEmail,
          code: resetForm.code,
          newPassword: resetForm.newPassword,
        }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSettingsMessage("Password reset successful.");
      setResetForm({
        code: "",
        newPassword: "",
      });
    } catch (err) {
      setSettingsError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const linkBase =
    "block px-5 py-3 rounded-lg transition border border-transparent";
  const linkInactive = "hover:bg-blue-100";
  const linkActive = "bg-blue-100 border-blue-200";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100">
      {/* Top bar */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur relative">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Clinical</p>
              <p className="text-xs text-slate-500">
                Medical Lab Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm relative">
            <span className="text-slate-500 hidden sm:inline">Welcome,</span>
            <span className="font-semibold text-slate-900">{patientName}</span>

            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className="rounded-lg p-2 hover:bg-slate-100 transition"
              title="Settings"
            >
              <Settings size={20} className="text-slate-700" />
            </button>

            {showSettings && (
              <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-slate-200 bg-white shadow-xl p-2">
                <button
                  onClick={() => openModal("profile")}
                  className="w-full text-left rounded-xl px-4 py-2.5 text-sm hover:bg-slate-100"
                >
                  Edit profile
                </button>

                <button
                  onClick={() => openModal("reset")}
                  className="w-full text-left rounded-xl px-4 py-2.5 text-sm hover:bg-slate-100"
                >
                  Reset password
                </button>

                <button
                  onClick={() => openModal("terms")}
                  className="w-full text-left rounded-xl px-4 py-2.5 text-sm hover:bg-slate-100"
                >
                  Terms & conditions
                </button>

                <button
                  className="w-full text-left rounded-xl px-4 py-2.5 text-sm hover:bg-slate-100"
                >
                  Notification settings
                </button>

                <div className="my-2 border-t border-slate-200" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left rounded-xl px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 w-full">
        <div className="w-full flex">
          {/* Sidebar */}
          <aside className="hidden md:flex w-72 shrink-0">
            <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-b from-blue-50 to-sky-100 text-slate-800 border-r border-blue-100">
              <div className="px-5 py-4 border-b border-blue-100">
                <p className="text-lg font-semibold text-slate-900">My Lab</p>
                <p className="text-xs text-slate-500 mt-1">{patientName}</p>
              </div>

              <nav className="py-3 text-sm">
                <NavLink
                  to="/dashboard"
                  end
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  <div className="font-medium text-slate-900">Dashboard</div>
                  <span className="block text-[11px] text-slate-500">
                    Overview and active tests
                  </span>
                </NavLink>

                <NavLink
                  to="/register-tests"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  <div className="font-medium text-slate-900">
                    Register for tests
                  </div>
                  <span className="block text-[11px] text-slate-500">
                    Browse tests and request investigations
                  </span>
                </NavLink>

                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  <div className="font-medium text-slate-900">View reports</div>
                  <span className="block text-[11px] text-slate-500">
                    Open completed lab reports
                  </span>
                </NavLink>

                <NavLink
                  to="/active-tests"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  <div className="font-medium text-slate-900">Active tests</div>
                  <span className="block text-[11px] text-slate-500">
                    Track sample and processing status
                  </span>
                </NavLink>

                <NavLink
                  to="/consult"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  <div className="font-medium text-slate-900">
                    Consult a doctor
                  </div>
                  <span className="block text-[11px] text-slate-500">
                    Find doctors and book consultation
                  </span>
                </NavLink>
              </nav>
            </div>
          </aside>

          {/* Page content */}
          <main className="flex-1 bg-slate-50 px-6 py-6 md:px-10 md:py-10">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-900">Clinical</p>
            <p className="mt-2 text-xs text-slate-500 max-w-sm">
              Clinical is a medical lab management system to help patients track
              tests, access reports, and connect with medical staff securely.
            </p>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Contact</p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>Email: support@clinical.com</li>
              <li>Phone: +977-98XXXXXXXX</li>
              <li>Location: Nepal</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-slate-900">Social</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-1 hover:border-blue-400 hover:text-blue-700">
                Facebook
              </button>
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-1 hover:border-blue-400 hover:text-blue-700">
                Instagram
              </button>
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-1 hover:border-blue-400 hover:text-blue-700">
                LinkedIn
              </button>
              <button className="rounded-lg border border-slate-200 bg-white px-3 py-1 hover:border-blue-400 hover:text-blue-700">
                GitHub
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-4 flex items-center justify-between text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Clinical. All rights reserved.</span>
          <div className="flex gap-3">
            <button className="hover:text-blue-600">Privacy</button>
            <button className="hover:text-blue-600">Terms</button>
          </div>
        </div>
      </footer>

      {/* Overlay */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center px-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {activeModal === "profile" && "Edit Profile"}
                {activeModal === "reset" && "Reset Password"}
                {activeModal === "terms" && "Terms & Conditions"}
              </h2>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              {activeModal === "profile" && (
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    Profile editing UI can be added next here.
                  </p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Current Name</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {patientName}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium text-slate-900 mt-1">
                      {patientEmail || "—"}
                    </p>
                  </div>
                </div>
              )}

              {activeModal === "reset" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Registered Email</p>
                    <p className="font-medium text-slate-900 mt-1 break-all">
                      {patientEmail}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendResetCode}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                  >
                    {loading ? "Sending code..." : "Send verification code"}
                  </button>

                  <form onSubmit={handleResetPassword} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Verification Code
                      </label>
                      <input
                        type="text"
                        value={resetForm.code}
                        onChange={(e) =>
                          setResetForm((prev) => ({
                            ...prev,
                            code: e.target.value,
                          }))
                        }
                        placeholder="Enter 6-digit code"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={resetForm.newPassword}
                        onChange={(e) =>
                          setResetForm((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        placeholder="Enter new password"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    >
                      {loading ? "Resetting..." : "Reset password"}
                    </button>
                  </form>

                  {settingsMessage && (
                    <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
                      {settingsMessage}
                    </p>
                  )}

                  {settingsError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                      {settingsError}
                    </p>
                  )}
                </div>
              )}

              {activeModal === "terms" && (
                <div className="space-y-3 text-sm text-slate-600 leading-6">
                  <p>
                    By using Clinical, you agree to use the system responsibly
                    and provide accurate information during registration and lab
                    service requests.
                  </p>
                  <p>
                    Patient information, reports, and consultations are handled
                    securely and should not be misused or shared without proper
                    permission.
                  </p>
                  <p>
                    Clinical may update system rules, privacy practices, and
                    service availability as needed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
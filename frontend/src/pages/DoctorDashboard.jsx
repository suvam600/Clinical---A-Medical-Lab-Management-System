// src/pages/DoctorDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function DoctorDashboard() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();
      const res = await fetch(`${API_BASE}/consultations/doctor`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load consultations.");
      }

      setConsultations(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "Failed to load consultations.");
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  const activeCount = consultations.filter((c) => c.status === "Active").length;
  const closedCount = consultations.filter((c) => c.status === "Closed").length;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100">
      {/* Top bar */}
      <header className="w-full border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Clinical</p>
              <p className="text-xs text-slate-500">Doctor Consultation Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 hidden sm:inline">Welcome,</span>
            <span className="font-semibold text-slate-900">
              {user?.name || "Doctor"}
            </span>
            <button
              className="text-xs text-slate-500 hover:text-red-500"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Hero / Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 rounded-2xl border border-blue-100 bg-white shadow-sm p-6">
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">
              Doctor dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              View all patient consultation requests, open individual chats,
              review uploaded files, and respond with feedback or guidance in
              real time.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4">
                <p className="text-xs text-slate-500">Total consultations</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {loading ? "..." : consultations.length}
                </p>
              </div>

              <div className="rounded-xl border border-green-100 bg-green-50/60 px-4 py-4">
                <p className="text-xs text-slate-500">Active consultations</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {loading ? "..." : activeCount}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4">
                <p className="text-xs text-slate-500">Closed consultations</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {loading ? "..." : closedCount}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <p className="text-xs text-slate-500">Doctor profile</p>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-xs text-slate-500">Name</p>
                <p className="font-semibold text-slate-900">
                  {user?.name || "Doctor"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-semibold text-slate-900">
                  {user?.email || "doctor@gmail.com"}
                </p>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-sm font-medium text-slate-900">Doctor</p>
              </div>
            </div>
          </div>
        </section>

        {/* Consultation list */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Patient consultations
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Only patients who clicked “Consult a doctor” will appear here.
              </p>
            </div>

            <button
              type="button"
              onClick={loadConsultations}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-slate-600">Loading...</p>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : consultations.length === 0 ? (
            <p className="text-sm text-slate-600">
              No consultation requests yet.
            </p>
          ) : (
            <div className="space-y-3">
              {consultations.map((c) => {
                const patient = c?.patientId || {};
                const createdText = c?.createdAt
                  ? new Date(c.createdAt).toLocaleString()
                  : "—";

                return (
                  <div
                    key={c._id}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                      <div>
                        <p className="text-xs text-slate-500">Patient Name</p>
                        <p className="font-semibold text-slate-900 mt-1">
                          {patient?.name || "Patient"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Citizenship ID</p>
                        <p className="font-semibold text-slate-900 mt-1">
                          {patient?.citizenshipId || "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="font-semibold text-slate-900 mt-1 break-all">
                          {patient?.email || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-left lg:text-right">
                        <p className="text-xs text-slate-500">Created</p>
                        <p className="text-sm font-medium text-slate-900 mt-1">
                          {createdText}
                        </p>
                      </div>

                      <span
                        className={`text-[11px] font-semibold px-3 py-1 rounded-full ${
                          c.status === "Active"
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => navigate(`/doctor/consult/${c._id}`)}
                        className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
                      >
                        Open chat
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
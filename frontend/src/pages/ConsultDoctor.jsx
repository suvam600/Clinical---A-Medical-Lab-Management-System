// src/pages/ConsultDoctor.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token") || "";
}

export default function ConsultDoctor() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [consultations, setConsultations] = useState([]);
  const [error, setError] = useState("");

  const loadConsultations = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();
      const res = await fetch(`${API_BASE}/consultations/patient`, {
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

      if (!res.ok) {
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

  const activeConsultation = useMemo(() => {
    return consultations.find((c) => c.status === "Active") || null;
  }, [consultations]);

  const handleCreateOrOpen = async () => {
    try {
      setCreating(true);
      setError("");

      if (activeConsultation?._id) {
        navigate(`/consult/${activeConsultation._id}`);
        return;
      }

      const token = getToken();
      const res = await fetch(`${API_BASE}/consultations/request`, {
        method: "POST",
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

      if (!res.ok || !data.success || !data.data?._id) {
        throw new Error(data.message || "Failed to create consultation.");
      }

      navigate(`/consult/${data.data._id}`);
    } catch (err) {
      setError(err.message || "Failed to create consultation.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className="lg:col-span-2 rounded-2xl border border-blue-100 bg-white shadow-sm p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                Consult a doctor
              </h1>
              <p className="mt-2 text-sm text-slate-600 max-w-2xl">
                Start a secure consultation with the doctor, discuss your lab
                reports, and send extra report files such as images or PDF
                documents directly in chat.
              </p>
            </div>

            <div className="hidden sm:block rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-right">
              <p className="text-xs text-slate-500">Patient</p>
              <p className="text-sm font-semibold text-slate-900">
                {user?.name || "Patient"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-xs text-slate-500">Consultation status</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {loading
                  ? "Loading..."
                  : activeConsultation
                  ? "Active consultation"
                  : "No active consultation"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-xs text-slate-500">Total consultations</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {loading ? "..." : consultations.length}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-xs text-slate-500">Attachments supported</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                PDF, JPG, PNG
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Secure doctor consultation
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Use this feature after receiving your lab reports or whenever you
              need clarification from the doctor. You can send text messages and
              upload report files for review.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCreateOrOpen}
                disabled={creating || loading}
                className="rounded-xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {creating
                  ? "Opening..."
                  : activeConsultation
                  ? "Open consultation chat"
                  : "Start consultation"}
              </button>

              {activeConsultation ? (
                <button
                  type="button"
                  onClick={() => navigate(`/consult/${activeConsultation._id}`)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Resume active chat
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            How it works
          </h2>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="font-medium text-slate-900">1. Start consultation</p>
              <p className="mt-1 text-xs">
                Click the consultation button to create your secure doctor chat.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="font-medium text-slate-900">2. Share reports</p>
              <p className="mt-1 text-xs">
                Send a message and upload PDF or image reports for doctor review.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="font-medium text-slate-900">3. Receive feedback</p>
              <p className="mt-1 text-xs">
                The doctor can reply with advice, follow-up notes, and guidance.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Consultation history
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your previous and current doctor consultations appear here.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-600">Loading...</p>
        ) : consultations.length === 0 ? (
          <p className="text-sm text-slate-600">
            No consultations yet. Start a consultation to connect with the
            doctor.
          </p>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => {
              const doctorName = c?.doctorId?.name || "Doctor";
              const createdText = c?.createdAt
                ? new Date(c.createdAt).toLocaleString()
                : "—";

              return (
                <div
                  key={c._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{doctorName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Consultation ID:{" "}
                      <span className="font-medium text-slate-700">
                        {String(c._id).slice(-8).toUpperCase()}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Created: {createdText}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
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
                      onClick={() => navigate(`/consult/${c._id}`)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
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
    </div>
  );
}
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
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [creatingDoctorId, setCreatingDoctorId] = useState("");
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
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

  const loadDoctors = async (specialization = "") => {
    try {
      setLoadingDoctors(true);
      setError("");

      const token = getToken();

      const url = specialization
        ? `${API_BASE}/consultations/doctors?specialization=${encodeURIComponent(
            specialization
          )}`
        : `${API_BASE}/consultations/doctors`;

      const res = await fetch(url, {
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
        throw new Error(data.message || "Failed to load doctors.");
      }

      setDoctors(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "Failed to load doctors.");
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    loadConsultations();
    loadDoctors();
  }, []);

  const activeConsultation = useMemo(() => {
    return consultations.find((c) => c.status === "Active") || null;
  }, [consultations]);

  const specializations = useMemo(() => {
    const values = doctors.map((d) => d.specialization).filter(Boolean);
    return Array.from(new Set(values));
  }, [doctors]);

  const handleSpecializationChange = (e) => {
    const value = e.target.value;
    setSelectedSpecialization(value);
    loadDoctors(value);
  };

  const handleSelectDoctor = async (doctorId) => {
    try {
      setCreatingDoctorId(doctorId);
      setError("");

      if (activeConsultation?._id) {
        navigate(`/consult/${activeConsultation._id}`);
        return;
      }

      const token = getToken();
      const res = await fetch(`${API_BASE}/consultations/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctorId }),
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
      setCreatingDoctorId("");
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
                Choose a doctor based on your health concern, specialization,
                degree, and experience. You can chat securely and share report
                files.
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
              <p className="text-xs text-slate-500">Doctors available</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {loadingDoctors ? "..." : doctors.length}
              </p>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {activeConsultation ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <h2 className="text-sm font-semibold text-green-900">
                You already have an active consultation
              </h2>
              <p className="mt-2 text-sm text-green-800">
                Open your active chat before starting a new one.
              </p>

              <button
                type="button"
                onClick={() => navigate(`/consult/${activeConsultation._id}`)}
                className="mt-4 rounded-xl bg-green-700 text-white px-5 py-2.5 text-sm font-semibold hover:bg-green-800"
              >
                Open active chat
              </button>
            </div>
          ) : null}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Choose doctor by specialization
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Select the type of doctor you need, then choose from the list.
                </p>
              </div>

              <select
                value={selectedSpecialization}
                onChange={handleSpecializationChange}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All specializations</option>
                {specializations.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              {loadingDoctors ? (
                <p className="text-sm text-slate-600">Loading doctors...</p>
              ) : doctors.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No doctors available for this specialization.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => {
                    const doctorName =
                      doctor?.userId?.name || doctor?.name || "Doctor";
                    const doctorEmail = doctor?.userId?.email || "—";

                    return (
                      <div
                        key={doctor._id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900">
                              {doctorName}
                            </h3>
                            <p className="text-xs text-slate-500 break-all">
                              {doctorEmail}
                            </p>
                          </div>

                          <span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-[11px] font-semibold">
                            {doctor.specialization || "Doctor"}
                          </span>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                          <p>
                            <span className="text-slate-500">Degree: </span>
                            <span className="font-medium text-slate-900">
                              {doctor.degree || "—"}
                            </span>
                          </p>

                          <p>
                            <span className="text-slate-500">Experience: </span>
                            <span className="font-medium text-slate-900">
                              {doctor.experience || "—"}
                            </span>
                          </p>

                          

                          {doctor.description ? (
                            <p className="text-xs text-slate-600 leading-5">
                              {doctor.description}
                            </p>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectDoctor(doctor._id)}
                          disabled={
                            Boolean(activeConsultation) ||
                            creatingDoctorId === doctor._id
                          }
                          className="mt-5 w-full rounded-xl bg-blue-600 text-white px-5 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {creatingDoctorId === doctor._id
                            ? "Opening..."
                            : "Select doctor"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            How it works
          </h2>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="font-medium text-slate-900">1. Choose category</p>
              <p className="mt-1 text-xs">
                Select the specialization based on your report or health issue.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="font-medium text-slate-900">2. Select doctor</p>
              <p className="mt-1 text-xs">
                View the doctor profile, degree, experience, and details.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="font-medium text-slate-900">3. Start chat</p>
              <p className="mt-1 text-xs">
                Send messages and upload PDF or image reports for review.
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
            No consultations yet. Select a doctor to start your first
            consultation.
          </p>
        ) : (
          <div className="space-y-3">
            {consultations.map((c) => {
              const doctorName =
                c?.doctorId?.userId?.name || c?.doctorId?.name || "Doctor";
              const specialization = c?.doctorId?.specialization || "—";
              const createdText = c?.createdAt
                ? new Date(c.createdAt).toLocaleString()
                : "—";

              return (
                <div
                  key={c._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {doctorName}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Specialization: {specialization}
                    </p>
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
// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const statusPill = (status) => {
  const base = "text-[11px] font-semibold px-3 py-1 rounded-full";
  if (status === "Booked") return `${base} bg-slate-100 text-slate-700`;
  if (status === "Sample Collected") return `${base} bg-amber-50 text-amber-700`;
  if (status === "Processing") return `${base} bg-blue-50 text-blue-700`;
  if (status === "Report Published") return `${base} bg-green-50 text-green-700`;
  return `${base} bg-slate-100 text-slate-700`;
};

const Dashboard = () => {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const patientName = user?.name || "Patient";

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoadingBookings(true);
        const token = localStorage.getItem("token");

        const res = await fetch("/api/bookings/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setBookings(data.data || []);
        } else {
          setBookings([]);
        }
      } catch {
        setBookings([]);
      } finally {
        setLoadingBookings(false);
      }
    };

    loadBookings();
  }, []);

  // Flatten bookings -> tests
  const activeTests = useMemo(() => {
    const out = [];
    for (const b of bookings) {
      for (const t of b.tests || []) {
        out.push({
          bookingId: b._id,
          createdAt: b.createdAt,
          bookingStatus: b.bookingStatus,
          testName: t.name,
        });
      }
    }
    // newest first
    out.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return out;
  }, [bookings]);

  const latestTwo = activeTests.slice(0, 2);

  return (
    <div className="max-w-6xl">
      {/* Welcome + quick actions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-2xl border border-blue-100 bg-white shadow-sm p-6">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900">
            Welcome back, {patientName} 👋
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Use the sidebar to access all features. Track your tests, view
            reports, and consult doctors from one place.
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => navigate("/register-tests")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-400 hover:shadow-sm transition"
            >
              <p className="text-xs font-semibold text-slate-900">
                Register for tests
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Choose from available lab tests
              </p>
            </button>

            <button
              onClick={() => navigate("/reports")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-400 hover:shadow-sm transition"
            >
              <p className="text-xs font-semibold text-slate-900">View reports</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Download completed reports
              </p>
            </button>

            <button
              onClick={() => navigate("/consult")}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-400 hover:shadow-sm transition"
            >
              <p className="text-xs font-semibold text-slate-900">
                Consult doctor
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Book appointment after reports
              </p>
            </button>
          </div>
        </div>

        {/* Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
          <p className="text-xs text-slate-500">Overview</p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-xs text-slate-500">Upcoming appointment</p>
              <p className="font-semibold text-slate-900">None scheduled</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <p className="text-xs text-slate-500">Active tests</p>
              <p className="font-semibold text-slate-900">
                {loadingBookings ? "…" : activeTests.length}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs text-slate-500">Tip</p>
              <p className="text-sm font-medium text-slate-900">
                Use the sidebar for all features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Active tests + profile */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Active tests</h2>

            <button
              onClick={() => navigate("/active-tests")}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>

          {loadingBookings ? (
            <p className="text-sm text-slate-600">Loading…</p>
          ) : latestTwo.length === 0 ? (
            <p className="text-sm text-slate-600">
              No active tests yet. Register a test to get started.
            </p>
          ) : (
            <ul className="space-y-3 text-xs">
              {latestTwo.map((x, idx) => {
                const shortId = x.bookingId.slice(-6).toUpperCase();
                return (
                  <li
                    key={`${x.bookingId}-${idx}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{x.testName}</p>
                      <p className="text-[11px] text-slate-500">
                        Request ID: #{shortId}
                      </p>
                    </div>
                    <span className={statusPill(x.bookingStatus)}>
                      {x.bookingStatus}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 text-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Your profile
          </h2>

          <div className="space-y-2">
            <p>
              <span className="text-slate-500">Name: </span>
              <span className="font-medium text-slate-900">{patientName}</span>
            </p>
            <p>
              <span className="text-slate-500">Citizenship ID: </span>
              <span className="font-medium text-slate-900">
                {user?.citizenshipId || "—"}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Email: </span>
              <span className="font-medium text-slate-900">
                {user?.email || "—"}
              </span>
            </p>
          </div>

          <button
            onClick={() => navigate("/profile")}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 transition w-full"
          >
            Edit profile
          </button>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;

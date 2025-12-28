// src/pages/TechnicianDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";

const TechnicianDashboard = () => {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const techName = user?.name || "Lab Technician";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadQueue = async () => {
    try {
      setLoading(true);
      setErr("");

      const token = localStorage.getItem("token");
      const res = await fetch("/api/bookings/queue", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load technician queue");
      }

      const flattened = [];
      for (const b of data.data || []) {
        const patient = b.patientUserId || {};
        const patientName = patient.name || "Unknown";
        const citizenshipId = patient.citizenshipId || "—";

        (b.tests || []).forEach((t, idx) => {
          const short = String(b._id).slice(-6).toUpperCase();
          const sampleId = `SMP-${short}-${idx + 1}`;

          const displayStatus =
            b.bookingStatus === "Booked"
              ? "Awaiting Collection"
              : b.bookingStatus === "Sample Collected"
              ? "Sample Collected"
              : b.bookingStatus === "Processing"
              ? "In Processing"
              : b.bookingStatus === "Report Published"
              ? "Completed"
              : b.bookingStatus;

          const time = b.createdAt
            ? new Date(b.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          flattened.push({
            sampleId,
            bookingId: b._id,
            testName: t.name,
            displayStatus,
            time,
            patientName,
            citizenshipId,
          });
        });
      }

      flattened.sort((a, b) => String(b.bookingId).localeCompare(String(a.bookingId)));
      setRows(flattened);
    } catch (e) {
      setErr(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getStatusBadge = (status) => {
    let style = "bg-slate-100 text-slate-700";
    if (status === "Awaiting Collection") style = "bg-amber-50 text-amber-700";
    else if (status === "Sample Collected") style = "bg-sky-50 text-sky-700";
    else if (status === "In Processing") style = "bg-blue-50 text-blue-700";
    else if (status === "Completed") style = "bg-emerald-50 text-emerald-700";

    return (
      <span className={`text-[11px] font-semibold px-3 py-1 rounded-full ${style}`}>
        {status}
      </span>
    );
  };

  const pendingProcessingCount = rows.filter(
    (r) => r.displayStatus === "Sample Collected" || r.displayStatus === "In Processing"
  ).length;

  const queueCount = rows.length;

  const recentActivities = useMemo(() => {
    return rows.slice(0, 4).map((r) => {
      const short = String(r.bookingId).slice(-6).toUpperCase();
      return `Queue item: SMP-${short} → ${r.displayStatus} (${r.testName})`;
    });
  }, [rows]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100">
      {/* Header */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Clinical</p>
              <p className="text-xs text-slate-500">Lab Technician Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 hidden sm:inline">Welcome,</span>
            <span className="font-semibold text-slate-900">{techName}</span>
            <button
              className="text-xs text-slate-500 hover:text-red-500"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 w-full">
        <div className="w-full flex">
          {/* ✅ LEFT DETAILS PANEL (was right side before) */}
          <aside className="hidden lg:flex w-80 shrink-0">
            <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-b from-blue-50 to-sky-100 border-r border-blue-100 px-4 py-4 space-y-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">My Lab</p>
                <p className="text-xs text-slate-500 mt-1">{techName}</p>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <p className="text-xs text-slate-500">Summary</p>
                <div className="mt-3 space-y-3 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <p className="text-slate-500">Tests in queue</p>
                    <p className="font-semibold text-slate-900">{queueCount}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                    <p className="text-slate-500">Pending processing</p>
                    <p className="font-semibold text-slate-900">{pendingProcessingCount}</p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-slate-500">Tip</p>
                    <p className="text-sm font-medium text-slate-900">
                      Verify identity &amp; label every sample.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent activity */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Recent activity
                </h2>
                <ul className="space-y-2">
                  {(recentActivities.length
                    ? recentActivities
                    : ["No recent activity yet."]).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700">
                      <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick navigation */}
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 text-xs">
                <h2 className="text-sm font-semibold text-slate-900 mb-2">
                  Quick navigation
                </h2>
                <div className="flex flex-col gap-2">
                  <button className="text-left text-blue-600 hover:text-blue-700 underline underline-offset-2">
                    All pending tests
                  </button>
                  <button className="text-left text-blue-600 hover:text-blue-700 underline underline-offset-2">
                    Completed reports
                  </button>
                  <button className="text-left text-blue-600 hover:text-blue-700 underline underline-offset-2">
                    Incident logs
                  </button>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition border border-red-100 bg-white"
              >
                <div className="font-medium">Logout</div>
                <span className="block text-[11px] text-red-500/80">
                  Sign out from Clinical
                </span>
              </button>
            </div>
          </aside>

          {/* ✅ MAIN TABLE FULL WIDTH */}
          <main className="flex-1 bg-slate-50 px-4 py-5 md:px-8 md:py-8">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-900">Test Queue</h2>
                <button
                  onClick={loadQueue}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Refresh
                </button>
              </div>

              {err && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {err}
                </div>
              )}

              <div className="overflow-x-auto max-h-[75vh]">
                <table className="min-w-full text-xs">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-[11px] text-slate-500 border-b border-slate-100">
                      <th className="py-2 pr-3">Sample ID</th>
                      <th className="py-2 pr-3">Patient (Citizenship ID)</th>
                      <th className="py-2 pr-3">Test</th>
                      <th className="py-2 pr-3">Time</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="py-6 text-slate-600" colSpan={6}>
                          Loading queue…
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td className="py-6 text-slate-600" colSpan={6}>
                          No booked tests in the queue yet.
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.sampleId} className="border-b border-slate-50 last:border-0">
                          <td className="py-3 pr-3 font-medium text-slate-900">{r.sampleId}</td>
                          <td className="py-3 pr-3 text-slate-700">
                            {r.patientName}
                            <div className="text-[11px] text-slate-500">{r.citizenshipId}</div>
                          </td>
                          <td className="py-3 pr-3 text-slate-700">{r.testName}</td>
                          <td className="py-3 pr-3 text-slate-500">{r.time}</td>
                          <td className="py-3 pr-3">{getStatusBadge(r.displayStatus)}</td>
                          <td className="py-3 pr-3 text-right">
                            <div className="inline-flex gap-2">
                              <button className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:text-blue-600">
                                Update
                              </button>
                              <button className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:text-emerald-600">
                                Enter result
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;

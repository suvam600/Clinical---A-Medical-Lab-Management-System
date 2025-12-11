// src/pages/TechnicianDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const TechnicianDashboard = () => {
  // 🧹 Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/"; // redirect to login
  };

  // Dummy sample data
  const todaySamples = [
    {
      id: "SMP-1023",
      patientName: "Ram Bahadur",
      test: "Complete Blood Count (CBC)",
      status: "Awaiting Collection",
      time: "09:15 AM",
    },
    {
      id: "SMP-1024",
      patientName: "Sita Sharma",
      test: "Liver Function Test",
      status: "Sample Collected",
      time: "09:40 AM",
    },
    {
      id: "SMP-1025",
      patientName: "Hari Prasad",
      test: "Fasting Blood Sugar",
      status: "In Processing",
      time: "10:05 AM",
    },
  ];

  const recentActivities = [
    "Marked SMP-1018 as 'Completed' (CBC)",
    "Labeled sample SMP-1019 for Thyroid Panel",
    "Reported incident: clotted sample for SMP-1015",
  ];

  const getStatusBadge = (status) => {
    let style = "bg-slate-100 text-slate-700";

    if (status === "Awaiting Collection") {
      style = "bg-amber-50 text-amber-700";
    } else if (status === "Sample Collected") {
      style = "bg-sky-50 text-sky-700";
    } else if (status === "In Processing") {
      style = "bg-blue-50 text-blue-700";
    } else if (status === "Completed") {
      style = "bg-emerald-50 text-emerald-700";
    }

    return (
      <span
        className={`text-[11px] font-semibold px-2 py-1 rounded-full ${style}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100">
      {/* Top Bar */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Clinical</p>
              <p className="text-xs text-slate-500">Lab Technician Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-slate-500">Logged in as</span>
              <span className="font-medium text-slate-900">
                Technician Name
              </span>
            </div>
            <button
              className="text-xs text-slate-500 hover:text-red-500"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Header */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Lab work overview 🧪
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage today&apos;s samples, update statuses, and process tests
                efficiently.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm min-w-[150px]">
                <p className="text-slate-500">Samples today</p>
                <p className="font-semibold text-slate-900">
                  {todaySamples.length}
                </p>
              </div>

              <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm min-w-[150px]">
                <p className="text-slate-500">Pending processing</p>
                <p className="font-semibold text-slate-900">
                  {
                    todaySamples.filter(
                      (s) =>
                        s.status === "Sample Collected" ||
                        s.status === "In Processing"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick action buttons */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-left text-xs hover:border-blue-500 hover:shadow-md transition h-full">
            <p className="text-[11px] font-semibold text-blue-600 mb-1">
              + Scan sample barcode
            </p>
            <p className="text-slate-600">
              Quickly pull up sample details by scanning barcode/QR.
            </p>
          </button>

          <button className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-left text-xs hover:border-blue-500 hover:shadow-md transition h-full">
            <p className="text-[11px] font-semibold mb-1">Add manual sample</p>
            <p className="text-slate-600">
              Register a new patient sample manually.
            </p>
          </button>

          <button className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-left text-xs hover:border-blue-500 hover:shadow-md transition h-full">
            <p className="text-[11px] font-semibold mb-1">View all tests</p>
            <p className="text-slate-600">Browse and manage ongoing tests.</p>
          </button>

          <button className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-left text-xs hover:border-blue-500 hover:shadow-md transition h-full">
            <p className="text-[11px] font-semibold text-rose-600 mb-1">
              Incident log
            </p>
            <p className="text-slate-600">
              Record issues like clotted samples or errors.
            </p>
          </button>
        </section>

        {/* Queue + Sidebar */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Sample table */}
          <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Today&apos;s sample queue
              </h2>
              <button className="text-xs text-blue-600 hover:text-blue-700">
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-[11px] text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-3">Sample ID</th>
                    <th className="py-2 pr-3">Patient</th>
                    <th className="py-2 pr-3">Test</th>
                    <th className="py-2 pr-3">Time</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {todaySamples.map((sample) => (
                    <tr
                      key={sample.id}
                      className="border-b border-slate-50 last:border-0"
                    >
                      <td className="py-2 pr-3 font-medium text-slate-900">
                        {sample.id}
                      </td>
                      <td className="py-2 pr-3 text-slate-700">
                        {sample.patientName}
                      </td>
                      <td className="py-2 pr-3 text-slate-700">
                        {sample.test}
                      </td>
                      <td className="py-2 pr-3 text-slate-500">
                        {sample.time}
                      </td>
                      <td className="py-2 pr-3">
                        {getStatusBadge(sample.status)}
                      </td>

                      <td className="py-2 pr-3 text-right">
                        <div className="inline-flex gap-1">
                          <button className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 hover:border-blue-500 hover:text-blue-600">
                            Update
                          </button>
                          <button className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 hover:border-emerald-500 hover:text-emerald-600">
                            Enter result
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Activity */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-xs">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Recent activity
              </h2>

              <ul className="space-y-2">
                {recentActivities.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-slate-700"
                  >
                    <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links */}
            <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-xs">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">
                Quick navigation
              </h2>

              <div className="flex flex-col gap-2">
                <Link
                  to="#"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  All pending tests
                </Link>
                <Link
                  to="#"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  Completed reports
                </Link>
                <Link
                  to="#"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  Instrument calibration logs
                </Link>
                <Link
                  to="#"
                  className="text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  Safety &amp; incident reports
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Helper strip */}
        <section className="pb-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>
              Remember to verify patient identity and label every sample
              correctly before starting analysis. Accurate labeling prevents
              reporting errors.
            </p>
            <div className="flex gap-2">
              <button className="rounded-lg border border-blue-200 bg-white px-3 py-1 font-medium text-xs text-blue-700 hover:border-blue-400">
                Lab SOPs
              </button>
              <button className="rounded-lg border border-blue-200 bg-white px-3 py-1 font-medium text-xs text-blue-700 hover:border-blue-400">
                Report an issue
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Clinical. Lab technician console.</span>
          <div className="flex gap-3">
            <button className="hover:text-blue-600">Help</button>
            <button className="hover:text-blue-600">Shortcuts</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TechnicianDashboard;

// src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  // 🧹 Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/"; // redirect to login
  };

  // Later you can replace these with real data from backend
  const activeTests = [
    { id: 1, name: "Complete Blood Count (CBC)", status: "Sample Collected" },
    { id: 2, name: "Liver Function Test", status: "Processing" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100">
      {/* Top bar */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              C
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Clinical</p>
              <p className="text-xs text-slate-500">
                Medical Lab Management System
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-slate-500">
              Logged in as
            </span>
            <span className="font-medium text-slate-900">
              Patient Name{/* later: replace with real user */}
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

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Welcome + quick info */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
                Welcome back 👋
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage your lab tests, consult doctors, and view your reports
                from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm min-w-[170px]">
                <p className="text-slate-500">Upcoming appointment</p>
                <p className="font-semibold text-slate-900">
                  None scheduled{/* dynamic later */}
                </p>
              </div>
              <div className="px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-sm min-w-[130px]">
                <p className="text-slate-500">Active tests</p>
                <p className="font-semibold text-slate-900">
                  {activeTests.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Consult doctor */}
          <Link
            to="#"
            className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col gap-2 hover:border-blue-400 hover:shadow-md transition h-full"
          >
            <h2 className="text-sm font-semibold text-slate-900">
              Consult a doctor
            </h2>
            <p className="text-xs text-slate-600">
              Book an online or in-person consultation after receiving your lab
              reports.
            </p>
            <span className="mt-auto text-xs font-medium text-blue-600">
              View doctors &raquo;
            </span>
          </Link>

          {/* Register for tests */}
          <Link
            to="#"
            className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col gap-2 hover:border-blue-400 hover:shadow-md transition h-full"
          >
            <h2 className="text-sm font-semibold text-slate-900">
              Register for tests
            </h2>
            <p className="text-xs text-slate-600">
              Browse available lab tests and book your required investigations.
            </p>
            <span className="mt-auto text-xs font-medium text-blue-600">
              Browse tests &raquo;
            </span>
          </Link>

          {/* View reports */}
          <Link
            to="#"
            className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col gap-2 hover:border-blue-400 hover:shadow-md transition h-full"
          >
            <h2 className="text-sm font-semibold text-slate-900">
              View reports
            </h2>
            <p className="text-xs text-slate-600">
              Download your completed lab reports and check your history.
            </p>
            <span className="mt-auto text-xs font-medium text-blue-600">
              Open reports &raquo;
            </span>
          </Link>
        </section>

        {/* Active tests + profile */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Active tests */}
          <div className="lg:col-span-2 rounded-xl bg-white border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Active tests
              </h2>
              <button className="text-xs text-blue-600 hover:text-blue-700">
                View all
              </button>
            </div>

            {activeTests.length === 0 ? (
              <p className="text-xs text-slate-500">
                You don&apos;t have any tests in progress.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {activeTests.map((test) => (
                  <li
                    key={test.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{test.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Request ID: #{test.id.toString().padStart(4, "0")}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      {test.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick profile section */}
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-xs">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Your profile
            </h2>
            <div className="space-y-1">
              <p>
                <span className="text-slate-500">Name: </span>
                <span className="font-medium text-slate-900">
                  Patient Name
                </span>
              </p>
              <p>
                <span className="text-slate-500">Citizenship ID: </span>
                <span className="font-medium text-slate-900">
                  01-01-000000
                </span>
              </p>
              <p>
                <span className="text-slate-500">Email: </span>
                <span className="font-medium text-slate-900">
                  you@example.com
                </span>
              </p>
            </div>

            <button className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 transition w-full">
              Edit profile
            </button>
          </div>
        </section>

        {/* Small helper/footer section to visually anchor bottom */}
        <section className="pb-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>
              Need help understanding your reports or booking tests? Contact the
              lab directly or talk to a doctor through Clinical.
            </p>
            <div className="flex gap-2">
              <button className="rounded-lg border border-blue-200 bg-white px-3 py-1 font-medium text-xs text-blue-700 hover:border-blue-400">
                Help center
              </button>
              <button className="rounded-lg border border-blue-200 bg-white px-3 py-1 font-medium text-xs text-blue-700 hover:border-blue-400">
                Contact support
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Page footer */}
      <footer className="border-t border-slate-200 bg-white/70">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} Clinical. All rights reserved.</span>
          <div className="flex gap-3">
            <button className="hover:text-blue-600">Privacy</button>
            <button className="hover:text-blue-600">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;

import React, { useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function PatientLayout() {
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const patientName = user?.name || "Patient";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const linkBase =
    "block px-5 py-3 rounded-lg transition border border-transparent";
  const linkInactive = "hover:bg-blue-100";
  const linkActive = "bg-blue-100 border-blue-200";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100">
      {/* Top bar */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
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

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 hidden sm:inline">Welcome,</span>
            <span className="font-semibold text-slate-900">{patientName}</span>
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

                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `${linkBase} ${isActive ? linkActive : linkInactive}`
                  }
                >
                  <div className="font-medium text-slate-900">Edit profile</div>
                  <span className="block text-[11px] text-slate-500">
                    Update your personal information
                  </span>
                </NavLink>

                <div className="my-3 border-t border-blue-100" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-3 rounded-lg hover:bg-red-50 text-red-600 transition"
                >
                  <div className="font-medium">Logout</div>
                  <span className="block text-[11px] text-red-500/80">
                    Sign out from Clinical
                  </span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Page content */}
          <main className="flex-1 bg-slate-50 px-6 py-6 md:px-10 md:py-10">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Footer (matches your old dashboard look) */}
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
    </div>
  );
}

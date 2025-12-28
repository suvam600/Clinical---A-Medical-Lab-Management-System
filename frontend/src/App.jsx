// src/App.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RegisterTests from "./pages/RegisterTests";
import ActiveTests from "./pages/ActiveTests"; // ✅ NEW

// ✅ Patient layout (sidebar + topbar + footer)
import PatientLayout from "./components/PatientLayout";

// Simple auth guard using localStorage
const RequireAuth = ({ children, allowedRoles }) => {
  const location = useLocation();
  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  // Not logged in → send to login
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If allowedRoles is given, check role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "technician") return <Navigate to="/technician" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ✅ Patient area (patient only) using shared layout */}
        <Route
          element={
            <RequireAuth allowedRoles={["patient"]}>
              <PatientLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register-tests" element={<RegisterTests />} />
          <Route path="/active-tests" element={<ActiveTests />} /> {/* ✅ UPDATED */}

          {/* Optional placeholders */}
          <Route
            path="/reports"
            element={<div className="max-w-6xl">Reports page (next)</div>}
          />
          <Route
            path="/consult"
            element={<div className="max-w-6xl">Consult doctor page (next)</div>}
          />
          <Route
            path="/profile"
            element={<div className="max-w-6xl">Edit profile page (next)</div>}
          />
        </Route>

        {/* Lab technician dashboard */}
        <Route
          path="/technician"
          element={
            <RequireAuth allowedRoles={["technician"]}>
              <TechnicianDashboard />
            </RequireAuth>
          }
        />

        {/* Admin dashboard */}
        <Route
          path="/admin"
          element={
            <RequireAuth allowedRoles={["admin"]}>
              <AdminDashboard />
            </RequireAuth>
          }
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

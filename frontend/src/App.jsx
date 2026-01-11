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
import ActiveTests from "./pages/ActiveTests";
import Reports from "./pages/Reports"; 

import PatientLayout from "./components/PatientLayout";

const RequireAuth = ({ children, allowedRoles }) => {
  const location = useLocation();
  const storedUser = localStorage.getItem("user");
  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

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
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          element={
            <RequireAuth allowedRoles={["patient"]}>
              <PatientLayout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register-tests" element={<RegisterTests />} />
          <Route path="/active-tests" element={<ActiveTests />} />

          {/*  REAL Reports page */}
          <Route path="/reports" element={<Reports />} />

          <Route
            path="/consult"
            element={<div className="max-w-6xl">Consult doctor page (next)</div>}
          />
          <Route
            path="/profile"
            element={<div className="max-w-6xl">Edit profile page (next)</div>}
          />
        </Route>

        <Route
          path="/technician"
          element={
            <RequireAuth allowedRoles={["technician"]}>
              <TechnicianDashboard />
            </RequireAuth>
          }
        />

        <Route
          path="/admin"
          element={
            <RequireAuth allowedRoles={["admin"]}>
              <AdminDashboard />
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

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
    // If user is not allowed here, send them to patient dashboard by default
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

        {/* Patient dashboard (requires any logged-in user) */}
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />

        {/* Lab technician dashboard (only for role "technician") */}
        <Route
          path="/technician"
          element={
            <RequireAuth allowedRoles={["technician"]}>
              <TechnicianDashboard />
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

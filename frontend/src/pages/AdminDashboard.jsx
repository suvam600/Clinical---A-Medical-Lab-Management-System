// src/pages/AdminDashboard.jsx
// Fix: Activities table layout (bigger, cleaner, better spacing, no cramped status pills)

import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "/api";

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text?.slice(0, 140) || "Server returned invalid JSON" };
  }
}

function RolePill({ role }) {
  const r = (role || "").toLowerCase();
  const cls =
    r === "admin"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : r === "technician"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : r === "doctor"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${cls}`}>
      {r.toUpperCase() || "USER"}
    </span>
  );
}

function StatusPill({ status }) {
  const s = String(status || "").trim();
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border whitespace-nowrap";
  if (s === "Published")
    return (
      <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-200`}>
        Published
      </span>
    );
  if (s === "Processing")
    return (
      <span className={`${base} bg-blue-50 text-blue-700 border-blue-200`}>
        Processing
      </span>
    );
  if (s === "Sample Collected")
    return (
      <span className={`${base} bg-violet-50 text-violet-700 border-violet-200`}>
        Sample Collected
      </span>
    );
  return (
    <span className={`${base} bg-amber-50 text-amber-700 border-amber-200`}>
      {s || "Awaiting Collection"}
    </span>
  );
}

function ModalShell({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      {children}
    </div>
  );
}

export default function AdminDashboard() {
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("users"); // users | tests | activities
  const [users, setUsers] = useState([]);
  const [filterRole, setFilterRole] = useState("all");

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersErr, setUsersErr] = useState("");
  const [usersMsg, setUsersMsg] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  // Create user form
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
    citizenshipId: "",
  });
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");

  // -----------------------------
  // ✅ TESTS STATE
  // -----------------------------
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testsErr, setTestsErr] = useState("");
  const [testsMsg, setTestsMsg] = useState("");

  const [testsBusyId, setTestsBusyId] = useState(null);

  // Add/Edit modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [editingTest, setEditingTest] = useState(null); // null = add mode
  const [testForm, setTestForm] = useState({
    name: "",
    price: "",
    sampleType: "Blood",
    turnaroundTime: "24 hours",
    isActive: true,
  });
  const [savingTest, setSavingTest] = useState(false);
  const [testFormErr, setTestFormErr] = useState("");

  // -----------------------------
  // ✅ ACTIVITIES STATE
  // -----------------------------
  const [activities, setActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activitiesErr, setActivitiesErr] = useState("");
  const [activitiesMsg, setActivitiesMsg] = useState("");
  const [activitySearch, setActivitySearch] = useState("");

  const loadUsers = async () => {
    try {
      setUsersErr("");
      setUsersMsg("");
      setLoadingUsers(true);

      const q = filterRole && filterRole !== "all" ? `?role=${filterRole}` : "";
      const res = await fetch(`${API_BASE}/admin/users${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to load users");

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      setUsersErr(e.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadTests = async () => {
    try {
      setTestsErr("");
      setTestsMsg("");
      setLoadingTests(true);

      const res = await fetch(`${API_BASE}/tests/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to load tests");

      setTests(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setTestsErr(e.message || "Failed to load tests");
      setTests([]);
    } finally {
      setLoadingTests(false);
    }
  };

  const loadActivities = async () => {
    try {
      setActivitiesErr("");
      setActivitiesMsg("");
      setLoadingActivities(true);

      const res = await fetch(`${API_BASE}/bookings/queue?includePublished=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to load activities");

      setActivities(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setActivitiesErr(e.message || "Failed to load activities");
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole]);

  useEffect(() => {
    if (activeTab === "tests") loadTests();
    if (activeTab === "activities") loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onChange = (e) => {
    setCreateErr("");
    setUsersMsg("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const createUser = async (e) => {
    e.preventDefault();
    setCreateErr("");
    setUsersMsg("");

    try {
      setCreating(true);

      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        citizenshipId: form.role === "patient" ? form.citizenshipId.trim() : "",
      };

      const res = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to create user");

      setUsersMsg("✅ User created successfully.");
      setForm({
        name: "",
        email: "",
        password: "",
        role: "patient",
        citizenshipId: "",
      });

      await loadUsers();
    } catch (e2) {
      setCreateErr(e2.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (user) => {
    setUsersErr("");
    setUsersMsg("");

    const ok = window.confirm(
      `Remove this user?\n\nName: ${user.name}\nRole: ${user.role}\nEmail: ${user.email}`
    );
    if (!ok) return;

    try {
      setDeletingId(user.id);

      const res = await fetch(`${API_BASE}/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to delete user");

      setUsersMsg("✅ User removed.");
      await loadUsers();
    } catch (e) {
      setUsersErr(e.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  // -----------------------------
  // ✅ TESTS HANDLERS
  // -----------------------------
  const openAddTest = () => {
    setTestsMsg("");
    setTestsErr("");
    setTestFormErr("");
    setEditingTest(null);
    setTestForm({
      name: "",
      price: "",
      sampleType: "Blood",
      turnaroundTime: "24 hours",
      isActive: true,
    });
    setTestModalOpen(true);
  };

  const openEditTest = (t) => {
    setTestsMsg("");
    setTestsErr("");
    setTestFormErr("");
    setEditingTest(t);
    setTestForm({
      name: t?.name || "",
      price: String(t?.price ?? ""),
      sampleType: t?.sampleType || "Blood",
      turnaroundTime: t?.turnaroundTime || "24 hours",
      isActive: !!t?.isActive,
    });
    setTestModalOpen(true);
  };

  const closeTestModal = () => {
    setTestModalOpen(false);
    setEditingTest(null);
    setSavingTest(false);
    setTestFormErr("");
  };

  const onTestFormChange = (e) => {
    setTestFormErr("");
    const { name, value, type, checked } = e.target;
    setTestForm((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveTest = async (e) => {
    e.preventDefault();
    setTestFormErr("");
    setTestsErr("");
    setTestsMsg("");

    const name = String(testForm.name || "").trim();
    const priceNum = Number(testForm.price);
    const sampleType = String(testForm.sampleType || "").trim();
    const turnaroundTime = String(testForm.turnaroundTime || "").trim();

    if (!name) return setTestFormErr("Test name is required.");
    if (!Number.isFinite(priceNum) || priceNum < 0)
      return setTestFormErr("Price must be a valid number (0 or more).");
    if (!sampleType) return setTestFormErr("Sample type is required.");
    if (!turnaroundTime) return setTestFormErr("Turnaround time is required.");

    try {
      setSavingTest(true);

      const payload = {
        name,
        price: priceNum,
        sampleType,
        turnaroundTime,
        isActive: !!testForm.isActive,
      };

      const isEdit = !!editingTest?._id;
      const url = isEdit ? `${API_BASE}/tests/${editingTest._id}` : `${API_BASE}/tests`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to save test");

      setTestsMsg(isEdit ? "✅ Test updated." : "✅ Test added.");
      closeTestModal();
      await loadTests();
    } catch (err) {
      setTestFormErr(err.message || "Failed to save test");
    } finally {
      setSavingTest(false);
    }
  };

  const deleteTest = async (t) => {
    setTestsErr("");
    setTestsMsg("");

    const ok = window.confirm(
      `Delete this test permanently?\n\n${t.name}\nPrice: ${t.price}\nSample: ${t.sampleType}`
    );
    if (!ok) return;

    try {
      setTestsBusyId(t._id);

      const res = await fetch(`${API_BASE}/tests/${t._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to delete test");

      setTestsMsg("✅ Test removed.");
      await loadTests();
    } catch (e) {
      setTestsErr(e.message || "Failed to delete test");
    } finally {
      setTestsBusyId(null);
    }
  };

  const toggleTest = async (t) => {
    setTestsErr("");
    setTestsMsg("");

    try {
      setTestsBusyId(t._id);

      const res = await fetch(`${API_BASE}/tests/${t._id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to toggle test");

      setTestsMsg(`✅ ${t.name} ${t.isActive ? "disabled" : "enabled"}.`);
      await loadTests();
    } catch (e) {
      setTestsErr(e.message || "Failed to toggle test");
    } finally {
      setTestsBusyId(null);
    }
  };

  const visibleUsers = useMemo(() => users, [users]);

  // ✅ Activities filter
  const filteredActivities = useMemo(() => {
    const q = String(activitySearch || "").trim().toLowerCase();
    if (!q) return activities;

    return (activities || []).filter((b) => {
      const p = b?.patientUserId || {};
      const name = String(p?.name || "").toLowerCase();
      const cid = String(p?.citizenshipId || "").toLowerCase();
      const email = String(p?.email || "").toLowerCase();
      return name.includes(q) || cid.includes(q) || email.includes(q);
    });
  }, [activities, activitySearch]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100">
      {/* Top bar */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              C
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Clinical</p>
              <p className="text-xs text-slate-500">Admin Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 hidden sm:inline">Welcome,</span>
            <span className="font-semibold text-slate-900">Admin</span>
            <button
              className="text-xs text-slate-500 hover:text-red-500"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/";
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left panel */}
          <aside className="lg:col-span-3">
            <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-6">
              <h2 className="text-xl font-semibold text-slate-900">Admin Panel</h2>
              <p className="text-sm text-slate-500 mt-1">
                Manage users, staff, test catalog, and activities.
              </p>

              <div className="mt-5 space-y-3">
                <button
                  onClick={() => setActiveTab("users")}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                    activeTab === "users"
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-slate-900">Users</div>
                  <div className="text-xs text-slate-500">Create accounts & view roles</div>
                </button>

                <button
                  onClick={() => setActiveTab("tests")}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                    activeTab === "tests"
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-slate-900">Test Lists</div>
                  <div className="text-xs text-slate-500">Add, update & remove tests</div>
                </button>

                <button
                  onClick={() => setActiveTab("activities")}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                    activeTab === "activities"
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-slate-900">Activities</div>
                  <div className="text-xs text-slate-500">Bookings & test status tracking</div>
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                  }}
                  className="w-full text-left rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 hover:bg-red-100 transition"
                >
                  <div className="font-semibold">Logout</div>
                  <div className="text-xs text-red-600/80">Sign out safely</div>
                </button>
              </div>
            </div>
          </aside>

          {/* Main area */}
          <main className="lg:col-span-9">
            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Manage users</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Create new accounts (patient / technician / admin) and view all users.
                    </p>
                  </div>

                  <button
                    onClick={loadUsers}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Refresh
                  </button>
                </div>

                <div className="p-6">
                  {(usersErr || usersMsg) && (
                    <div
                      className={`mb-5 rounded-xl border p-3 text-sm ${
                        usersErr
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-green-200 bg-green-50 text-green-800"
                      }`}
                    >
                      {usersErr || usersMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Create user */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="text-lg font-semibold text-slate-900">Create user</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Citizenship ID is required only for patients.
                      </p>

                      {createErr && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          {createErr}
                        </div>
                      )}

                      <form onSubmit={createUser} className="mt-4 space-y-3">
                        <div>
                          <label className="text-xs text-slate-600">Full name</label>
                          <input
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
                            placeholder="Ram Bahadur"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-600">Email</label>
                          <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={onChange}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
                            placeholder="ram@example.com"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-xs text-slate-600">Password</label>
                          <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={onChange}
                            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
                            placeholder="••••••••"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-slate-600">Role</label>
                            <select
                              name="role"
                              value={form.role}
                              onChange={onChange}
                              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-blue-400"
                            >
                              <option value="patient">Patient</option>
                              <option value="technician">Technician</option>
                              <option value="admin">Admin</option>
                              <option value="doctor">Doctor</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs text-slate-600">Citizenship ID</label>
                            <input
                              name="citizenshipId"
                              value={form.citizenshipId}
                              onChange={onChange}
                              disabled={form.role !== "patient"}
                              className={`mt-1 w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-blue-400 ${
                                form.role !== "patient"
                                  ? "border-slate-200 bg-slate-100 text-slate-400"
                                  : "border-slate-200 bg-white"
                              }`}
                              placeholder="1234567890"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={creating}
                          className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
                        >
                          {creating ? "Creating..." : "Create user"}
                        </button>
                      </form>
                    </div>

                    {/* Users list */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Users</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Total: {visibleUsers.length}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">Filter</span>
                          <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-blue-400"
                          >
                            <option value="all">All</option>
                            <option value="patient">Patient</option>
                            <option value="technician">Technician</option>
                            <option value="doctor">Doctor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      {loadingUsers ? (
                        <div className="mt-4 text-sm text-slate-600">Loading users…</div>
                      ) : (
                        <div className="mt-4 space-y-3">
                          {visibleUsers.map((u) => (
                            <div
                              key={u.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-base font-semibold text-slate-900">
                                    {u.name}
                                  </div>
                                  <div className="text-sm text-slate-600">{u.email}</div>
                                  {u.citizenshipId ? (
                                    <div className="text-xs text-slate-500 mt-1">
                                      Citizenship ID:{" "}
                                      <span className="font-medium text-slate-700">
                                        {u.citizenshipId}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-slate-400 mt-1">
                                      Citizenship ID: —
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <RolePill role={u.role} />

                                  <button
                                    onClick={() => deleteUser(u)}
                                    disabled={deletingId === u.id}
                                    className={`text-xs font-semibold rounded-lg px-3 py-1.5 border transition ${
                                      deletingId === u.id
                                        ? "border-slate-200 text-slate-400 cursor-not-allowed bg-white"
                                        : "border-red-200 text-red-700 hover:bg-red-50"
                                    }`}
                                  >
                                    {deletingId === u.id ? "Removing..." : "Remove"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          {visibleUsers.length === 0 && (
                            <div className="text-sm text-slate-600">No users found.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TESTS TAB */}
            {activeTab === "tests" && (
              <div className="rounded-2xl border border-blue-100 bg-white shadow-sm">
                <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Tests</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Add, update, enable/disable, or permanently remove tests.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadTests}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={openAddTest}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      + Add Test
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {(testsErr || testsMsg) && (
                    <div
                      className={`mb-5 rounded-xl border p-3 text-sm ${
                        testsErr
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-green-200 bg-green-50 text-green-800"
                      }`}
                    >
                      {testsErr || testsMsg}
                    </div>
                  )}

                  {loadingTests ? (
                    <div className="text-sm text-slate-600">Loading tests…</div>
                  ) : (
                    <div className="space-y-4">
                      {tests.map((t) => (
                        <div
                          key={t._id}
                          className="rounded-2xl border border-slate-200 bg-white p-4"
                        >
                          <pre className="text-sm text-slate-800 whitespace-pre-wrap">{`_id: ${t._id}
name: "${t.name}"
price: ${t.price}
sampleType: "${t.sampleType}"
turnaroundTime: "${t.turnaroundTime}"
isActive: ${t.isActive}`}</pre>

                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={() => openEditTest(t)}
                              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => toggleTest(t)}
                              disabled={testsBusyId === t._id}
                              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                                t.isActive
                                  ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              } ${testsBusyId === t._id ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              {testsBusyId === t._id
                                ? "Working..."
                                : t.isActive
                                ? "Disable"
                                : "Enable"}
                            </button>

                            <button
                              onClick={() => deleteTest(t)}
                              disabled={testsBusyId === t._id}
                              className={`rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 ${
                                testsBusyId === t._id ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                            >
                              {testsBusyId === t._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      ))}

                      {tests.length === 0 && (
                        <div className="text-sm text-slate-600">No tests found.</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ✅ ACTIVITIES TAB (FIXED TABLE CSS) */}
            {activeTab === "activities" && (
              <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Activities</h2>
                    <p className="text-sm text-slate-500 mt-1">
                      View booked tests and their current statuses.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                    <input
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      placeholder="Search patient / citizenship / email..."
                      className="w-full sm:w-[420px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      onClick={loadActivities}
                      className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {(activitiesErr || activitiesMsg) && (
                    <div
                      className={`mb-5 rounded-xl border p-3 text-sm ${
                        activitiesErr
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-green-200 bg-green-50 text-green-800"
                      }`}
                    >
                      {activitiesErr || activitiesMsg}
                    </div>
                  )}

                  {loadingActivities ? (
                    <div className="text-sm text-slate-600">Loading activities…</div>
                  ) : filteredActivities.length === 0 ? (
                    <div className="text-sm text-slate-600">No bookings found.</div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="w-full overflow-x-auto">
                        <table className="w-full min-w-[1200px] table-fixed text-sm">
                          <thead className="bg-slate-50">
                            <tr className="border-b border-slate-200 text-xs text-slate-500">
                              <th className="text-left font-semibold px-5 py-4 w-[220px]">
                                Booked
                              </th>
                              <th className="text-left font-semibold px-5 py-4 w-[320px]">
                                Patient
                              </th>
                              <th className="text-left font-semibold px-5 py-4 w-[360px]">
                                Tests
                              </th>
                              <th className="text-left font-semibold px-5 py-4 w-[260px]">
                                Statuses
                              </th>
                              <th className="text-left font-semibold px-5 py-4 w-[160px]">
                                Booking Status
                              </th>
                            </tr>
                          </thead>

                          <tbody className="bg-white">
                            {filteredActivities.map((b) => {
                              const patient = b.patientUserId || {};
                              const testsArr = Array.isArray(b.tests) ? b.tests : [];
                              return (
                                <tr key={b._id} className="border-b border-slate-100 align-top">
                                  <td className="px-5 py-5 text-slate-800 whitespace-nowrap">
                                    {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
                                  </td>

                                  <td className="px-5 py-5">
                                    <div className="font-semibold text-slate-900 text-[15px]">
                                      {patient.name || "Unknown"}
                                    </div>
                                    <div className="text-xs text-slate-600 mt-1">
                                      Citizenship ID:{" "}
                                      <span className="font-medium">{patient.citizenshipId || "—"}</span>
                                    </div>
                                    <div className="text-xs text-slate-600">
                                      Email:{" "}
                                      <span className="font-medium">{patient.email || "—"}</span>
                                    </div>
                                  </td>

                                  <td className="px-5 py-5">
                                    {testsArr.length ? (
                                      <ul className="space-y-1.5">
                                        {testsArr.map((t, idx) => (
                                          <li
                                            key={t._id || `${b._id}:t:${idx}`}
                                            className="text-slate-900"
                                          >
                                            • {t.name || "—"}
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>

                                  <td className="px-5 py-5">
                                    {testsArr.length ? (
                                      <div className="flex flex-col gap-2">
                                        {testsArr.map((t, idx) => (
                                          <div key={t._id || `${b._id}:s:${idx}`}>
                                            <StatusPill status={t.status || "Awaiting Collection"} />
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>

                                  <td className="px-5 py-5 whitespace-nowrap">
                                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                                      {b.bookingStatus || "Booked"}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Add/Edit Test Modal */}
      <ModalShell open={testModalOpen} onClose={closeTestModal}>
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">
                {editingTest ? "Update Test" : "Add New Test"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Fill details and save.</p>
            </div>
            <button
              className="text-xs text-slate-500 hover:text-red-500"
              onClick={closeTestModal}
            >
              Close
            </button>
          </div>

          <form onSubmit={saveTest} className="p-6 space-y-3">
            {testFormErr ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {testFormErr}
              </div>
            ) : null}

            <div>
              <label className="text-xs text-slate-600">Test name</label>
              <input
                name="name"
                value={testForm.name}
                onChange={onTestFormChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
                placeholder="Full Body Test"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600">Price</label>
                <input
                  name="price"
                  type="number"
                  value={testForm.price}
                  onChange={onTestFormChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
                  placeholder="450"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-600">Sample type</label>
                <input
                  name="sampleType"
                  value={testForm.sampleType}
                  onChange={onTestFormChange}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
                  placeholder="Blood"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-600">Turnaround time</label>
              <input
                name="turnaroundTime"
                value={testForm.turnaroundTime}
                onChange={onTestFormChange}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
                placeholder="24 hours"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 pt-1">
              <input
                type="checkbox"
                name="isActive"
                checked={testForm.isActive}
                onChange={onTestFormChange}
              />
              Active
            </label>

            <button
              type="submit"
              disabled={savingTest}
              className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
            >
              {savingTest ? "Saving..." : editingTest ? "Update Test" : "Add Test"}
            </button>
          </form>
        </div>
      </ModalShell>
    </div>
  );
}
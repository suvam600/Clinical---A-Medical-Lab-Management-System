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

export default function AdminDashboard() {
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("users"); // users | tests (future)
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

      // backend returns { users: mapped }
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (e) {
      setUsersErr(e.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole]);

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

      // refresh list
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

  const visibleUsers = useMemo(() => users, [users]);

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
                Manage users, staff, and test catalog.
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
                  <div className="font-semibold text-slate-900">Tests</div>
                  <div className="text-xs text-slate-500">View test list & remove items</div>
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

                                  {/* ✅ NEW: Remove button */}
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

            {/* Placeholder for tests tab if you already have it */}
            {activeTab === "tests" && (
              <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-6">
                <h2 className="text-2xl font-semibold text-slate-900">Tests</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Hook this section to your tests management next.
                </p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";

const API_BASE = "/api";

async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text?.slice(0, 140) || "Server returned invalid JSON" };
  }
}

export default function DoctorApplicationsPanel({ token, onApproved }) {
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appsErr, setAppsErr] = useState("");
  const [appsMsg, setAppsMsg] = useState("");
  const [appsBusyId, setAppsBusyId] = useState(null);

  const loadApplications = async () => {
    try {
      setAppsErr("");
      setAppsMsg("");
      setLoadingApps(true);

      const res = await fetch(`${API_BASE}/doctor-applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to load applications");

      setApplications(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setAppsErr(e.message || "Failed to load applications");
      setApplications([]);
    } finally {
      setLoadingApps(false);
    }
  };

  const approveApplication = async (id) => {
    try {
      setAppsErr("");
      setAppsMsg("");
      setAppsBusyId(id);

      const res = await fetch(`${API_BASE}/doctor-applications/${id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to approve application");

      setAppsMsg("Application approved successfully.");
      await loadApplications();
      if (typeof onApproved === "function") onApproved();
    } catch (e) {
      setAppsErr(e.message || "Failed to approve application");
    } finally {
      setAppsBusyId(null);
    }
  };

  const rejectApplication = async (id) => {
    try {
      setAppsErr("");
      setAppsMsg("");
      setAppsBusyId(id);

      const res = await fetch(`${API_BASE}/doctor-applications/${id}/reject`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to reject application");

      setAppsMsg("Application rejected.");
      await loadApplications();
    } catch (e) {
      setAppsErr(e.message || "Failed to reject application");
    } finally {
      setAppsBusyId(null);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div className="rounded-2xl border border-blue-100 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            Doctor Applications
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review doctor requests, proof documents, and approve or reject them.
          </p>
        </div>

        <button
          onClick={loadApplications}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      <div className="p-6">
        {(appsErr || appsMsg) && (
          <div
            className={`mb-5 rounded-xl border p-3 text-sm ${
              appsErr
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            {appsErr || appsMsg}
          </div>
        )}

        {loadingApps ? (
          <div className="text-sm text-slate-600">Loading applications…</div>
        ) : applications.length === 0 ? (
          <div className="text-sm text-slate-600">
            No doctor applications found.
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {app.name || "Unknown Applicant"}
                    </h3>
                    <p className="text-sm text-slate-600">{app.email || "—"}</p>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <p>
                        <span className="text-slate-500">Degree: </span>
                        <span className="font-medium text-slate-900">
                          {app.degree || "—"}
                        </span>
                      </p>

                      <p>
                        <span className="text-slate-500">Specialization: </span>
                        <span className="font-medium text-slate-900">
                          {app.specialization || "—"}
                        </span>
                      </p>

                      <p>
                        <span className="text-slate-500">Experience: </span>
                        <span className="font-medium text-slate-900">
                          {app.experience || "—"}
                        </span>
                      </p>

                      <p>
                        <span className="text-slate-500">Status: </span>
                        <span className="font-semibold text-slate-900">
                          {app.status || "Pending"}
                        </span>
                      </p>
                    </div>

                    {app.description ? (
                      <p className="mt-3 text-sm text-slate-600 leading-6">
                        {app.description}
                      </p>
                    ) : null}

                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-500 mb-2">
                        Proof files
                      </p>

                      {Array.isArray(app.proofFiles) &&
                      app.proofFiles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {app.proofFiles.map((file, index) => (
                            <a
                              key={`${file}-${index}`}
                              href={file}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                            >
                              View proof {index + 1}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          No proof files uploaded.
                        </p>
                      )}
                    </div>
                  </div>

                  {app.status === "Pending" ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approveApplication(app._id)}
                        disabled={appsBusyId === app._id}
                        className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {appsBusyId === app._id ? "Working..." : "Approve"}
                      </button>

                      <button
                        onClick={() => rejectApplication(app._id)}
                        disabled={appsBusyId === app._id}
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {appsBusyId === app._id ? "Working..." : "Reject"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
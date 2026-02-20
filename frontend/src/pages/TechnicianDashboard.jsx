// src/pages/TechnicianDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";

const TEST_STATUSES = [
  "Awaiting Collection",
  "Sample Collected",
  "Processing",
  "Published",
];

const STATUS_ORDER = {
  "Awaiting Collection": 0,
  "Sample Collected": 1,
  Processing: 2,
  Published: 3,
};

function getToken() {
  return localStorage.getItem("token") || "";
}

async function apiFetch(url, options = {}) {
  const token = getToken();

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function makeSampleId(bookingId, itemId, idx) {
  const shortB = String(bookingId || "").slice(-6).toUpperCase();
  const shortT = String(itemId || "").slice(-4).toUpperCase();
  return `SMP-${shortB}${shortT ? `-${shortT}` : ""}-${idx + 1}`;
}

function statusPill(status) {
  const base =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold";
  if (status === "Published") return `${base} bg-emerald-50 text-emerald-700`;
  if (status === "Processing") return `${base} bg-blue-50 text-blue-700`;
  if (status === "Sample Collected")
    return `${base} bg-violet-50 text-violet-700`;
  return `${base} bg-amber-50 text-amber-700`;
}

export default function TechnicianDashboard() {
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

  const [queueRows, setQueueRows] = useState([]);
  const [recent, setRecent] = useState([
    { id: "none", text: "No recent activity yet." },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  // ✅ NEW: Published search (Citizenship ID)
  const [publishedSearch, setPublishedSearch] = useState("");

  // Update modal state
  const [updateOpen, setUpdateOpen] = useState(null); // rowKey
  const [updateStatus, setUpdateStatus] = useState("Awaiting Collection");
  const [updatingRowKey, setUpdatingRowKey] = useState(null);

  // ✅ Enter Result modal state
  const [resultOpen, setResultOpen] = useState(null); // rowKey
  const [resultText, setResultText] = useState("");
  const [resultNotes, setResultNotes] = useState("");
  const [savingResultRowKey, setSavingResultRowKey] = useState(null);

  // ✅ Report modal state (Published report view)
  const [reportOpen, setReportOpen] = useState(null); // rowKey

  async function loadQueue() {
    try {
      setLoading(true);
      setError("");

      const data = await apiFetch("/api/bookings/queue?includePublished=1", {
        method: "GET",
      });

      const bookings = data?.success ? data.data : [];

      const rows = [];
      (bookings || []).forEach((b) => {
        const patient = b.patientUserId || {};
        const patientName = patient?.name || "Unknown";
        const citizenshipId = patient?.citizenshipId || "—";

        const createdAt =
          b.createdAt || b.updatedAt || new Date().toISOString();

        (b.tests || []).forEach((t, idx) => {
          const status = t?.status || "Awaiting Collection";
          const rowKey = `${b._id}:${t._id || idx}`;

          rows.push({
            rowKey,
            bookingId: b._id,
            bookingCreatedAt: createdAt,

            itemId: t._id, // IMPORTANT for PATCH/PUT
            testId: t.testId,
            testName: t.name,
            price: t.price,

            status,
            patientName,
            citizenshipId,
            email: patient?.email || "",

            // ✅ result fields from booking.tests[]
            result: t?.result || "",
            notes: t?.notes || "",
            publishedAt: t?.publishedAt || null,

            sampleId: makeSampleId(b._id, t._id, idx),
            timeLabel: formatTime(createdAt),
          });
        });
      });

      rows.sort(
        (a, b) => new Date(b.bookingCreatedAt) - new Date(a.bookingCreatedAt)
      );
      setQueueRows(rows);

      const latest = rows.slice(0, 5).map((r) => ({
        id: `${r.rowKey}:${Date.now()}`,
        text: `Queue item: ${r.sampleId} → ${r.status} (${r.testName})`,
      }));
      setRecent(
        latest.length ? latest : [{ id: "none", text: "No recent activity yet." }]
      );
    } catch (e) {
      setError(e.message || "Failed to load queue.");
      setQueueRows([]);
      setRecent([{ id: "none", text: "No recent activity yet." }]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const publishedRows = useMemo(
    () => queueRows.filter((r) => (r.status || "") === "Published"),
    [queueRows]
  );

  // ✅ NEW: filter published by citizenshipId
  const filteredPublishedRows = useMemo(() => {
    const q = String(publishedSearch || "").trim().toLowerCase();
    if (!q) return publishedRows;
    return publishedRows.filter((r) =>
      String(r.citizenshipId || "").toLowerCase().includes(q)
    );
  }, [publishedRows, publishedSearch]);

  const activeQueueRows = useMemo(
    () => queueRows.filter((r) => (r.status || "") !== "Published"),
    [queueRows]
  );

  const counts = useMemo(() => {
    const testsInQueue = activeQueueRows.length;
    const pendingProcessing = activeQueueRows.filter(
      (r) => r.status === "Processing"
    ).length;
    return { testsInQueue, pendingProcessing };
  }, [activeQueueRows]);

  function openUpdate(row) {
    setUpdateOpen(row.rowKey);
    setUpdateStatus(row.status || "Awaiting Collection");
  }

  function closeUpdate() {
    setUpdateOpen(null);
    setUpdatingRowKey(null);
  }

  function allowedStatusesFor(row) {
    const current = row.status || "Awaiting Collection";
    const curOrder = STATUS_ORDER[current] ?? 0;
    return TEST_STATUSES.filter((s) => (STATUS_ORDER[s] ?? 0) >= curOrder);
  }

  async function saveStatus(row) {
    if (!row?.bookingId || !row?.itemId) {
      setError("Missing bookingId or test itemId for status update.");
      return;
    }

    try {
      setError("");
      setUpdatingRowKey(row.rowKey);

      await apiFetch(
        `/api/bookings/${row.bookingId}/tests/${row.itemId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: updateStatus }),
        }
      );

      // optimistic UI update (so it feels instant)
      setQueueRows((prev) =>
        prev.map((r) =>
          r.rowKey === row.rowKey ? { ...r, status: updateStatus } : r
        )
      );

      // add to recent activity
      setRecent((prev) => {
        const next = [
          {
            id: `${row.rowKey}:${Date.now()}`,
            text: `Updated: ${row.sampleId} → ${updateStatus}`,
          },
          ...(prev ? prev.filter((x) => x?.id !== "none") : []),
        ];
        return next.slice(0, 5);
      });

      // refresh (sync with backend-derived bookingStatus)
      setRefreshKey((k) => k + 1);
      closeUpdate();
    } catch (e) {
      setError(e.message || "Failed to update status.");
      setUpdatingRowKey(null);
    }
  }

  const activeRow = useMemo(() => {
    if (!updateOpen) return null;
    return queueRows.find((r) => r.rowKey === updateOpen) || null;
  }, [updateOpen, queueRows]);

  // ✅ Enter Result modal helpers
  const activeResultRow = useMemo(() => {
    if (!resultOpen) return null;
    return queueRows.find((r) => r.rowKey === resultOpen) || null;
  }, [resultOpen, queueRows]);

  function openResult(row) {
    setError("");
    setResultOpen(row.rowKey);
    setResultText(row.result || "");
    setResultNotes(row.notes || "");
  }

  function closeResult() {
    setResultOpen(null);
    setSavingResultRowKey(null);
    setResultText("");
    setResultNotes("");
  }

  async function saveResult(row) {
    if (!row?.bookingId || !row?.itemId) {
      setError("Missing bookingId or test itemId for entering result.");
      return;
    }
    if (!String(resultText || "").trim()) {
      setError("Result is required.");
      return;
    }

    try {
      setError("");
      setSavingResultRowKey(row.rowKey);

      await apiFetch(
        `/api/bookings/${row.bookingId}/tests/${row.itemId}/result`,
        {
          method: "PUT",
          body: JSON.stringify({ result: resultText, notes: resultNotes }),
        }
      );

      // optimistic UI update
      setQueueRows((prev) =>
        prev.map((r) =>
          r.rowKey === row.rowKey
            ? {
                ...r,
                result: resultText,
                notes: resultNotes,
                status: "Published",
                publishedAt: new Date().toISOString(),
              }
            : r
        )
      );

      setRecent((prev) => {
        const next = [
          {
            id: `${row.rowKey}:${Date.now()}`,
            text: `Published: ${row.sampleId} (Result saved)`,
          },
          ...(prev ? prev.filter((x) => x?.id !== "none") : []),
        ];
        return next.slice(0, 5);
      });

      setRefreshKey((k) => k + 1);
      closeResult();
    } catch (e) {
      setError(e.message || "Failed to save result.");
      setSavingResultRowKey(null);
    }
  }

  // Report modal helpers
  const activeReportRow = useMemo(() => {
    if (!reportOpen) return null;
    return queueRows.find((r) => r.rowKey === reportOpen) || null;
  }, [reportOpen, queueRows]);

  function openReport(row) {
    setError("");
    setReportOpen(row.rowKey);
  }

  function closeReport() {
    setReportOpen(null);
  }

  function printReport(row) {
    if (!row) return;

    const publishedLabel = row.publishedAt
      ? new Date(row.publishedAt).toLocaleString()
      : "—";

    const safe = (s) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const html = `
    <html>
      <head>
        <title>Lab Report - ${safe(row.sampleId)}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; gap: 12px; }
          .brand { font-size: 20px; font-weight: 700; }
          .sub { font-size: 12px; color:#444; margin-top: 4px; }
          .box { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin-top: 14px; }
          .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .label { font-size: 12px; color:#555; }
          .value { font-size: 14px; font-weight: 600; margin-top: 2px; }
          .title { font-size: 14px; font-weight: 700; margin-bottom: 10px; }
          .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
          pre { white-space: pre-wrap; word-wrap: break-word; margin: 0; font-size: 14px; }
          .footer { margin-top: 18px; font-size: 11px; color:#666; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">Clinical Laboratory</div>
            <div class="sub">Official Lab Report</div>
          </div>
          <div style="text-align:right">
            <div class="label">Report ID</div>
            <div class="value mono">${safe(row.sampleId)}</div>
            <div class="label" style="margin-top:6px">Published</div>
            <div class="value">${safe(publishedLabel)}</div>
          </div>
        </div>

        <div class="box">
          <div class="title">Patient Information</div>
          <div class="grid">
            <div>
              <div class="label">Patient Name</div>
              <div class="value">${safe(row.patientName || "—")}</div>
            </div>
            <div>
              <div class="label">Citizenship ID</div>
              <div class="value">${safe(row.citizenshipId || "—")}</div>
            </div>
          </div>
        </div>

        <div class="box">
          <div class="title">Test Details</div>
          <div class="grid">
            <div>
              <div class="label">Test Name</div>
              <div class="value">${safe(row.testName || "—")}</div>
            </div>
            <div>
              <div class="label">Status</div>
              <div class="value">${safe(row.status || "—")}</div>
            </div>
          </div>
        </div>

        <div class="box">
          <div class="title">Result</div>
          <pre>${safe(row.result || "")}</pre>
        </div>

        <div class="box">
          <div class="title">Notes</div>
          <pre>${safe(row.notes || "—")}</pre>
        </div>

        <div class="footer">
          This report is generated electronically by Clinical Laboratory. If you find any issues, contact the lab administrator.
        </div>
      </body>
    </html>
    `;

    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) {
      alert("Pop-up blocked. Please allow pop-ups to print the report.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50 via-sky-50 to-blue-100">
      {/* Top bar (same vibe as your old UI) */}
      <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          {/* Sidebar */}
          <aside className="hidden md:flex w-72 shrink-0">
            <div className="w-full min-h-[calc(100vh-64px)] bg-gradient-to-b from-blue-50 to-sky-100 text-slate-800 border-r border-blue-100">
              <div className="px-5 py-4 border-b border-blue-100">
                <p className="text-2xl font-semibold text-slate-900">My Lab</p>
                <p className="text-sm text-slate-600 mt-1">Lab Technician</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Summary */}
                <div className="rounded-2xl bg-white/80 border border-blue-100 shadow-sm p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-3">
                    Summary
                  </p>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-100 bg-white p-3">
                      <p className="text-xs text-slate-500">Tests in queue</p>
                      <p className="text-xl font-semibold text-slate-900">
                        {counts.testsInQueue}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white p-3">
                      <p className="text-xs text-slate-500">
                        Pending processing
                      </p>
                      <p className="text-xl font-semibold text-slate-900">
                        {counts.pendingProcessing}
                      </p>
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                      <p className="text-xs text-slate-500">Tip</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        Verify identity &amp; label every sample.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent activity */}
                <div className="rounded-2xl bg-white/80 border border-blue-100 shadow-sm p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-3">
                    Recent activity
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    {(recent || []).map((r) => (
                      <li key={r.id} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="text-sm leading-5">{r.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quick navigation */}
                <div className="rounded-2xl bg-white/80 border border-blue-100 shadow-sm p-4">
                  <p className="text-sm font-semibold text-slate-900 mb-3">
                    Quick navigation
                  </p>
                  <div className="space-y-2 text-sm">
                    <button
                      className="text-blue-600 hover:text-blue-700 underline text-left"
                      onClick={() => {
                        const el = document.getElementById("test-queue");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      All pending tests
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-700 underline text-left"
                      onClick={() => {
                        const el = document.getElementById("published-tests");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Completed reports
                    </button>
                    <button
                      className="text-blue-600 hover:text-blue-700 underline text-left"
                      onClick={() => alert("Incident logs (next)")}
                    >
                      Incident logs
                    </button>
                  </div>
                </div>

                {/* Logout card */}
                <button
                  onClick={handleLogout}
                  className="w-full text-left rounded-2xl bg-white/80 border border-red-200 shadow-sm p-4 hover:bg-red-50 transition"
                >
                  <p className="text-red-600 font-semibold">Logout</p>
                  <p className="text-xs text-red-500/80 mt-1">
                    Sign out from Clinical
                  </p>
                </button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 py-6">
              {/* Error */}
              {error ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {/* Test Queue card */}
              <section
                id="test-queue"
                className="rounded-2xl bg-white/80 border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Test Queue
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Update status: Awaiting → Collected → Processing →
                      Published
                    </p>
                  </div>

                  <button
                    className="text-sm text-blue-600 hover:text-blue-700"
                    onClick={() => setRefreshKey((k) => k + 1)}
                  >
                    Refresh
                  </button>
                </div>

                <div className="w-full overflow-auto">
                  <table className="w-full min-w-full text-sm">
                    <thead className="bg-white">
                      <tr className="border-t border-slate-200 text-xs text-slate-500">
                        <th className="text-left font-semibold px-6 py-3">
                          Sample ID
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Patient (Citizenship ID)
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Test
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Time
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Status
                        </th>
                        <th className="text-right font-semibold px-6 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {loading ? (
                        <tr>
                          <td
                            className="px-6 py-4 text-slate-500"
                            colSpan={6}
                          >
                            Loading queue…
                          </td>
                        </tr>
                      ) : activeQueueRows.length === 0 ? (
                        <tr>
                          <td
                            className="px-6 py-4 text-slate-500"
                            colSpan={6}
                          >
                            No pending tests.
                          </td>
                        </tr>
                      ) : (
                        activeQueueRows.map((r) => (
                          <tr
                            key={r.rowKey}
                            className="border-t border-slate-100 hover:bg-slate-50/40"
                          >
                            <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                              {r.sampleId}
                            </td>

                            <td className="px-6 py-4">
                              <div className="text-slate-900">
                                {r.patientName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {r.citizenshipId}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-slate-900">
                              {r.testName}
                            </td>

                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                              {r.timeLabel}
                            </td>

                            <td className="px-6 py-4">
                              <span className={statusPill(r.status)}>
                                {r.status}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                                  onClick={() => openUpdate(r)}
                                  disabled={updatingRowKey === r.rowKey}
                                >
                                  {updatingRowKey === r.rowKey
                                    ? "Updating…"
                                    : "Update"}
                                </button>

                                <button
                                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                                  onClick={() => openResult(r)}
                                  disabled={savingResultRowKey === r.rowKey}
                                  title={
                                    r.status !== "Processing"
                                      ? 'Move status to "Processing" first, then enter result.'
                                      : ""
                                  }
                                >
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
              </section>

              {/* ✅ Published tests table (time removed + search added) */}
              <section
                id="published-tests"
                className="mt-6 rounded-2xl bg-white/80 border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Published Tests
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Completed and published reports.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      value={publishedSearch}
                      onChange={(e) => setPublishedSearch(e.target.value)}
                      placeholder="Search by Citizenship ID..."
                      className="w-64 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />

                    <button
                      className="text-sm text-blue-600 hover:text-blue-700"
                      onClick={() => setRefreshKey((k) => k + 1)}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="w-full overflow-auto">
                  <table className="w-full min-w-full text-sm">
                    <thead className="bg-white">
                      <tr className="border-t border-slate-200 text-xs text-slate-500">
                        <th className="text-left font-semibold px-6 py-3">
                          Sample ID
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Patient (Citizenship ID)
                        </th>
                        <th className="text-left font-semibold px-6 py-3">
                          Test
                        </th>
                        {/* ✅ removed Time column */}
                        <th className="text-left font-semibold px-6 py-3">
                          Status
                        </th>
                        <th className="text-right font-semibold px-6 py-3">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="bg-white">
                      {loading ? (
                        <tr>
                          <td
                            className="px-6 py-4 text-slate-500"
                            colSpan={5}
                          >
                            Loading published tests…
                          </td>
                        </tr>
                      ) : filteredPublishedRows.length === 0 ? (
                        <tr>
                          <td
                            className="px-6 py-4 text-slate-500"
                            colSpan={5}
                          >
                            No published tests yet.
                          </td>
                        </tr>
                      ) : (
                        filteredPublishedRows.map((r) => (
                          <tr
                            key={r.rowKey}
                            className="border-t border-slate-100 hover:bg-slate-50/40"
                          >
                            <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                              {r.sampleId}
                            </td>

                            <td className="px-6 py-4">
                              <div className="text-slate-900">
                                {r.patientName}
                              </div>
                              <div className="text-xs text-slate-500">
                                {r.citizenshipId}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-slate-900">
                              {r.testName}
                            </td>

                            {/* ✅ removed Time cell */}
                            <td className="px-6 py-4">
                              <span className={statusPill(r.status)}>
                                {r.status}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-3">
                                <button
                                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                                  onClick={() => openReport(r)}
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>

      {/* Update modal */}
      {updateOpen && activeRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeUpdate();
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">
                Update status
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {activeRow.sampleId} • {activeRow.testName}
              </p>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="text-sm text-slate-500">Current</div>
              <div className="flex items-center justify-between">
                <span className={statusPill(activeRow.status)}>
                  {activeRow.status}
                </span>
                <span className="text-xs text-slate-500">
                  {activeRow.patientName} ({activeRow.citizenshipId})
                </span>
              </div>

              <div className="pt-2">
                <label className="text-sm text-slate-500">New status</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                >
                  {allowedStatusesFor(activeRow).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[12px] text-slate-500">
                  Backwards movement is blocked (for safety).
                </p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                onClick={closeUpdate}
                disabled={updatingRowKey === activeRow.rowKey}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-60"
                onClick={() => saveStatus(activeRow)}
                disabled={updatingRowKey === activeRow.rowKey}
              >
                {updatingRowKey === activeRow.rowKey ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Enter Result modal */}
      {resultOpen && activeResultRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeResult();
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {activeResultRow.status === "Published"
                    ? "View Result"
                    : "Enter Result"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {activeResultRow.sampleId} • {activeResultRow.testName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {activeResultRow.patientName} ({activeResultRow.citizenshipId})
                </p>
              </div>

              <button
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                onClick={closeResult}
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-sm text-slate-500">Result</label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  rows={5}
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="Enter the test result here..."
                  disabled={activeResultRow.status === "Published"}
                />
              </div>

              <div>
                <label className="text-sm text-slate-500">
                  Notes (optional)
                </label>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  value={resultNotes}
                  onChange={(e) => setResultNotes(e.target.value)}
                  placeholder="Any remarks..."
                  disabled={activeResultRow.status === "Published"}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className={statusPill(activeResultRow.status)}>
                  {activeResultRow.status}
                </span>

                {activeResultRow.status !== "Published" ? (
                  <p className="text-[12px] text-slate-500">
                    You can publish only when status is <b>Processing</b>.
                  </p>
                ) : (
                  <p className="text-[12px] text-slate-500">Report is published.</p>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                onClick={closeResult}
                disabled={savingResultRowKey === activeResultRow.rowKey}
              >
                Cancel
              </button>

              {activeResultRow.status !== "Published" ? (
                <button
                  className="rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-700 disabled:opacity-60"
                  onClick={() => saveResult(activeResultRow)}
                  disabled={savingResultRowKey === activeResultRow.rowKey}
                >
                  {savingResultRowKey === activeResultRow.rowKey
                    ? "Publishing…"
                    : "Save & Publish"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Report modal (Published report view) */}
      {reportOpen && activeReportRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeReport();
          }}
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Lab Report</p>
                <p className="text-xs text-slate-500 mt-1">
                  {activeReportRow.sampleId} • {activeReportRow.testName}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Published:{" "}
                  {activeReportRow.publishedAt
                    ? new Date(activeReportRow.publishedAt).toLocaleString()
                    : "—"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  onClick={() => printReport(activeReportRow)}
                >
                  Print / Save PDF
                </button>
                <button
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                  onClick={closeReport}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                  <p className="text-xs text-slate-500">Patient Name</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {activeReportRow.patientName}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                  <p className="text-xs text-slate-500">Citizenship ID</p>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    {activeReportRow.citizenshipId}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    Test Details
                  </p>
                  <span className={statusPill(activeReportRow.status)}>
                    {activeReportRow.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  <div>
                    <span className="text-slate-500">Sample ID:</span>{" "}
                    <span className="font-semibold">{activeReportRow.sampleId}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-500">Test:</span>{" "}
                    <span className="font-semibold">{activeReportRow.testName}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Result</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                  {activeReportRow.result || "—"}
                </pre>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">Notes</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                  {activeReportRow.notes || "—"}
                </pre>
              </div>

              <p className="text-[12px] text-slate-500">
                This report is generated electronically by Clinical Laboratory.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

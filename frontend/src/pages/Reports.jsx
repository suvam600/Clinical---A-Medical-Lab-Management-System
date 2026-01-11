// src/pages/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";

function getToken() {
  return localStorage.getItem("token") || "";
}

function makeSampleId(bookingId, itemId, idx) {
  const shortB = String(bookingId || "").slice(-6).toUpperCase();
  const shortT = String(itemId || "").slice(-4).toUpperCase();
  return `RPT-${shortB}${shortT ? `-${shortT}` : ""}-${idx + 1}`;
}

function statusLabel(status) {
  if (status === "Published") return "Report Published";
  return status || "—";
}

function pillClass(status) {
  const base = "text-[11px] font-semibold px-3 py-1 rounded-full";
  if (status === "Published") return `${base} bg-green-50 text-green-700`;
  if (status === "Processing") return `${base} bg-blue-50 text-blue-700`;
  if (status === "Sample Collected") return `${base} bg-amber-50 text-amber-700`;
  return `${base} bg-slate-100 text-slate-700`;
}

// Print/Download (Save as PDF through browser)
function printReport(row) {
  if (!row) return;

  const safe = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const publishedLabel = row.publishedAt
    ? new Date(row.publishedAt).toLocaleString()
    : "—";

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
            <div class="value">${safe(statusLabel(row.status))}</div>
          </div>
        </div>
      </div>

      <div class="box">
        <div class="title">Result</div>
        <pre>${safe(row.result || "—")}</pre>
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
    alert("Pop-up blocked. Please allow pop-ups to print/download the report.");
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

export default function Reports() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // report modal
  const [reportOpen, setReportOpen] = useState(null); // rowKey

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const token = getToken();
        const res = await fetch("/api/bookings/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load reports");
        }

        setBookings(data.data || []);
      } catch (e) {
        setErr(e.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const publishedReports = useMemo(() => {
    const out = [];
    for (const b of bookings) {
      const createdAt = b.createdAt;
      const patient = {
        name: (JSON.parse(localStorage.getItem("user") || "{}")?.name) || "Patient",
        citizenshipId:
          (JSON.parse(localStorage.getItem("user") || "{}")?.citizenshipId) || "—",
      };

      (b.tests || []).forEach((t, idx) => {
        if (t?.status === "Published") {
          const rowKey = `${b._id}:${t._id || idx}`;
          out.push({
            rowKey,
            bookingId: b._id,
            itemId: t._id,
            createdAt,
            status: t.status,
            testName: t.name,
            price: t.price,
            result: t.result || "",
            notes: t.notes || "",
            publishedAt: t.publishedAt || null,
            sampleId: makeSampleId(b._id, t._id, idx),
            patientName: patient.name,
            citizenshipId: patient.citizenshipId,
          });
        }
      });
    }
    // newest published first
    out.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
    return out;
  }, [bookings]);

  const activeReportRow = useMemo(() => {
    if (!reportOpen) return null;
    return publishedReports.find((r) => r.rowKey === reportOpen) || null;
  }, [reportOpen, publishedReports]);

  return (
    <div className="max-w-6xl">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            View reports
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Download completed lab reports published by the technician.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Total:{" "}
          <span className="font-semibold text-slate-900">
            {publishedReports.length}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-white shadow-sm p-5">
        {loading && <p className="text-sm text-slate-600">Loading…</p>}

        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {!loading && !err && (
          <>
            {publishedReports.length === 0 ? (
              <p className="text-sm text-slate-600">
                No published reports yet. Your reports will appear here after the lab technician publishes them.
              </p>
            ) : (
              <div className="space-y-3">
                {publishedReports.map((x) => {
                  const dateText = x.publishedAt
                    ? new Date(x.publishedAt).toLocaleString()
                    : x.createdAt
                      ? new Date(x.createdAt).toLocaleString()
                      : "";

                  return (
                    <div
                      key={x.rowKey}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{x.testName}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Report ID:{" "}
                          <span className="font-medium text-slate-700">
                            {x.sampleId}
                          </span>
                          {dateText ? <span className="ml-2">• {dateText}</span> : null}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className={pillClass(x.status)}>{statusLabel(x.status)}</span>

                        <button
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                          onClick={() => setReportOpen(x.rowKey)}
                        >
                          View
                        </button>

                        <button
                          className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
                          onClick={() => printReport(x)}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Report modal */}
      {reportOpen && activeReportRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setReportOpen(null);
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
                  onClick={() => setReportOpen(null)}
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
                  <p className="text-sm font-semibold text-slate-900">Test Details</p>
                  <span className={pillClass(activeReportRow.status)}>
                    {statusLabel(activeReportRow.status)}
                  </span>
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  <div>
                    <span className="text-slate-500">Report ID:</span>{" "}
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

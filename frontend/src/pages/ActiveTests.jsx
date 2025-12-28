import React, { useEffect, useMemo, useState } from "react";

const pillClass = (status) => {
  const base = "text-[11px] font-semibold px-3 py-1 rounded-full";
  if (status === "Booked") return `${base} bg-slate-100 text-slate-700`;
  if (status === "Sample Collected") return `${base} bg-amber-50 text-amber-700`;
  if (status === "Processing") return `${base} bg-blue-50 text-blue-700`;
  if (status === "Report Published") return `${base} bg-green-50 text-green-700`;
  return `${base} bg-slate-100 text-slate-700`;
};

export default function ActiveTests() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErr("");

        const token = localStorage.getItem("token");
        const res = await fetch("/api/bookings/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load active tests");
        }

        setBookings(data.data || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Flatten bookings -> list of tests for display
  const activeTests = useMemo(() => {
    const out = [];
    for (const b of bookings) {
      for (const t of b.tests || []) {
        out.push({
          bookingId: b._id,
          createdAt: b.createdAt,
          bookingStatus: b.bookingStatus,
          paymentStatus: b.paymentStatus,
          testName: t.name,
          testPrice: t.price,
        });
      }
    }
    return out;
  }, [bookings]);

  return (
    <div className="max-w-6xl">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Active tests
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Your registered tests and their current status.
          </p>
        </div>

        <div className="text-xs text-slate-500">
          Total:{" "}
          <span className="font-semibold text-slate-900">
            {activeTests.length}
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
            {activeTests.length === 0 ? (
              <p className="text-sm text-slate-600">
                No active tests yet. Go to{" "}
                <span className="font-semibold">Register for tests</span> and
                create a booking.
              </p>
            ) : (
              <div className="space-y-3">
                {activeTests.map((x, idx) => {
                  const shortId = x.bookingId.slice(-6).toUpperCase();
                  const dateText = x.createdAt
                    ? new Date(x.createdAt).toLocaleString()
                    : "";

                  return (
                    <div
                      key={`${x.bookingId}-${idx}`}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {x.testName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Request ID:{" "}
                          <span className="font-medium text-slate-700">
                            #{shortId}
                          </span>
                          {dateText ? <span className="ml-2">• {dateText}</span> : null}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Payment:{" "}
                          <span className="font-medium text-slate-700">
                            {x.paymentStatus}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Price</p>
                          <p className="font-bold text-slate-900">
                            Rs. {x.testPrice}
                          </p>
                        </div>

                        <span className={pillClass(x.bookingStatus)}>
                          {x.bookingStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

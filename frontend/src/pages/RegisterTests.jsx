import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// prevents "Unexpected token <" when server returns HTML
async function safeJson(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {
      success: false,
      message: text?.slice(0, 120) || "Server returned invalid JSON",
    };
  }
}

function submitEsewaForm(paymentData) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
  form.target = "_self";

  const fields = {
    amount: String(paymentData.amount),
    tax_amount: "0",
    total_amount: String(paymentData.total_amount),
    transaction_uuid: paymentData.transaction_uuid,
    product_code: "EPAYTEST",
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: paymentData.success_url,
    failure_url: paymentData.failure_url,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature: paymentData.signature,
  };

  console.log("Sending eSewa form data:", fields);

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export default function RegisterTests() {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name-asc");
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadTests = async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch("/api/tests");
        const data = await safeJson(res);

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load tests");
        }

        setTests(data.data || []);
      } catch (e) {
        setErr(e.message || "Failed to load tests");
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let list = [...tests];

    if (query) {
      list = list.filter((t) => t.name?.toLowerCase().includes(query));
    }

    if (filter !== "all") {
      list = list.filter((t) => {
        const sample = t.sampleType?.toLowerCase() || "";
        const name = t.name?.toLowerCase() || "";

        if (filter === "blood") {
          return sample.includes("blood") || name.includes("blood");
        }

        if (filter === "urine") {
          return sample.includes("urine") || name.includes("urine");
        }

        if (filter === "swab") {
          return sample.includes("swab") || name.includes("swab");
        }

        return true;
      });
    }

    if (sort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price-asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === "price-desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));

    return list;
  }, [tests, q, filter, sort]);

  const selectedTests = useMemo(() => {
    const setIds = new Set(selected);
    return tests.filter((t) => setIds.has(t._id));
  }, [tests, selected]);

  const total = useMemo(() => {
    return selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);
  }, [selectedTests]);

  const toggleSelect = (id) => {
    setSuccessMsg("");
    setErr("");
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => {
    setErr("");
    setSuccessMsg("");
    setSelected([]);
  };

  const handleEsewaPayment = async () => {
    try {
      setCreating(true);
      setErr("");
      setSuccessMsg("");

      if (selected.length === 0) {
        setErr("Please select at least 1 test.");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setErr("You are not logged in. Please login again.");
        return;
      }

      // STEP 1: Create booking
      const bookingRes = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testIds: selected }),
      });

      const bookingData = await safeJson(bookingRes);

      if (!bookingRes.ok || !bookingData.success) {
        throw new Error(bookingData.message || "Booking failed");
      }

      const bookingId = bookingData.data?._id;

      if (!bookingId) {
        throw new Error("Booking ID not found.");
      }

      // STEP 2: Initiate eSewa payment
      const paymentRes = await fetch(`/api/payments/esewa/initiate/${bookingId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const paymentData = await safeJson(paymentRes);

      if (!paymentRes.ok || !paymentData.success) {
        throw new Error(paymentData.message || "Failed to initiate eSewa payment");
      }

      // STEP 3: Submit to eSewa
      submitEsewaForm(paymentData.data);
    } catch (e) {
      setErr(e.message || "Failed to initiate eSewa payment");
      setCreating(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Register for tests
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Select multiple tests and pay with eSewa to confirm booking.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm font-medium text-slate-700 hover:text-blue-700 flex items-center gap-2"
        >
          <span className="text-lg leading-none">←</span>
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-blue-100 bg-white shadow-sm p-5">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tests (e.g., CBC, Vitamin D)"
                className="w-full sm:w-80 rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
              />

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-blue-400"
              >
                <option value="all">Filter: All</option>
                <option value="blood">Blood Tests</option>
                <option value="urine">Urine Tests</option>
                <option value="swab">Swab Tests</option>
              </select>
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white outline-none focus:border-blue-400"
            >
              <option value="name-asc">Sort: Name (A–Z)</option>
              <option value="price-asc">Sort: Price (Low → High)</option>
              <option value="price-desc">Sort: Price (High → Low)</option>
            </select>
          </div>

          {loading && <div className="mt-6 text-sm text-slate-600">Loading tests…</div>}

          {err && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {err}
            </div>
          )}

          {successMsg && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              {successMsg}
            </div>
          )}

          {!loading && !err && (
            <>
              <div className="mt-6 text-xs text-slate-500">
                Click to select multiple tests.
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((t) => {
                  const isSelected = selected.includes(t._id);

                  return (
                    <button
                      type="button"
                      key={t._id}
                      onClick={() => toggleSelect(t._id)}
                      className={`text-left rounded-2xl border p-5 transition ${
                        isSelected
                          ? "border-blue-400 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-base font-semibold text-slate-900">
                            {t.name}
                          </div>
                          <div className="text-sm text-slate-500 mt-1">
                            Sample:{" "}
                            <span className="text-slate-700">{t.sampleType}</span>
                            <span className="mx-2">•</span>
                            Result in:{" "}
                            <span className="text-slate-700">
                              {t.turnaroundTime}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-xs text-slate-500">Price</div>
                          <div className="text-lg font-bold text-slate-900">
                            Rs. {t.price}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isSelected ? "Selected" : "Tap to select"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {isSelected ? "✓" : ""}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="mt-6 text-sm text-slate-600">
                  No tests match your search.
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-900">Selected tests</h2>
          <p className="text-xs text-slate-500 mt-1">Review and pay to confirm.</p>

          <div className="mt-4 space-y-2 text-sm">
            {selectedTests.length === 0 ? (
              <div className="text-sm text-slate-600">No tests selected yet.</div>
            ) : (
              selectedTests.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="text-slate-800 text-xs font-medium">
                    {t.name}
                  </div>
                  <div className="text-slate-900 text-xs font-semibold">
                    Rs. {t.price}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 border-t border-slate-200 pt-4 flex items-center justify-between">
            <span className="text-sm text-slate-600">Total</span>
            <span className="text-lg font-bold text-slate-900">Rs. {total}</span>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={clearSelection}
              disabled={selected.length === 0 || creating}
              className={`w-1/2 rounded-xl px-4 py-2 text-sm font-medium border transition ${
                selected.length === 0 || creating
                  ? "border-slate-200 text-slate-400 cursor-not-allowed"
                  : "border-slate-200 text-slate-700 hover:border-blue-400"
              }`}
            >
              Clear
            </button>

            <button
              onClick={handleEsewaPayment}
              disabled={creating || selected.length === 0}
              className={`w-1/2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                creating || selected.length === 0
                  ? "bg-green-200 text-white cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {creating ? "Processing..." : "Pay with eSewa"}
            </button>
          </div>

          <p className="mt-3 text-[11px] text-slate-500">
            Booking will be created when you proceed to payment.
          </p>
        </div>
      </div>
    </div>
  );
}
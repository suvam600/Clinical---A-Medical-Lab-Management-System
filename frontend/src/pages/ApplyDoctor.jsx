import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Stethoscope } from "lucide-react";

export default function ApplyDoctor() {
  const [form, setForm] = useState({
    degree: "",
    specialization: "",
    experience: "",
    description: "",
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      setLoading(true);

      const data = new FormData();
      data.append("degree", form.degree);
      data.append("specialization", form.specialization);
      data.append("experience", form.experience);
      data.append("description", form.description);

      Array.from(files).forEach((file) => {
        data.append("proofFiles", file);
      });

      const res = await fetch("/api/doctor-applications/apply", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to submit application.");
      }

      setMessage("Application submitted successfully.");
      setForm({
        degree: "",
        specialization: "",
        experience: "",
        description: "",
      });
      setFiles([]);
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-white px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link to="/" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>

        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-8 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Stethoscope size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Apply for Doctor</h1>
                <p className="mt-1 text-sm text-blue-100">
                  Submit your professional details and proof documents for admin review.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {message ? (
              <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                {message}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Degree
                </label>
                <input
                  name="degree"
                  value={form.degree}
                  onChange={handleChange}
                  required
                  placeholder="MBBS, MD"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Specialization
                </label>
                <input
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  required
                  placeholder="General Physician"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Experience
                </label>
                <input
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  required
                  placeholder="5 years"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Proof documents
                </label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                  <Upload size={18} />
                  Upload files
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={(e) => setFiles(e.target.files)}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-xs text-slate-500">
                  {files?.length ? `${files.length} file(s) selected` : "Images or PDF accepted"}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Write a short professional description..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Your request will be reviewed by the admin before doctor access is granted.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-300/40 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
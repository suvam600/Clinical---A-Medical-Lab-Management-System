import React, { useEffect, useState } from "react";

const Consult = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");

  const token = localStorage.getItem("token");

  const fetchDoctors = async (spec = "") => {
    try {
      const url = spec
        ? `/api/consultations/doctors?specialization=${spec}`
        : `/api/consultations/doctors`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success) {
        setDoctors(data.data);
      }
    } catch (err) {
      console.error("Failed to load doctors", err);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSelectDoctor = async (doctorId) => {
    try {
      const res = await fetch("/api/consultations/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctorId }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = `/consultation/${data.data._id}`;
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error("Error creating consultation", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Choose Doctor</h1>

      {/* Filter */}
      <select
        value={specialization}
        onChange={(e) => {
          setSpecialization(e.target.value);
          fetchDoctors(e.target.value);
        }}
        className="mb-4 border p-2 rounded"
      >
        <option value="">All</option>
        <option value="Cardiologist">Cardiologist</option>
        <option value="Dermatologist">Dermatologist</option>
        <option value="General Physician">General Physician</option>
        <option value="Gynecologist">Gynecologist</option>
        <option value="Pediatrician">Pediatrician</option>
      </select>

      {/* Doctor List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {doctors.map((doc) => (
          <div
            key={doc._id}
            className="border rounded-xl p-4 shadow-sm"
          >
            <h2 className="text-lg font-semibold">
              {doc.userId?.name}
            </h2>
            <p className="text-sm text-gray-600">
              {doc.specialization}
            </p>
            <p className="text-sm">{doc.degree}</p>
            <p className="text-xs text-gray-500">
              {doc.experience}
            </p>

            <button
              onClick={() => handleSelectDoctor(doc._id)}
              className="mt-3 bg-blue-600 text-white px-3 py-1 rounded"
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Consult;
import React, { useEffect, useState } from "react";
import axios from "axios";

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  vin: string;
  color: string;
  plate: string;
  currentOdometer: number;
  status: "available" | "out" | "maintenance";
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [editData, setEditData] = useState<Partial<Vehicle>>({});
  const API_URL = "https://kv-dashboard-server.onrender.com"; // your Render URL

  useEffect(() => {
    axios.get(`${API_URL}/vehicles`).then((res) => setVehicles(res.data));
  }, []);

  const openVehicle = (v: Vehicle) => {
    setSelected(v);
    setEditData(v);
  };

  const closeModal = () => {
    setSelected(null);
    setEditData({});
  };

  const saveVehicle = async () => {
    if (!selected) return;
    await axios.put(`${API_URL}/vehicles/${selected.id}`, editData);
    const res = await axios.get(`${API_URL}/vehicles`);
    setVehicles(res.data);
    closeModal();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Vehicles</h1>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2">Year</th>
            <th className="border px-2">Make</th>
            <th className="border px-2">Model</th>
            <th className="border px-2">Plate</th>
            <th className="border px-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => (
            <tr
              key={v.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => openVehicle(v)}
            >
              <td className="border px-2">{v.year}</td>
              <td className="border px-2">{v.make}</td>
              <td className="border px-2">{v.model}</td>
              <td className="border px-2">{v.plate}</td>
              <td className="border px-2">{v.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-lg font-bold mb-4">Edit Vehicle</h2>
            {[
              "year",
              "make",
              "model",
              "vin",
              "color",
              "plate",
              "currentOdometer",
            ].map((field) => (
              <div key={field} className="mb-2">
                <label className="block text-sm font-medium capitalize">
                  {field}
                </label>
                <input
                  className="w-full border p-1"
                  value={(editData as any)[field] ?? ""}
                  onChange={(e) =>
                    setEditData({ ...editData, [field]: e.target.value })
                  }
                />
              </div>
            ))}

            <div className="mb-2">
              <label className="block text-sm font-medium">Status</label>
              <select
                className="w-full border p-1"
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value as any })
                }
              >
                <option value="available">Available</option>
                <option value="out">Out</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="px-3 py-1 border" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-green-500 text-white rounded"
                onClick={saveVehicle}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

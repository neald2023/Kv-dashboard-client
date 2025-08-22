import React, { useEffect, useState } from "react";
import "./index.css";

// 🔌 Your server base URL (set on Vercel as VITE_API_URL)
const API = import.meta.env.VITE_API_URL;

// ---------------- Shared small UI bits ----------------
const Button = ({ children, ...props }) => (
  <button
    className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
    {...props}
  >
    {children}
  </button>
);

const Secondary = ({ children, ...props }) => (
  <button
    className="px-3 py-2 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-sm"
    {...props}
  >
    {children}
  </button>
);

const Tag = ({ color = "zinc", children }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded text-xs bg-${color}-800/40 border border-${color}-700 text-${color}-100`}
  >
    {children}
  </span>
);

// ---------------- Vehicles Modal ----------------
function VehicleModal({ open, initial, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    id: "",
    year: "",
    make: "",
    model: "",
    vin: "",
    color: "",
    plate: "",
    currentOdometer: "",
    status: "available",
  }));

  useEffect(() => {
    if (open) {
      setForm({
        id: initial?.id || "",
        year: initial?.year ?? "",
        make: initial?.make ?? "",
        model: initial?.model ?? "",
        vin: initial?.vin ?? "",
        color: initial?.color ?? "",
        plate: initial?.plate ?? "",
        // keep as string so you can delete leading zero
        currentOdometer:
          initial?.currentOdometer !== undefined
            ? String(initial.currentOdometer)
            : "",
        status: initial?.status ?? "available",
      });
    }
  }, [open, initial]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    const payload = {
      ...form,
      year: form.year ? Number(form.year) : undefined,
      currentOdometer:
        form.currentOdometer === "" ? 0 : Number(form.currentOdometer),
    };

    const isNew = !form.id;
    const url = isNew ? `${API}/vehicles` : `${API}/vehicles/${form.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    onSaved(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl rounded-lg bg-zinc-900 border border-zinc-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {form.id ? "Edit Vehicle" : "Add Vehicle"}
          </h3>
          <button onClick={onClose} className="text-zinc-300">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="mb-1">Year</div>
            <input
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1"
              value={form.year}
              onChange={set("year")}
              inputMode="numeric"
              placeholder="2022"
            />
          </label>
          <label className="text-sm">
            <div className="mb-1">Make</div>
            <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.make} onChange={set("make")} />
          </label>
          <label className="text-sm">
            <div className="mb-1">Model</div>
            <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.model} onChange={set("model")} />
          </label>
          <label className="text-sm">
            <div className="mb-1">VIN</div>
            <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.vin} onChange={set("vin")} />
          </label>
          <label className="text-sm">
            <div className="mb-1">Color</div>
            <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.color} onChange={set("color")} />
          </label>
          <label className="text-sm">
            <div className="mb-1">License Plate</div>
            <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.plate} onChange={set("plate")} />
          </label>
          <label className="text-sm">
            <div className="mb-1">Odometer</div>
            <input
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1"
              value={form.currentOdometer}
              onChange={set("currentOdometer")}
              inputMode="numeric"
              placeholder="41250"
            />
          </label>
          <label className="text-sm">
            <div className="mb-1">Status</div>
            <select
              className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1"
              value={form.status}
              onChange={set("status")}
            >
              <option value="available">available</option>
              <option value="out">out</option>
              <option value="service">service</option>
            </select>
          </label>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Secondary onClick={onClose}>Cancel</Secondary>
          <Button onClick={save}>Save Vehicle</Button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Customers Modal ----------------
function CustomerModal({ open, initial, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    id: "",
    name: "",
    phone: "",
    email: "",
    licenseNumber: "",
    insurance: { carrier: "", policyNumber: "", expiresAt: "" },
    documents: { driverLicenseUrl: "", insuranceCardUrl: "" },
  }));

  useEffect(() => {
    if (open) {
      setForm({
        id: initial?.id || "",
        name: initial?.name ?? "",
        phone: initial?.phone ?? "",
        email: initial?.email ?? "",
        licenseNumber: initial?.licenseNumber ?? "",
        insurance: {
          carrier: initial?.insurance?.carrier ?? "",
          policyNumber: initial?.insurance?.policyNumber ?? "",
          expiresAt: initial?.insurance?.expiresAt ?? "",
        },
        documents: {
          driverLicenseUrl: initial?.documents?.driverLicenseUrl ?? "",
          insuranceCardUrl: initial?.documents?.insuranceCardUrl ?? "",
        },
      });
    }
  }, [open, initial]);

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setIns = (k) => (e) =>
    setForm((f) => ({ ...f, insurance: { ...f.insurance, [k]: e.target.value } }));
  const setDocs = (k) => (e) =>
    setForm((f) => ({ ...f, documents: { ...f.documents, [k]: e.target.value } }));

  const save = async () => {
    const isNew = !form.id;
    const url = isNew ? `${API}/customers` : `${API}/customers/${form.id}`;
    const method = isNew ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    onSaved(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-3xl rounded-lg bg-zinc-900 border border-zinc-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {form.id ? "Edit Customer" : "Add Customer"}
          </h3>
          <button onClick={onClose} className="text-zinc-300">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <div className="mb-1">Full Name</div>
            <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.name} onChange={set("name")} />
          </label>
          <label className="text-sm">
            <div className="mb-1">Phone</div>
            <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.phone} onChange={set("phone")} placeholder="+1 555-123-4567" />
          </label>
          <label className="text-sm">
            <div className="mb-1">Email</div>
            <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.email} onChange={set("email")} />
          </label>
          <label className="text-sm">
            <div className="mb-1">Driver License #</div>
            <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.licenseNumber} onChange={set("licenseNumber")} />
          </label>

          <div className="col-span-2 mt-2 border-t border-zinc-700 pt-3">
            <div className="font-medium mb-2">Insurance</div>
            <div className="grid grid-cols-3 gap-3">
              <label className="text-sm">
                <div className="mb-1">Carrier</div>
                <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.insurance.carrier} onChange={setIns("carrier")} />
              </label>
              <label className="text-sm">
                <div className="mb-1">Policy #</div>
                <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.insurance.policyNumber} onChange={setIns("policyNumber")} />
              </label>
              <label className="text-sm">
                <div className="mb-1">Expires</div>
                <input type="date" className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.insurance.expiresAt} onChange={setIns("expiresAt")} />
              </label>
            </div>
          </div>

          <div className="col-span-2 mt-2 border-t border-zinc-700 pt-3">
            <div className="font-medium mb-2">Documents (URLs for now)</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                <div className="mb-1">Driver License Photo URL</div>
                <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.documents.driverLicenseUrl} onChange={setDocs("driverLicenseUrl")} placeholder="https://..." />
              </label>
              <label className="text-sm">
                <div className="mb-1">Insurance Card Photo URL</div>
                <input className="w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1" value={form.documents.insuranceCardUrl} onChange={setDocs("insuranceCardUrl")} placeholder="https://..." />
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Secondary onClick={onClose}>Cancel</Secondary>
          <Button onClick={save}>Save Customer</Button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Main App ----------------
const TABS = ["Dashboard", "Vehicles", "Customers"];

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [online, setOnline] = useState(false);

  // Vehicles state
  const [vehicles, setVehicles] = useState([]);
  const [vehOpen, setVehOpen] = useState(false);
  const [vehEditing, setVehEditing] = useState(null);

  // Customers state
  const [customers, setCustomers] = useState([]);
  const [cusOpen, setCusOpen] = useState(false);
  const [cusEditing, setCusEditing] = useState(null);

  // Ping server & load data when tab opens
  useEffect(() => {
    const ping = async () => {
      try {
        const r = await fetch(`${API}/health`);
        setOnline(r.ok);
      } catch {
        setOnline(false);
      }
    };
    ping();
  }, []);

  useEffect(() => {
    const loadVehicles = async () => {
      const r = await fetch(`${API}/vehicles`);
      setVehicles(await r.json());
    };
    const loadCustomers = async () => {
      const r = await fetch(`${API}/customers`);
      setCustomers(await r.json());
    };

    if (tab === "Vehicles") loadVehicles();
    if (tab === "Customers") loadCustomers();
  }, [tab]);

  // helpers for tags
  const statusColor = (s) =>
    s === "available" ? "emerald" : s === "out" ? "yellow" : "orange";

  // save handlers (update local list optimistically)
  const onVehicleSaved = (v) => {
    setVehicles((list) => {
      const i = list.findIndex((x) => x.id === v.id);
      if (i === -1) return [v, ...list];
      const copy = [...list];
      copy[i] = v;
      return copy;
    });
  };

  const onCustomerSaved = (c) => {
    setCustomers((list) => {
      const i = list.findIndex((x) => x.id === c.id);
      if (i === -1) return [c, ...list];
      const copy = [...list];
      copy[i] = c;
      return copy;
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="font-semibold">K.V. Rentals • Team Dashboard</div>
          <div className="ml-auto flex items-center gap-1">
            <Tag color={online ? "emerald" : "rose"}>
              {online ? "Live" : "Offline"}
            </Tag>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded ${
                tab === t ? "bg-emerald-700 text-white" : "bg-zinc-800"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {tab === "Dashboard" && (
          <div className="text-zinc-300">
            <p className="mb-2">Welcome back! Use the tabs to manage data.</p>
            <p className="text-sm opacity-70">
              Data source: <code>VITE_API_URL</code> → {API || "(not set)"}
            </p>
          </div>
        )}

        {tab === "Vehicles" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Vehicles</h2>
              <Button
                onClick={() => {
                  setVehEditing(null);
                  setVehOpen(true);
                }}
              >
                + Add Vehicle
              </Button>
            </div>
            <div className="overflow-x-auto border border-zinc-800 rounded">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2 text-left">Vehicle</th>
                    <th className="px-3 py-2 text-left">Plate</th>
                    <th className="px-3 py-2 text-left">Odometer</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id} className="border-t border-zinc-800">
                      <td className="px-3 py-2">
                        {v.year} {v.make} {v.model}
                      </td>
                      <td className="px-3 py-2">{v.plate}</td>
                      <td className="px-3 py-2">{v.currentOdometer?.toLocaleString?.() ?? v.currentOdometer}</td>
                      <td className="px-3 py-2">
                        <Tag color={statusColor(v.status)}>{v.status}</Tag>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Secondary
                          onClick={() => {
                            setVehEditing(v);
                            setVehOpen(true);
                          }}
                        >
                          Edit
                        </Secondary>
                      </td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-zinc-400" colSpan={5}>
                        No vehicles yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <VehicleModal
              open={vehOpen}
              initial={vehEditing}
              onClose={() => setVehOpen(false)}
              onSaved={onVehicleSaved}
            />
          </>
        )}

        {tab === "Customers" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Customers</h2>
              <Button
                onClick={() => {
                  setCusEditing(null);
                  setCusOpen(true);
                }}
              >
                + Add Customer
              </Button>
            </div>
            <div className="overflow-x-auto border border-zinc-800 rounded">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Phone</th>
                    <th className="px-3 py-2 text-left">Email</th>
                    <th className="px-3 py-2 text-left">License #</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-t border-zinc-800">
                      <td className="px-3 py-2">{c.name}</td>
                      <td className="px-3 py-2">{c.phone}</td>
                      <td className="px-3 py-2">{c.email}</td>
                      <td className="px-3 py-2">{c.licenseNumber}</td>
                      <td className="px-3 py-2 text-right">
                        <Secondary
                          onClick={() => {
                            setCusEditing(c);
                            setCusOpen(true);
                          }}
                        >
                          Profile
                        </Secondary>
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td className="px-3 py-6 text-center text-zinc-400" colSpan={5}>
                        No customers yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <CustomerModal
              open={cusOpen}
              initial={cusEditing}
              onClose={() => setCusOpen(false)}
              onSaved={onCustomerSaved}
            />
          </>
        )}
      </div>
    </div>
  );
}

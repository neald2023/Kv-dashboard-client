// src/App.jsx (REPLACE THE WHOLE FILE WITH THIS)

import React, { useEffect, useState } from "react";
import "./index.css";

// -------- helper: API base (from Vercel env or global) ----------
const API = import.meta?.env?.VITE_API_URL || window.VITE_API_URL || "";

// ----------- Small shared UI bits -----------
const Tag = ({ children, tone = "default" }) => {
  const tones = {
    default: "bg-zinc-800 text-zinc-200 border-zinc-700",
    green: "bg-emerald-600/20 text-emerald-300 border-emerald-600/40",
    red: "bg-rose-600/20 text-rose-300 border-rose-600/40",
    amber: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  };
  return (
    <span className={`px-2 py-0.5 text-xs border rounded ${tones[tone] || tones.default}`}>
      {children}
    </span>
  );
};

const Card = ({ title, children, right }) => (
  <div className="rounded border border-zinc-800 bg-zinc-900/50">
    <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
      <div className="text-sm text-gray-300">{title}</div>
      {right}
    </div>
    <div className="p-3">{children}</div>
  </div>
);

// ================== VEHICLES ==================
function VehiclesTab() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/vehicles`);
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map((v) => ({
          id: v.id ?? crypto.randomUUID(),
          name: v.name ?? `${v.make ?? ""} ${v.model ?? ""}`.trim(),
          year: v.year ?? "",
          make: v.make ?? "",
          model: v.model ?? "",
          vin: v.vin ?? "",
          color: v.color ?? "",
          plate: v.plate ?? "",
          currentOdometer: v.currentOdometer ?? v.odometer ?? 0,
          status: v.status ?? "available",
        }));
        if (!cancelled) setVehicles(normalized);
      } catch (e) {
        console.error("Failed to load vehicles:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openNew = () => {
    setDraft({
      id: crypto.randomUUID(),
      name: "",
      year: "",
      make: "",
      model: "",
      vin: "",
      color: "",
      plate: "",
      currentOdometer: 0,
      status: "available",
    });
    setShowModal(true);
  };

  const openEdit = (v) => {
    setDraft({ ...v });
    setShowModal(true);
  };

  const saveDraft = () => {
    // local-only for now
    setVehicles((prev) => {
      const i = prev.findIndex((p) => p.id === draft.id);
      const copy = [...prev];
      if (i === -1) copy.push(draft);
      else copy[i] = draft;
      return copy;
    });
    setShowModal(false);
  };

  const updateStatusInline = (id, next) => {
    setVehicles((prev) => prev.map((v) => (v.id === id ? { ...v, status: next } : v)));
  };

  return (
    <div className="space-y-3">
      <Card
        title="Vehicles"
        right={
          <button
            onClick={openNew}
            className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            + Add Vehicle
          </button>
        }
      >
        {loading ? (
          <div className="text-sm text-gray-400">Loading vehicles…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-300">
                <tr>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Plate</th>
                  <th className="px-3 py-2">Odometer</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-2">
                      <div className="font-medium">{v.name || "Untitled vehicle"}</div>
                      <div className="text-xs text-gray-400">{[v.year, v.make, v.model].filter(Boolean).join(" • ")}</div>
                    </td>
                    <td className="px-3 py-2">{v.plate}</td>
                    <td className="px-3 py-2">{String(v.currentOdometer)}</td>
                    <td className="px-3 py-2">
                      <select
                        value={v.status}
                        onChange={(e) => updateStatusInline(v.id, e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm"
                      >
                        <option value="available">available</option>
                        <option value="out">out</option>
                        <option value="maintenance">maintenance</option>
                        <option value="inactive">inactive</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => openEdit(v)}
                        className="px-2 py-1 text-xs rounded border border-zinc-600 hover:bg-zinc-800"
                      >
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-3 py-6 text-center text-gray-400">
                      No vehicles yet. Click “Add Vehicle”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          (Edits are local only—mock. We’ll wire Save to the server later.)
        </p>
      </Card>

      {showModal && draft && (
        <VehicleModal
          draft={draft}
          setDraft={setDraft}
          onCancel={() => setShowModal(false)}
          onSave={saveDraft}
        />
      )}
    </div>
  );
}

function VehicleModal({ draft, setDraft, onCancel, onSave }) {
  const Field = ({ label, prop, type = "text", placeholder = "" }) => (
    <label className="block">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type={type}
        value={draft[prop] ?? ""}
        onChange={(e) =>
          setDraft((d) => ({
            ...d,
            [prop]: type === "number" ? Number(e.target.value || 0) : e.target.value,
          }))
        }
        placeholder={placeholder}
        className="mt-1 w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-sm"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-zinc-900 border border-zinc-700">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="font-semibold">Vehicle Profile</div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-200 text-sm">✕</button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" prop="name" placeholder="e.g., Toyota RAV4" />
          <Field label="Plate" prop="plate" placeholder="ABC-123" />
          <Field label="Year" prop="year" type="number" placeholder="2021" />
          <Field label="Make" prop="make" placeholder="Toyota" />
          <Field label="Model" prop="model" placeholder="RAV4" />
          <Field label="VIN" prop="vin" placeholder="17-char VIN" />
          <Field label="Color" prop="color" placeholder="Silver" />
          <Field label="Odometer" prop="currentOdometer" type="number" placeholder="41250" />
          <label className="block">
            <span className="text-xs text-gray-400">Status</span>
            <select
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              className="mt-1 w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-sm"
            >
              <option value="available">available</option>
              <option value="out">out</option>
              <option value="maintenance">maintenance</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
        </div>

        <div className="px-4 py-3 border-t border-zinc-800 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded border border-zinc-600 hover:bg-zinc-800">Cancel</button>
          <button onClick={onSave} className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>
  );
}

// ================== CUSTOMERS ==================
function CustomersTab() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/customers`);
        const data = await res.json();
        const normalized = (Array.isArray(data) ? data : []).map((c, i) => ({
          id: c.id ?? `cust_${i}`,
          name: c.name ?? "",
          email: c.email ?? "",
          phone: c.phone ?? "",
          license: c.license ?? "",
          status: c.status ?? "active",
        }));
        if (!cancelled) setRows(normalized);
      } catch (e) {
        console.error("Failed to load customers:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const openNew = () => {
    setDraft({ id: crypto.randomUUID(), name: "", email: "", phone: "", license: "", status: "active" });
    setShow(true);
  };
  const openEdit = (c) => { setDraft({ ...c }); setShow(true); };
  const save = () => {
    setRows((prev) => {
      const i = prev.findIndex((p) => p.id === draft.id);
      const copy = [...prev];
      if (i === -1) copy.push(draft); else copy[i] = draft;
      return copy;
    });
    setShow(false);
  };

  return (
    <div className="space-y-3">
      <Card
        title="Customers"
        right={
          <button
            onClick={openNew}
            className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700"
          >
            + Add Customer
          </button>
        }
      >
        {loading ? (
          <div className="text-sm text-gray-400">Loading customers…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-gray-300">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">License</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {rows.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-900/40">
                    <td className="px-3 py-2 font-medium">{c.name || "Unnamed"}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-300">{c.email}</div>
                      <div className="text-xs text-gray-400">{c.phone}</div>
                    </td>
                    <td className="px-3 py-2">{c.license}</td>
                    <td className="px-3 py-2">
                      <Tag tone={c.status === "active" ? "green" : "amber"}>{c.status}</Tag>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => openEdit(c)}
                        className="px-2 py-1 text-xs rounded border border-zinc-600 hover:bg-zinc-800"
                      >
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-3 py-6 text-center text-gray-400">
                      No customers yet. Click “Add Customer”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-2">
          (Edits are local only—mock. We’ll connect to the server later.)
        </p>
      </Card>

      {show && draft && (
        <CustomerModal draft={draft} setDraft={setDraft} onCancel={() => setShow(false)} onSave={save} />
      )}
    </div>
  );
}

function CustomerModal({ draft, setDraft, onCancel, onSave }) {
  const Field = ({ label, prop, type = "text", placeholder = "" }) => (
    <label className="block">
      <span className="text-xs text-gray-400">{label}</span>
      <input
        type={type}
        value={draft[prop] ?? ""}
        onChange={(e) => setDraft((d) => ({ ...d, [prop]: e.target.value }))}
        placeholder={placeholder}
        className="mt-1 w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-sm"
      />
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-lg bg-zinc-900 border border-zinc-700">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="font-semibold">Customer Profile</div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-200 text-sm">✕</button>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Name" prop="name" placeholder="Jane Doe" />
          <Field label="Email" prop="email" placeholder="jane@example.com" />
          <Field label="Phone" prop="phone" placeholder="(555) 123-4567" />
          <Field label="Driver License" prop="license" placeholder="D1234567" />
          <label className="block">
            <span className="text-xs text-gray-400">Status</span>
            <select
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
              className="mt-1 w-full rounded bg-zinc-800 border border-zinc-700 px-2 py-1.5 text-sm"
            >
              <option value="active">active</option>
              <option value="blocked">blocked</option>
            </select>
          </label>
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded border border-zinc-600 hover:bg-zinc-800">Cancel</button>
          <button onClick={onSave} className="px-3 py-1.5 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-700">Save</button>
        </div>
      </div>
    </div>
  );
}

// ================== DASHBOARD ==================
function DashboardTab() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch(`${API}/stats/summary`);
        const d = await r.json();
        if (!cancel) setStats(d);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancel = true; };
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      <Card title="Total Bookings">
        <div className="text-2xl font-semibold">{stats?.bookingsTotal ?? "—"}</div>
      </Card>
      <Card title="Active Rentals">
        <div className="text-2xl font-semibold">{stats?.activeRentals ?? "—"}</div>
      </Card>
      <Card title="Vehicles">
        <div className="text-2xl font-semibold">{stats?.vehicles ?? "—"}</div>
      </Card>
      <Card title="Revenue">
        <div className="text-2xl font-semibold">
          {stats?.revenue != null ? `$${Number(stats.revenue).toLocaleString()}` : "—"}
        </div>
      </Card>
    </div>
  );
}

// ================== APP SHELL ==================
const TABS = ["Dashboard", "Calendar", "Bookings", "Customers", "Vehicles", "Team Chat", "Finances"];

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [online, setOnline] = useState(false);

  // light ping for status
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const r = await fetch(`${API}/health`);
        const d = await r.json();
        if (!canceled) setOnline(!!d?.ok);
      } catch {
        if (!canceled) setOnline(false);
      }
    })();
    return () => { canceled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-3 py-3 flex items-center gap-3">
          <div className="text-emerald-400 font-semibold">K.V. Rentals</div>
          <div className="text-gray-400">Team Dashboard</div>
          <div className="ml-auto">
            {online ? <Tag tone="green">Live</Tag> : <Tag tone="red">Offline</Tag>}
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-3 pb-3 flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-3 py-1.5 rounded text-sm border ${
                active === t
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-4 space-y-4">
        {active === "Dashboard" && <DashboardTab />}
        {active === "Calendar" && <Card title="Calendar">Calendar view coming next.</Card>}
        {active === "Bookings" && <Card title="Bookings">Bookings board coming next.</Card>}
        {active === "Customers" && <CustomersTab />}
        {active === "Vehicles" && <VehiclesTab />}
        {active === "Team Chat" && <Card title="Team Chat">Chat placeholder.</Card>}
        {active === "Finances" && <Card title="Finances">Finance KPIs coming next.</Card>}

        <div className="text-xs text-gray-500 pt-4">
          Data source: <code>VITE_API_URL</code> → {API || "(not set)"}
        </div>
      </main>
    </div>
  );
}

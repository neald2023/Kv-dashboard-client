import React, { useEffect, useState } from "react";
import "./index.css";

// ======= Config =======
const API_BASE = import.meta.env.VITE_API_URL || "";

// Simple helper to fetch JSON with basic error handling
async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Fetch failed: ${path} (${res.status})`);
  return res.json();
}

// Small UI helpers
const Pill = ({ children, tone = "slate" }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-${tone}-800 text-${tone}-100`}
    style={{
      backgroundColor: tone === "green" ? "#064e3b" : tone === "red" ? "#7f1d1d" : tone === "amber" ? "#78350f" : "#1f2937",
      color: "#e5e7eb",
    }}
  >
    {children}
  </span>
);

const StatCard = ({ label, value }) => (
  <div className="bg-[#111418] rounded-md p-4 border border-[#23262d]">
    <div className="text-xs text-gray-400">{label}</div>
    <div className="mt-2 text-2xl font-semibold text-gray-100 tabular-nums">
      {value ?? "—"}
    </div>
  </div>
);

const Modal = ({ open, title, children, onClose, onSave, saveLabel = "Save" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-[560px] max-w-[92vw] rounded-lg border border-[#2a2e36] bg-[#0c0f14] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#2a2e36] px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-lg">×</button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded-md border border-[#2a2e36] text-gray-200 hover:bg-[#141821]">Cancel</button>
          <button onClick={onSave} className="px-3 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-500">
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// ======= Vehicles Tab =======
function VehiclesTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const [editing, setEditing] = useState(null); // vehicle object being edited
  const [draft, setDraft] = useState(null);     // working copy

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const health = await fetchJSON("/health");
        if (mounted) setLive(!!health.ok);
      } catch {
        setLive(false);
      }
      try {
        const data = await fetchJSON("/vehicles");
        if (mounted) setRows(data || []);
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const onOpen = (veh) => {
    setEditing(veh);
    setDraft({ ...veh });
  };

  const onSave = () => {
    // client-side update only (mock). In the real app we’ll PATCH to the server.
    setRows((prev) => prev.map((v) => (v.id === draft.id ? { ...draft } : v)));
    setEditing(null);
    setDraft(null);
  };

  const addNew = () => {
    const v = {
      id: `veh_${Date.now()}`,
      year: 2022,
      make: "",
      model: "",
      vin: "",
      color: "",
      plate: "",
      currentOdometer: 0,
      status: "available",
    };
    setRows((prev) => [v, ...prev]);
    setEditing(v);
    setDraft({ ...v });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-100">Vehicles</h2>
        <div className="flex items-center gap-2">
          <Pill tone={live ? "green" : "red"}>{live ? "Live" : "Offline"}</Pill>
          <button
            onClick={addNew}
            className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-500"
          >
            + Add Vehicle
          </button>
        </div>
      </div>

      <div className="bg-[#0c0f14] rounded-md border border-[#23262d] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0e1218] text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left">Vehicle</th>
              <th className="px-3 py-2 text-left">Plate</th>
              <th className="px-3 py-2 text-left">Odometer</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4 text-gray-400" colSpan={4}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-4 text-gray-400" colSpan={4}>No vehicles yet.</td></tr>
            ) : (
              rows.map((v) => (
                <tr
                  key={v.id}
                  className="border-t border-[#23262d] hover:bg-[#121723] cursor-pointer"
                  onClick={() => onOpen(v)}
                >
                  <td className="px-3 py-2 text-gray-100">
                    {v.year ? `${v.year} ${v.make} ${v.model}`.trim() : `${v.make} ${v.model}`.trim() || "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-200">{v.plate || "—"}</td>
                  <td className="px-3 py-2 text-gray-200 tabular-nums">{v.currentOdometer?.toLocaleString?.() ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Pill tone={v.status === "available" ? "green" : v.status === "out" ? "amber" : "slate"}>
                      {v.status || "—"}
                    </Pill>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        title="Vehicle Profile"
        onClose={() => { setEditing(null); setDraft(null); }}
        onSave={onSave}
        saveLabel="Save Vehicle"
      >
        {draft && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Year</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                type="number"
                value={draft.year ?? ""}
                onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Make</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.make ?? ""}
                onChange={(e) => setDraft({ ...draft, make: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Model</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.model ?? ""}
                onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">VIN</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.vin ?? ""}
                onChange={(e) => setDraft({ ...draft, vin: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Color</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.color ?? ""}
                onChange={(e) => setDraft({ ...draft, color: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">License Plate</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.plate ?? ""}
                onChange={(e) => setDraft({ ...draft, plate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Odometer</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                type="number"
                value={draft.currentOdometer ?? 0}
                onChange={(e) => setDraft({ ...draft, currentOdometer: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select
                className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.status ?? "available"}
                onChange={(e) => setDraft({ ...draft, status: e.target.value })}
              >
                <option value="available">available</option>
                <option value="out">out</option>
                <option value="maintenance">maintenance</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ======= Customers Tab =======
function CustomersTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);

  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const health = await fetchJSON("/health");
        if (mounted) setLive(!!health.ok);
      } catch {
        setLive(false);
      }
      try {
        const data = await fetchJSON("/customers");
        if (mounted) setRows(data || []);
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const onOpen = (c) => {
    setEditing(c);
    setDraft({ ...c });
  };

  const onSave = () => {
    setRows((prev) => prev.map((c) => (c.id === draft.id ? { ...draft } : c)));
    setEditing(null);
    setDraft(null);
  };

  const addNew = () => {
    const c = {
      id: `cust_${Date.now()}`,
      name: "",
      phone: "",
      email: "",
      dlNumber: "",
    };
    setRows((prev) => [c, ...prev]);
    setEditing(c);
    setDraft({ ...c });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-100">Customers</h2>
        <div className="flex items-center gap-2">
          <Pill tone={live ? "green" : "red"}>{live ? "Live" : "Offline"}</Pill>
          <button
            onClick={addNew}
            className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-500"
          >
            + Add Customer
          </button>
        </div>
      </div>

      <div className="bg-[#0c0f14] rounded-md border border-[#23262d] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#0e1218] text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">DL #</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-4 text-gray-400" colSpan={4}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-4 text-gray-400" colSpan={4}>No customers yet.</td></tr>
            ) : (
              rows.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[#23262d] hover:bg-[#121723] cursor-pointer"
                  onClick={() => onOpen(c)}
                >
                  <td className="px-3 py-2 text-gray-100">{c.name || "—"}</td>
                  <td className="px-3 py-2 text-gray-200">{c.phone || "—"}</td>
                  <td className="px-3 py-2 text-gray-200">{c.email || "—"}</td>
                  <td className="px-3 py-2 text-gray-200">{c.dlNumber || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        title="Customer Profile"
        onClose={() => { setEditing(null); setDraft(null); }}
        onSave={onSave}
        saveLabel="Save Customer"
      >
        {draft && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Full Name</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.name ?? ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.phone ?? ""}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Email</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.email ?? ""}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Driver License #</label>
              <input className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
                value={draft.dlNumber ?? ""}
                onChange={(e) => setDraft({ ...draft, dlNumber: e.target.value })}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ======= Dashboard (summary tiles) =======
function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const h = await fetchJSON("/health");
        if (mounted) setLive(!!h.ok);
      } catch { setLive(false); }
      try {
        const s = await fetchJSON("/stats/summary");
        if (mounted) setStats(s);
      } catch { if (mounted) setStats(null); }
    })();
    return () => (mounted = false);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-100">Dashboard</h2>
        <Pill tone={live ? "green" : "red"}>{live ? "Live" : "Offline"}</Pill>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={stats?.bookingsTotal} />
        <StatCard label="Active Rentals" value={stats?.activeRentals} />
        <StatCard label="Vehicles" value={stats?.vehicles} />
        <StatCard label="Revenue" value={stats ? `$${(stats.revenue || 0).toLocaleString()}` : "—"} />
      </div>
      <p className="text-xs text-gray-500">
        Data source: <code>VITE_API_URL</code> = {API_BASE || "(not set)"}.
      </p>
    </div>
  );
}

// ======= Main App with Tabs =======
const TABS = ["Dashboard", "Calendar", "Bookings", "Customers", "Vehicles", "Team Chat", "Finances"];

export default function App() {
  const [tab, setTab] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-[#0a0d12] text-gray-200">
      <header className="bg-[#0b7a32] text-gray-100">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">K.V. Rentals • Team Dashboard</div>
          <div className="text-xs opacity-80">Live</div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-3">
        {/* tabs */}
        <div className="flex gap-2 mb-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs rounded-md border ${
                tab === t
                  ? "bg-[#121826] border-[#1f2533] text-gray-100"
                  : "bg-[#0e131b] border-[#1c212b] text-gray-300 hover:bg-[#121826]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* content */}
        {tab === "Dashboard" && <DashboardHome />}
        {tab === "Vehicles" && <VehiclesTab />}
        {tab === "Customers" && <CustomersTab />}
        {tab === "Calendar" && (
          <div className="bg-[#0c0f14] rounded-md border border-[#23262d] p-6 text-sm text-gray-400">
            Calendar view coming next.
          </div>
        )}
        {tab === "Bookings" && (
          <div className="bg-[#0c0f14] rounded-md border border-[#23262d] p-6 text-sm text-gray-400">
            Bookings table & contract flow coming soon.
          </div>
        )}
        {tab === "Team Chat" && (
          <div className="bg-[#0c0f14] rounded-md border border-[#23262d] p-6 text-sm text-gray-400">
            Team chat placeholder.
          </div>
        )}
        {tab === "Finances" && (
          <div className="bg-[#0c0f14] rounded-md border border-[#23262d] p-6 text-sm text-gray-400">
            Finances charts coming soon.
          </div>
        )}
      </div>
    </div>
  );
}

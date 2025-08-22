// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

/** ====== CONFIG ====== */
const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";

/** ====== UI HELPERS ====== */
const Badge = ({ color = "slate", children }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-${color}-800/30 border border-${color}-700/30 text-${color}-200`}
    style={{
      // in case Tailwind doesn't have these exact tokens at build time
      backgroundColor: "rgba(148,163,184,0.15)",
      borderColor: "rgba(148,163,184,0.25)",
      color: "#cbd5e1",
    }}
  >
    {children}
  </span>
);

const Btn = ({ variant = "solid", children, ...props }) => {
  const base =
    "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm border transition";
  const styles =
    variant === "solid"
      ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600"
      : "bg-transparent hover:bg-white/5 text-slate-100 border-slate-600";
  return (
    <button className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  );
};

const Card = ({ title, children, right }) => (
  <div className="rounded-lg border border-[#2a2e36] bg-[#0a0e13]">
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2e36]">
      <h3 className="text-sm font-semibold text-gray-200">{title}</h3>
      {right}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

/** ====== TABS ====== */
const TABS = [
  "Dashboard",
  "Calendar",
  "Bookings",
  "Customers",
  "Vehicles",
  "Team Chat",
  "Finances",
];

/** ====== MOCK DATA (used if API is missing) ====== */
const MOCK_VEHICLES = [
  {
    id: "veh_1",
    year: "2022",
    make: "Toyota",
    model: "RAV4",
    vin: "JTMB1RFV0M1234567",
    color: "Gray",
    plate: "ABC-123",
    currentOdometer: 41250,
    status: "available",
  },
  {
    id: "veh_2",
    year: "2020",
    make: "BMW",
    model: "3 Series",
    vin: "WBA5A7C57LF123456",
    color: "Blue",
    plate: "BMW-333",
    currentOdometer: 65320,
    status: "out",
  },
];

const MOCK_CUSTOMERS = [
  {
    id: "cus_1",
    name: "Lisa Smith",
    email: "lisa@example.com",
    phone: "+1 401-555-0101",
    license: "S1234567",
  },
  {
    id: "cus_2",
    name: "Thomas Brown",
    email: "thomas@example.com",
    phone: "+1 401-555-0142",
    license: "B7654321",
  },
];

/** ====== FETCH HELPERS ====== */
async function safeJson(url, fallback) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("bad status");
    return await res.json();
  } catch {
    return fallback;
  }
}

/** ====== VEHICLE MODAL ====== */
function VehicleModal({ open, draft, setDraft, onClose, onSave }) {
  if (!open) return null;

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-[#2a2e36] bg-[#0b1117] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e36]">
          <h3 className="text-gray-100 font-semibold">Vehicle Profile</h3>
          <button
            className="text-gray-300 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Year">
            <Input
              value={draft.year ?? ""}
              onChange={(v) => set("year", digitsOnly(v))}
            />
          </Field>
          <Field label="Make">
            <Input value={draft.make ?? ""} onChange={(v) => set("make", v)} />
          </Field>
          <Field label="Model">
            <Input
              value={draft.model ?? ""}
              onChange={(v) => set("model", v)}
            />
          </Field>
          <Field label="VIN">
            <Input value={draft.vin ?? ""} onChange={(v) => set("vin", v)} />
          </Field>
          <Field label="Color">
            <Input
              value={draft.color ?? ""}
              onChange={(v) => set("color", v)}
            />
          </Field>
          <Field label="License Plate">
            <Input
              value={draft.plate ?? ""}
              onChange={(v) => set("plate", v.toUpperCase())}
            />
          </Field>
          <Field label="Odometer">
            {/* allow empty while typing; save will coerce to number */}
            <Input
              numeric
              value={draft.currentOdometer ?? ""}
              onChange={(v) => set("currentOdometer", digitsOnly(v))}
              placeholder="e.g. 41250"
            />
          </Field>
          <Field label="Status">
            <select
              className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
              value={draft.status ?? "available"}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="available">available</option>
              <option value="out">out</option>
              <option value="service">service</option>
              <option value="hold">hold</option>
            </select>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#2a2e36]">
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn
            onClick={() => {
              const cleaned = {
                ...draft,
                currentOdometer:
                  draft.currentOdometer === "" || draft.currentOdometer == null
                    ? 0
                    : Number(draft.currentOdometer),
              };
              onSave(cleaned);
            }}
          >
            Save Vehicle
          </Btn>
        </div>
      </div>
    </div>
  );
}

/** ====== CUSTOMER MODAL ====== */
function CustomerModal({ open, draft, setDraft, onClose, onSave }) {
  if (!open) return null;
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-lg border border-[#2a2e36] bg-[#0b1117] shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e36]">
          <h3 className="text-gray-100 font-semibold">Customer Profile</h3>
          <button
            className="text-gray-300 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 gap-4">
          <Field label="Full Name">
            <Input value={draft.name ?? ""} onChange={(v) => set("name", v)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={draft.email ?? ""}
              onChange={(v) => set("email", v)}
            />
          </Field>
          <Field label="Phone">
            <Input
              value={draft.phone ?? ""}
              onChange={(v) => set("phone", v)}
              placeholder="+1 401-555-0123"
            />
          </Field>
          <Field label="Driver License #">
            <Input
              value={draft.license ?? ""}
              onChange={(v) => set("license", v)}
            />
          </Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#2a2e36]">
          <Btn variant="ghost" onClick={onClose}>
            Cancel
          </Btn>
          <Btn onClick={() => onSave(draft)}>Save Customer</Btn>
        </div>
      </div>
    </div>
  );
}

/** ====== SMALL INPUT/FORM PIECES ====== */
function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-400">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  numeric = false,
}) {
  return (
    <input
      className="w-full bg-[#0a0e13] border border-[#2a2e36] rounded-md px-2 py-2 text-sm text-gray-100"
      type={numeric ? "text" : type}
      inputMode={numeric ? "numeric" : undefined}
      pattern={numeric ? "\\d*" : undefined}
      value={value}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(numeric ? e.target.value.replace(/\D/g, "") : e.target.value)
      }
    />
  );
}

const digitsOnly = (s) => (s ?? "").toString().replace(/\D/g, "");

/** ====== TABS PAGES ====== */
function DashboardTab({ live, stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <Card
        title="Status"
        right={<Badge color={live ? "emerald" : "rose"}>{live ? "Live" : "Offline"}</Badge>}
      >
        <div className="text-sm text-gray-300">
          Data source: <code className="text-xs">{API_URL || "(local mock)"}</code>
        </div>
      </Card>
      <Card title="Total Bookings">
        <div className="text-2xl text-gray-100 tabular-nums">
          {stats.bookingsTotal ?? "—"}
        </div>
      </Card>
      <Card title="Active Rentals">
        <div className="text-2xl text-gray-100 tabular-nums">
          {stats.activeRentals ?? "—"}
        </div>
      </Card>
      <Card title="Vehicles">
        <div className="text-2xl text-gray-100 tabular-nums">
          {stats.vehicles ?? "—"}
        </div>
      </Card>
      <Card title="Revenue" right={<Badge>$</Badge>}>
        <div className="text-2xl text-gray-100 tabular-nums">
          {stats.revenue != null
            ? `$${Number(stats.revenue).toLocaleString()}`
            : "—"}
        </div>
      </Card>
    </div>
  );
}

function VehiclesTab() {
  const [rows, setRows] = useState(MOCK_VEHICLES);
  const [editing, setEditing] = useState(null);
  const draft = rows.find((r) => r.id === editing) || null;
  const [draftState, setDraftState] = useState(null);

  useEffect(() => {
    let on = true;
    // try fetch from API if available
    (async () => {
      if (!API_URL) return;
      const data = await safeJson(`${API_URL}/vehicles`, null);
      if (on && Array.isArray(data) && data.length) setRows(data);
    })();
    return () => {
      on = false;
    };
  }, []);

  const openNew = () => {
    const v = {
      id: `veh_${Date.now()}`,
      year: "",
      make: "",
      model: "",
      vin: "",
      color: "",
      plate: "",
      currentOdometer: "",
      status: "available",
    };
    setRows((prev) => [v, ...prev]);
    setEditing(v.id);
    setDraftState(v);
  };

  const onRowClick = (id) => {
    const found = rows.find((r) => r.id === id);
    if (!found) return;
    setEditing(id);
    setDraftState({ ...found });
  };

  const onSave = (cleaned) => {
    setRows((prev) => prev.map((v) => (v.id === cleaned.id ? cleaned : v)));
    setEditing(null);
    setDraftState(null);
  };

  const onClose = () => {
    // if it was a new empty row and user cancels, remove it
    if (
      draftState &&
      !draftState.make &&
      !draftState.model &&
      (draftState.currentOdometer === "" || draftState.currentOdometer == null)
    ) {
      setRows((prev) => prev.filter((v) => v.id !== draftState.id));
    }
    setEditing(null);
    setDraftState(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-200 font-semibold">Vehicles</h3>
        <Btn onClick={openNew}>+ Add Vehicle</Btn>
      </div>
      <div className="overflow-auto rounded-lg border border-[#2a2e36]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#0a0e13] border-b border-[#2a2e36] text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left">Vehicle</th>
              <th className="px-3 py-2 text-left">Plate</th>
              <th className="px-3 py-2 text-left">Odometer</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr
                key={v.id}
                className="border-b border-[#2a2e36] hover:bg-white/5 cursor-pointer"
                onClick={() => onRowClick(v.id)}
              >
                <td className="px-3 py-2 text-gray-200">
                  <div className="font-medium">
                    {`${v.year ? v.year + " " : ""}${v.make || ""} ${v.model || ""}`.trim() ||
                      "—"}
                  </div>
                  <div className="text-xs text-gray-400">{v.vin || ""}</div>
                </td>
                <td className="px-3 py-2 text-gray-200">{v.plate || "—"}</td>
                <td className="px-3 py-2 text-gray-200 tabular-nums">
                  {(Number(v.currentOdometer) || 0).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  <Badge color={v.status === "available" ? "emerald" : v.status === "out" ? "amber" : "slate"}>
                    {v.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <VehicleModal
        open={!!editing}
        draft={draftState || draft || {}}
        setDraft={setDraftState}
        onClose={onClose}
        onSave={onSave}
      />
    </>
  );
}

function CustomersTab() {
  const [rows, setRows] = useState(MOCK_CUSTOMERS);
  const [editing, setEditing] = useState(null);
  const draft = rows.find((r) => r.id === editing) || null;
  const [draftState, setDraftState] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      if (!API_URL) return;
      const data = await safeJson(`${API_URL}/customers`, null);
      if (on && Array.isArray(data) && data.length) setRows(data);
    })();
    return () => {
      on = false;
    };
  }, []);

  const openNew = () => {
    const c = {
      id: `cus_${Date.now()}`,
      name: "",
      email: "",
      phone: "",
      license: "",
    };
    setRows((prev) => [c, ...prev]);
    setEditing(c.id);
    setDraftState(c);
  };

  const onRowClick = (id) => {
    const found = rows.find((r) => r.id === id);
    if (!found) return;
    setEditing(id);
    setDraftState({ ...found });
  };

  const onSave = (cleaned) => {
    setRows((prev) => prev.map((v) => (v.id === cleaned.id ? cleaned : v)));
    setEditing(null);
    setDraftState(null);
  };

  const onClose = () => {
    if (draftState && !draftState.name && !draftState.email) {
      setRows((prev) => prev.filter((v) => v.id !== draftState.id));
    }
    setEditing(null);
    setDraftState(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-gray-200 font-semibold">Customers</h3>
        <Btn onClick={openNew}>+ Add Customer</Btn>
      </div>

      <div className="overflow-auto rounded-lg border border-[#2a2e36]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#0a0e13] border-b border-[#2a2e36] text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Phone</th>
              <th className="px-3 py-2 text-left">License</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                className="border-b border-[#2a2e36] hover:bg-white/5 cursor-pointer"
                onClick={() => onRowClick(c.id)}
              >
                <td className="px-3 py-2 text-gray-200">{c.name || "—"}</td>
                <td className="px-3 py-2 text-gray-200">{c.email || "—"}</td>
                <td className="px-3 py-2 text-gray-200">{c.phone || "—"}</td>
                <td className="px-3 py-2 text-gray-200">{c.license || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CustomerModal
        open={!!editing}
        draft={draftState || draft || {}}
        setDraft={setDraftState}
        onClose={onClose}
        onSave={onSave}
      />
    </>
  );
}

/** ====== MAIN APP ====== */
export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [live, setLive] = useState(false);
  const [stats, setStats] = useState({
    bookingsTotal: null,
    activeRentals: null,
    vehicles: null,
    revenue: null,
  });

  useEffect(() => {
    let on = true;
    (async () => {
      if (!API_URL) return;
      const h = await safeJson(`${API_URL}/health`, null);
      if (on) setLive(!!h?.ok);
      const s = await safeJson(`${API_URL}/stats/summary`, null);
      if (on && s) setStats((p) => ({ ...p, ...s }));
    })();
    return () => {
      on = false;
    };
  }, []);

  // fallback numbers if API not available
  const computedStats = useMemo(
    () => ({
      bookingsTotal: stats.bookingsTotal ?? 128,
      activeRentals: stats.activeRentals ?? 14,
      vehicles: stats.vehicles ?? 23,
      revenue: stats.revenue ?? 12480,
    }),
    [stats]
  );

  return (
    <div className="min-h-screen bg-[#070b10] text-gray-100">
      <header className="sticky top-0 z-40 border-b border-[#1c212b] bg-[#0b1117]/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">K.V. Rentals • Team Dashboard</div>
          <div className="flex items-center gap-2">
            <Badge color={live ? "emerald" : "rose"}>
              {live ? "Live" : "Offline"}
            </Badge>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4 pb-3 flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-3 py-1.5 rounded-md text-sm border ${
                active === t
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-transparent border-[#2a2e36] hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {active === "Dashboard" && (
          <DashboardTab live={live} stats={computedStats} />
        )}

        {active === "Vehicles" && <VehiclesTab />}

        {active === "Customers" && <CustomersTab />}

        {active !== "Dashboard" &&
          active !== "Vehicles" &&
          active !== "Customers" && (
            <Card title={active}>
              <div className="text-gray-400 text-sm">
                {active} page coming next.
              </div>
            </Card>
          )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-xs text-gray-500">
        Data source: <code>{API_URL || "(local mock)"}</code>
      </footer>
    </div>
  );
}

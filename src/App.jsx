import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

// --- Config ---
const API = import.meta.env.VITE_API_URL || "";

// --- Small UI helpers ---
const Pill = ({ children, color = "gray" }) => (
  <span
    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
      color === "green"
        ? "bg-green-900/30 text-green-300 ring-1 ring-green-700/50"
        : color === "amber"
        ? "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/50"
        : color === "red"
        ? "bg-rose-900/30 text-rose-300 ring-1 ring-rose-700/50"
        : "bg-slate-800/60 text-slate-300 ring-1 ring-slate-700/60"
    }`}
  >
    {children}
  </span>
);

const Card = ({ title, children, className = "" }) => (
  <div className={`rounded-lg border border-[#2a2e36] bg-[#0a0e13] ${className}`}>
    {title ? (
      <div className="border-b border-[#2a2e36] p-3 text-sm font-semibold text-gray-200">
        {title}
      </div>
    ) : null}
    <div className="p-3">{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <div className="mb-1 text-xs font-medium text-gray-400">{label}</div>
    {children}
  </label>
);

const Input = (props) => (
  <input
    {...props}
    className={
      "w-full rounded-md border border-[#2a2e36] bg-[#0a0e13] px-2 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 " +
      (props.className || "")
    }
  />
);

const Select = (props) => (
  <select
    {...props}
    className={
      "w-full rounded-md border border-[#2a2e36] bg-[#0a0e13] px-2 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 " +
      (props.className || "")
    }
  />
);

const Button = ({ children, variant = "ghost", ...rest }) => {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium focus:outline-none";
  const styles =
    variant === "primary"
      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
      : variant === "danger"
      ? "bg-rose-600 hover:bg-rose-500 text-white"
      : "bg-[#0f141c] hover:bg-[#151b24] text-gray-200 border border-[#232a33]";
  return (
    <button className={`${base} ${styles}`} {...rest}>
      {children}
    </button>
  );
};

const Row = ({ children }) => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">{children}</div>
);

const Stat = ({ label, value }) => (
  <Card>
    <div className="text-xs text-gray-400">{label}</div>
    <div className="mt-1 text-2xl font-semibold text-gray-100 tabular-nums">
      {value ?? "—"}
    </div>
  </Card>
);

// --- Main App ---
const TABS = [
  "Dashboard",
  "Calendar",
  "Bookings",
  "Customers",
  "Vehicles",
  "Team Chat",
  "Finances",
];

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [online, setOnline] = useState(false);

  // dashboard stats
  const [stats, setStats] = useState(null);

  // vehicles
  const [vehicles, setVehicles] = useState([]);
  const [editingVeh, setEditingVeh] = useState(null); // id or "new"
  const draftVeh = useMemo(
    () =>
      editingVeh === "new"
        ? {
            id: `veh_${Date.now()}`,
            year: "",
            make: "",
            model: "",
            vin: "",
            color: "",
            plate: "",
            currentOdometer: "",
            status: "available",
          }
        : vehicles.find((v) => v.id === editingVeh) || null,
    [editingVeh, vehicles]
  );
  const [vehDraft, setVehDraft] = useState(null);

  // customers
  const [customers, setCustomers] = useState([]);

  // Load + heartbeat
  useEffect(() => {
    let mounted = true;

    const ping = async () => {
      try {
        const r = await fetch(`${API}/health`);
        if (!mounted) return;
        setOnline(r.ok);
      } catch {
        if (!mounted) return;
        setOnline(false);
      }
    };

    const load = async () => {
      try {
        const [s, v, c] = await Promise.all([
          fetch(`${API}/stats/summary`).then((r) => r.json()),
          fetch(`${API}/vehicles`).then((r) => r.json()),
          fetch(`${API}/customers`).then((r) => r.json()).catch(() => []),
        ]);
        if (!mounted) return;
        setStats(s);
        // normalize vehicles to include new fields if missing
        const norm = (v || []).map((x) => ({
          id: x.id,
          year: x.year ?? "",
          make: x.make ?? (x.name?.split(" ")[0] || ""),
          model: x.model ?? (x.name?.split(" ").slice(1).join(" ") || ""),
          vin: x.vin ?? "",
          color: x.color ?? "",
          plate: x.plate ?? "",
          currentOdometer:
            x.currentOdometer === 0 ? "0" : String(x.currentOdometer ?? ""),
          status: x.status ?? "available",
        }));
        setVehicles(norm);
        setCustomers(c || []);
      } catch {
        // ignore
      }
    };

    ping();
    load();
    const t = setInterval(ping, 15000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  // keep vehDraft synced with selected
  useEffect(() => {
    if (draftVeh) {
      setVehDraft({ ...draftVeh });
    } else {
      setVehDraft(null);
    }
  }, [draftVeh]);

  return (
    <div className="min-h-screen bg-[#070b10] text-gray-100">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 border-b border-[#1f252d] bg-[#0b1016]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="text-sm font-semibold text-emerald-300">
            K.V. Rentals • Team Dashboard
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Status</span>
            <Pill color={online ? "green" : "red"}>
              {online ? "Live" : "Offline"}
            </Pill>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-2 pb-2">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  tab === t
                    ? "bg-emerald-700 text-white"
                    : "bg-[#0f141c] text-gray-200 hover:bg-[#151b24] border border-[#232a33]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        {tab === "Dashboard" && <Dashboard stats={stats} />}
        {tab === "Vehicles" && (
          <VehiclesTab
            rows={vehicles}
            setRows={setVehicles}
            editing={editingVeh}
            setEditing={setEditingVeh}
            draft={vehDraft}
            setDraft={setVehDraft}
          />
        )}
        {tab === "Customers" && <CustomersTab rows={customers} setRows={setCustomers} />}
        {["Calendar", "Bookings", "Team Chat", "Finances"].includes(tab) && (
          <Card title={tab}>
            <div className="text-gray-400 text-sm">Coming soon.</div>
          </Card>
        )}
        <div className="mt-6 text-xs text-gray-500">
          Data source: <code>VITE_API_URL</code> → {API || "— (not set)"}
        </div>
      </div>
    </div>
  );
}

// --- Sections ---
function Dashboard({ stats }) {
  return (
    <div className="space-y-4">
      <Row>
        <Stat label="Total Bookings" value={stats?.bookingsTotal ?? "—"} />
        <Stat label="Active Rentals" value={stats?.activeRentals ?? "—"} />
        <Stat label="Vehicles" value={stats?.vehicles ?? "—"} />
        <Stat
          label="Revenue"
          value={
            typeof stats?.revenue === "number"
              ? `$${stats.revenue.toLocaleString()}`
              : "—"
          }
        />
      </Row>
    </div>
  );
}

function VehiclesTab({ rows, setRows, editing, setEditing, draft, setDraft }) {
  const onAdd = () => setEditing("new");

  const onSave = () => {
    const cleaned = {
      ...draft,
      currentOdometer:
        draft.currentOdometer === "" ? 0 : Number(draft.currentOdometer),
    };

    if (editing === "new") {
      setRows((prev) => [cleaned, ...prev]);
    } else {
      setRows((prev) => prev.map((v) => (v.id === cleaned.id ? cleaned : v)));
    }
    setEditing(null);
    setDraft(null);
  };

  const onDelete = (id) => {
    setRows((prev) => prev.filter((v) => v.id !== id));
    if (editing && draft?.id === id) {
      setEditing(null);
      setDraft(null);
    }
  };

  return (
    <>
      <Card
        title="Vehicles"
        className="overflow-hidden"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Vehicles & Power Sports can be split with a dropdown later.
          </div>
          <Button onClick={onAdd} variant="primary">
            + Add Vehicle
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Plate</th>
                <th className="px-3 py-2">Odometer</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr
                  key={v.id}
                  className="border-t border-[#1f252d] hover:bg-[#0e141d]/60"
                >
                  <td className="px-3 py-2 text-gray-200">
                    {`${v.year || ""} ${v.make || ""} ${v.model || ""}`.trim() ||
                      "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-300">{v.plate || "—"}</td>
                  <td className="px-3 py-2 text-gray-200 tabular-nums">
                    {(Number(v.currentOdometer) || 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <Pill
                      color={
                        v.status === "available"
                          ? "green"
                          : v.status === "out"
                          ? "amber"
                          : "red"
                      }
                    >
                      {v.status}
                    </Pill>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button onClick={() => setEditing(v.id)}>View / Edit</Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-gray-500">
                    No vehicles yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {draft && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-[#2a2e36] bg-[#0a0e13] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-gray-100">
                {editing === "new" ? "Add Vehicle" : "Vehicle Profile"}
              </div>
              <div className="text-gray-400 text-xs">ID: {draft.id}</div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Year">
                <Input
                  placeholder="2021"
                  value={draft.year}
                  onChange={(e) => setDraft({ ...draft, year: e.target.value })}
                />
              </Field>
              <Field label="Make">
                <Input
                  placeholder="Toyota"
                  value={draft.make}
                  onChange={(e) => setDraft({ ...draft, make: e.target.value })}
                />
              </Field>
              <Field label="Model">
                <Input
                  placeholder="RAV4"
                  value={draft.model}
                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                />
              </Field>
              <Field label="VIN">
                <Input
                  placeholder="1HGCM82633A0..."
                  value={draft.vin}
                  onChange={(e) => setDraft({ ...draft, vin: e.target.value })}
                />
              </Field>
              <Field label="Color">
                <Input
                  placeholder="Black"
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                />
              </Field>
              <Field label="License Plate">
                <Input
                  placeholder="ABC-123"
                  value={draft.plate}
                  onChange={(e) => setDraft({ ...draft, plate: e.target.value })}
                />
              </Field>
              <Field label="Odometer">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="41250"
                  value={draft.currentOdometer ?? ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ""); // digits only
                    setDraft({ ...draft, currentOdometer: val });
                  }}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                >
                  <option value="available">available</option>
                  <option value="out">out</option>
                  <option value="maintenance">maintenance</option>
                </Select>
              </Field>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Service history & photos coming next.
              </div>
              <div className="flex items-center gap-2">
                {editing !== "new" && (
                  <Button variant="danger" onClick={() => onDelete(draft.id)}>
                    Delete
                  </Button>
                )}
                <Button onClick={() => { setEditing(null); setDraft(null); }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={onSave}>
                  Save Vehicle
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CustomersTab({ rows, setRows }) {
  const [editing, setEditing] = useState(null); // id or "new"
  const draft = useMemo(
    () =>
      editing === "new"
        ? {
            id: `cust_${Date.now()}`,
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            license: "",
          }
        : rows.find((c) => c.id === editing) || null,
    [editing, rows]
  );
  const [custDraft, setCustDraft] = useState(null);

  useEffect(() => {
    if (draft) setCustDraft({ ...draft });
    else setCustDraft(null);
  }, [draft]);

  const onAdd = () => setEditing("new");
  const onSave = () => {
    if (editing === "new") setRows((p) => [custDraft, ...p]);
    else setRows((p) => p.map((c) => (c.id === custDraft.id ? custDraft : c)));
    setEditing(null);
  };
  const onDelete = (id) => {
    setRows((p) => p.filter((c) => c.id !== id));
    if (editing && draft?.id === id) setEditing(null);
  };

  return (
    <>
      <Card title="Customers">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Add, edit, and view customer profiles.
          </div>
          <Button variant="primary" onClick={onAdd}>
            + Add Customer
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-[#1f252d] hover:bg-[#0e141d]/60">
                  <td className="px-3 py-2 text-gray-200">
                    {(c.firstName || "") + " " + (c.lastName || "")}
                  </td>
                  <td className="px-3 py-2 text-gray-300">{c.email || "—"}</td>
                  <td className="px-3 py-2 text-gray-300">{c.phone || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button onClick={() => setEditing(c.id)}>View / Edit</Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-3 py-6 text-center text-gray-500">
                    No customers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {custDraft && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-[#2a2e36] bg-[#0a0e13] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-base font-semibold text-gray-100">
                {editing === "new" ? "Add Customer" : "Customer Profile"}
              </div>
              <div className="text-xs text-gray-500">ID: {custDraft.id}</div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="First Name">
                <Input
                  value={custDraft.firstName}
                  onChange={(e) =>
                    setCustDraft({ ...custDraft, firstName: e.target.value })
                  }
                />
              </Field>
              <Field label="Last Name">
                <Input
                  value={custDraft.lastName}
                  onChange={(e) =>
                    setCustDraft({ ...custDraft, lastName: e.target.value })
                  }
                />
              </Field>
              <Field label="Email">
                <Input
                  value={custDraft.email}
                  onChange={(e) =>
                    setCustDraft({ ...custDraft, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Phone">
                <Input
                  value={custDraft.phone}
                  onChange={(e) =>
                    setCustDraft({ ...custDraft, phone: e.target.value })
                  }
                />
              </Field>
              <Field label="Driver License #">
                <Input
                  value={custDraft.license}
                  onChange={(e) =>
                    setCustDraft({ ...custDraft, license: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                ID verification & e-signature steps coming later.
              </div>
              <div className="flex items-center gap-2">
                {editing !== "new" && (
                  <Button variant="danger" onClick={() => onDelete(custDraft.id)}>
                    Delete
                  </Button>
                )}
                <Button onClick={() => setEditing(null)}>Cancel</Button>
                <Button variant="primary" onClick={onSave}>
                  Save Customer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

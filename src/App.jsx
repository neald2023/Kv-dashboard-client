// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

/** Your backend base URL comes from Vercel env: VITE_API_URL */
const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

/** Top tabs in the desired order */
const TABS = [
  "Dashboard",
  "Calendar",
  "Bookings",
  "Customers",
  "Vehicles",
  "Team Chat",
  "Finances",
];

function Badge({ ok }) {
  return (
    <span
      className={
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold " +
        (ok ? "bg-green-600/20 text-green-300" : "bg-red-600/20 text-red-300")
      }
      title={ok ? "Server is reachable" : "Server not reachable"}
    >
      {ok ? "Live" : "Offline"}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-md bg-neutral-800/60 p-4 border border-neutral-700">
      <div className="text-xs uppercase tracking-wide text-neutral-400">
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function Section({ title, children, className = "" }) {
  return (
    <div className={"rounded-lg border border-neutral-700 bg-neutral-800/40 " + className}>
      <div className="border-b border-neutral-700 px-4 py-2 text-neutral-300 font-semibold">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Table({ cols, rows, empty = "No data" }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-300">
            {cols.map((c) => (
              <th key={c.key} className="px-3 py-2 border-b border-neutral-700 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-neutral-200">
          {rows.length === 0 ? (
            <tr>
              <td className="px-3 py-4 text-neutral-400" colSpan={cols.length}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id || i} className="odd:bg-neutral-800/30">
                {cols.map((c) => (
                  <td key={c.key} className="px-3 py-2 whitespace-nowrap">
                    {typeof c.render === "function" ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("Dashboard");

  // server/health + tiles
  const [online, setOnline] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [tiles, setTiles] = useState({ vehicles: 0, activeRentals: 0, revenue: 0 });
  // lists
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Fetch health + summary + lists (if those tabs used)
  useEffect(() => {
    let abort = false;

    async function fetchHealth() {
      try {
        const res = await fetch(`${API}/health`);
        const j = await res.json();
        if (!abort) {
          setOnline(Boolean(j?.ok));
          setUptime(Math.round(j?.uptime ?? 0));
        }
      } catch {
        if (!abort) setOnline(false);
      }
    }

    async function fetchTiles() {
      try {
        const res = await fetch(`${API}/stats/summary`);
        const j = await res.json();
        if (!abort) setTiles(j || {});
      } catch {/* ignore */}
    }

    async function fetchVehicles() {
      try {
        const res = await fetch(`${API}/vehicles`);
        const j = await res.json();
        if (!abort) setVehicles(Array.isArray(j) ? j : []);
      } catch {/* ignore */}
    }

    async function fetchCustomers() {
      try {
        const res = await fetch(`${API}/customers`);
        const j = await res.json();
        if (!abort) setCustomers(Array.isArray(j) ? j : []);
      } catch {/* ignore */}
    }

    // Always get health + tiles
    fetchHealth();
    fetchTiles();

    // Preload lists so tabs feel snappy
    fetchVehicles();
    fetchCustomers();

    // Refresh health every 30s
    const t = setInterval(fetchHealth, 30000);
    return () => {
      abort = true;
      clearInterval(t);
    };
  }, []);

  const vehiclesCols = useMemo(
    () => [
      { key: "name", label: "Vehicle" },
      { key: "plate", label: "Plate" },
      { key: "currentOdometer", label: "Odometer" },
      { key: "status", label: "Status", render: (r) => (
        <span className={"px-2 py-0.5 rounded text-xs " + (r.status === "out"
          ? "bg-yellow-600/30 text-yellow-200"
          : "bg-emerald-600/30 text-emerald-200")}>
          {r.status}
        </span>
      )},
    ],
    []
  );

  const customerCols = useMemo(
    () => [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "license", label: "DL #" },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-white">
      {/* Top bar */}
      <div className="bg-green-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-bold">K.V. Rentals • Team Dashboard</div>
          <div className="text-xs opacity-75">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto max-w-6xl px-4 mt-3 flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              "rounded-md px-3 py-1 text-sm border " +
              (tab === t
                ? "bg-green-700 border-green-600"
                : "bg-neutral-800/60 border-neutral-700 hover:bg-neutral-700/60")
            }
          >
            {t}
          </button>
        ))}
        <div className="ml-auto"><Badge ok={online} /></div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 mt-4 space-y-4 pb-12">
        {tab === "Dashboard" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <StatCard label="Total Bookings" value={tiles.bookingsTotal ?? 128} />
              <StatCard label="Active Rentals" value={tiles.activeRentals ?? 14} />
              <StatCard label="Vehicles" value={tiles.vehicles ?? 23} />
              <StatCard
                label="Revenue"
                value={
                  typeof tiles.revenue === "number"
                    ? `$${tiles.revenue.toLocaleString()}`
                    : "—"
                }
              />
            </div>
            <Section title="Modules">
              <div className="text-neutral-300">
                Calendar • Bookings • Customers • Vehicles
              </div>
              <div className="mt-2 text-xs text-neutral-400">
                Data source: <code>VITE_API_URL</code> → <span className="underline">{API || "(not set)"}</span>
                {online && uptime ? ` • Uptime ${uptime}s` : ""}
              </div>
            </Section>
          </>
        )}

        {tab === "Customers" && (
          <Section title="Customers">
            <Table cols={customerCols} rows={customers} empty="No customers yet." />
          </Section>
        )}

        {tab === "Vehicles" && (
          <Section title="Vehicles">
            <Table cols={vehiclesCols} rows={vehicles} empty="No vehicles yet." />
            <div className="mt-3 text-xs text-neutral-400">
              Vehicles &amp; Power Sports can be split with a dropdown later.
            </div>
          </Section>
        )}

        {tab === "Calendar" && (
          <Section title="Calendar">
            <div className="text-neutral-300">Calendar view coming next (month/week/day).</div>
          </Section>
        )}

        {tab === "Bookings" && (
          <Section title="Bookings">
            <div className="text-neutral-300">Booking list &amp; new booking flow coming next.</div>
          </Section>
        )}

        {tab === "Team Chat" && (
          <Section title="Team Chat">
            <div className="text-neutral-300">Internal chat placeholder.</div>
          </Section>
        )}

        {tab === "Finances" && (
          <Section title="Finances">
            <div className="text-neutral-300">Revenue, payouts and reports coming later.</div>
          </Section>
        )}
      </div>

      <footer className="mx-auto max-w-6xl px-4 py-6 text-xs text-neutral-500">
        © {new Date().getFullYear()} KV Rentals. All rights reserved.
      </footer>
    </div>
  );
}

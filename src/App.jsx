// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

const API = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "";

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

function Table({ cols, rows, empty = "No data", onRowClick }) {
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
              <tr
                key={r.id || i}
                className={"odd:bg-neutral-800/30 hover:bg-neutral-700/40 cursor-pointer"}
                onClick={() => onRowClick && onRowClick(r)}
              >
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

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(640px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-neutral-700 bg-neutral-900 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-700 px-4 py-2">
          <div className="font-semibold text-neutral-200">{title}</div>
          <button className="text-neutral-400 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("Dashboard");

  const [online, setOnline] = useState(false);
  const [uptime, setUptime] = useState(0);
  const [tiles, setTiles] = useState({ vehicles: 0, activeRentals: 0, revenue: 0 });

  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Selected row for profile modal
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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
      } catch {}
    }

    async function fetchVehicles() {
      try {
        const res = await fetch(`${API}/vehicles`);
        const j = await res.json();
        if (!abort) setVehicles(Array.isArray(j) ? j : []);
      } catch {}
    }

    async function fetchCustomers() {
      try {
        const res = await fetch(`${API}/customers`);
        const j = await res.json();
        if (!abort) setCustomers(Array.isArray(j) ? j : []);
      } catch {}
    }

    fetchHealth();
    fetchTiles();
    fetchVehicles();
    fetchCustomers();

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
      {
        key: "status",
        label: "Status",
        render: (r) => (
          <span
            className={
              "px-2 py-0.5 rounded text-xs " +
              (r.status === "out"
                ? "bg-yellow-600/30 text-yellow-200"
                : "bg-emerald-600/30 text-emerald-200")
            }
          >
            {r.status}
          </span>
        ),
      },
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
      <div className="bg-green-700 text-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="font-bold">K.V. Rentals • Team Dashboard</div>
          <div className="text-xs opacity-75">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

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
        <div className="ml-auto">
          <Badge ok={online} />
        </div>
      </div>

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
                Data source: <code>VITE_API_URL</code> →{" "}
                <span className="underline">{API || "(not set)"}</span>
                {online && uptime ? ` • Uptime ${uptime}s` : ""}
              </div>
            </Section>
          </>
        )}

        {tab === "Customers" && (
          <Section title="Customers">
            <div className="mb-3 flex gap-2">
              <button
                className="cursor-not-allowed rounded-md bg-neutral-700/60 px-3 py-1 text-sm text-neutral-300 border border-neutral-600"
                title="Add coming next"
                disabled
              >
                + Add Customer
              </button>
            </div>
            <Table
              cols={customerCols}
              rows={customers}
              empty="No customers yet."
              onRowClick={setSelectedCustomer}
            />
          </Section>
        )}

        {tab === "Vehicles" && (
          <Section title="Vehicles">
            <div className="mb-3 flex gap-2">
              <button
                className="cursor-not-allowed rounded-md bg-neutral-700/60 px-3 py-1 text-sm text-neutral-300 border border-neutral-600"
                title="Add coming next"
                disabled
              >
                + Add Vehicle
              </button>
            </div>
            <Table
              cols={vehiclesCols}
              rows={vehicles}
              empty="No vehicles yet."
              onRowClick={setSelectedVehicle}
            />
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

      {/* Vehicle profile modal */}
      <Modal
        open={Boolean(selectedVehicle)}
        title={selectedVehicle ? selectedVehicle.name : ""}
        onClose={() => setSelectedVehicle(null)}
      >
        {selectedVehicle && (
          <div className="space-y-2 text-neutral-200">
            <div><span className="text-neutral-400">Plate:</span> {selectedVehicle.plate}</div>
            <div><span className="text-neutral-400">Odometer:</span> {selectedVehicle.currentOdometer}</div>
            <div><span className="text-neutral-400">Status:</span> {selectedVehicle.status}</div>
            <div className="pt-2 text-xs text-neutral-400">
              Edit / Add service history coming next.
            </div>
          </div>
        )}
      </Modal>

      {/* Customer profile modal */}
      <Modal
        open={Boolean(selectedCustomer)}
        title={selectedCustomer ? selectedCustomer.name : ""}
        onClose={() => setSelectedCustomer(null)}
      >
        {selectedCustomer && (
          <div className="space-y-2 text-neutral-200">
            <div><span className="text-neutral-400">Email:</span> {selectedCustomer.email}</div>
            <div><span className="text-neutral-400">Phone:</span> {selectedCustomer.phone}</div>
            <div><span className="text-neutral-400">DL #:</span> {selectedCustomer.license}</div>
            <div className="pt-2 text-xs text-neutral-400">
              Edit / View booking history coming next.
            </div>
          </div>
        )}
      </Modal>

      <footer className="mx-auto max-w-6xl px-4 py-6 text-xs text-neutral-500">
        © {new Date().getFullYear()} KV Rentals. All rights reserved.
      </footer>
    </div>
  );
}

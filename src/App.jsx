// src/App.jsx
import React, { useEffect, useState } from "react";
import { getSummary, getHealth } from "./api";

export default function App() {
  const [now, setNow] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState("");

  // live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // hit health + summary on load
  useEffect(() => {
    setError("");
    getHealth()
      .then(() => setOnline(true))
      .catch(() => setOnline(false));

    getSummary()
      .then((data) => setStats(data))
      .catch((e) => setError(e.message));
  }, []);

  const fmtMoney = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
      : "—";

  return (
    <div className="min-h-screen text-gray-200 bg-black">
      {/* Header */}
      <header className="bg-green-600 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">K.V. Rentals Team Dashboard</h1>
          <div className="text-sm opacity-90">{now.toLocaleTimeString()}</div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 pb-3 flex gap-2 text-sm">
          <Tab label="Dashboard" active />
          <Tab label="Calendar" />
          <Tab label="Bookings" />
          <Tab label="Customers" />
          <Tab label="Vehicles" />
          <Tab label="Team Chat" />
          <Tab label="Finances" />
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Status + Modules + Next */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card title="Status">
            <span
              className={`inline-flex items-center gap-2 px-2 py-1 rounded ${
                online ? "bg-green-700/50 text-green-200" : "bg-red-700/40 text-red-200"
              }`}
            >
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  online ? "bg-green-300" : "bg-red-300"
                }`}
              />
              {online ? "Live" : "Offline"}
            </span>
          </Card>
          <Card title="Modules">
            Calendar • Bookings • Customers • Vehicles
          </Card>
          <Card title="Next">Connect Server</Card>
        </div>

        {/* KPI tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <KPI title="Total Bookings" value={stats?.bookingsTotal} />
          <KPI title="Active Rentals" value={stats?.activeRentals} />
          <KPI title="Vehicles" value={stats?.vehicles} />
          <KPI title="Revenue" value={fmtMoney(stats?.revenue)} />
        </div>

        {error && (
          <div className="mt-6 text-sm text-red-300 bg-red-900/30 border border-red-700/40 rounded px-3 py-2">
            API error: {error}
          </div>
        )}

        <p className="mt-8 text-xs opacity-60">
          Data source: <code>VITE_API_URL</code> → {import.meta.env.VITE_API_URL}
        </p>
      </main>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded border border-gray-700/60 bg-gray-900/40 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
        {title}
      </div>
      <div className="text-gray-100">{children}</div>
    </div>
  );
}

function KPI({ title, value }) {
  const display =
    value === undefined || value === null ? (
      <span className="animate-pulse text-gray-400">loading…</span>
    ) : (
      value
    );
  return (
    <div className="rounded border border-gray-700/60 bg-gray-900/40 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
        {title}
      </div>
      <div className="text-2xl font-semibold">{display}</div>
    </div>
  );
}

function Tab({ label, active }) {
  return (
    <button
      className={`px-3 py-1 rounded-full border text-xs ${
        active
          ? "bg-white text-black border-white"
          : "bg-black/40 text-white/80 border-white/20 hover:border-white/40"
      }`}
      type="button"
    >
      {label}
    </button>
  );
}

import React, { useEffect, useState } from "react";
import "./index.css";

const TABS = [
  "Dashboard",
  "Calendar",
  "Bookings",
  "Customers",
  "Vehicles",
  "Team Chat",
  "Finances",
];

function DashboardHome({ stats }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Bookings" value={stats?.bookingsTotal} />
        <StatCard label="Active Rentals" value={stats?.activeRentals} />
        <StatCard label="Vehicles" value={stats?.vehicles} />
        <StatCard label="Revenue" value={`$${(stats?.revenue ?? 0).toLocaleString()}`} />
      </div>
      <p className="text-xs text-gray-500">
        Data source: <code>VITE_API_URL</code> → {import.meta.env.VITE_API_URL}
      </p>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800 text-white rounded-md p-4 shadow">
      <div className="text-xs uppercase opacity-70">{label}</div>
      <div className="text-2xl font-bold mt-1">{value ?? "—"}</div>
    </div>
  );
}

function CalendarPage() {
  return (
    <div className="bg-gray-800 text-white rounded-md p-4">
      <h2 className="text-lg font-semibold mb-2">Calendar</h2>
      <p className="opacity-80">Calendar view coming next (month/week/day).</p>
    </div>
  );
}

function BookingsPage() {
  return (
    <div className="bg-gray-800 text-white rounded-md p-4">
      <h2 className="text-lg font-semibold mb-2">Bookings</h2>
      <p className="opacity-80">List, add, and edit bookings here.</p>
    </div>
  );
}

function CustomersPage() {
  return (
    <div className="bg-gray-800 text-white rounded-md p-4">
      <h2 className="text-lg font-semibold mb-2">Customers</h2>
      <p className="opacity-80">Customer directory with search and notes.</p>
    </div>
  );
}

function VehiclesPage() {
  const [subTab, setSubTab] = useState("Cars");
  const tabs = ["Cars", "Jet Skis", "Scooters"];
  return (
    <div className="bg-gray-800 text-white rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Vehicles</h2>
        {/* Dropdown */}
        <div className="relative">
          <select
            className="bg-gray-700 rounded px-3 py-2"
            value={subTab}
            onChange={(e) => setSubTab(e.target.value)}
          >
            {tabs.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="opacity-80">
        {subTab === "Cars" && <p>Cars list (add/edit status, plate, mileage).</p>}
        {subTab === "Jet Skis" && <p>Jet Ski rentals (hours, maintenance, fuel).</p>}
        {subTab === "Scooters" && <p>Scooters (battery levels, service intervals).</p>}
      </div>
    </div>
  );
}

function TeamChatPage() {
  return (
    <div className="bg-gray-800 text-white rounded-md p-4">
      <h2 className="text-lg font-semibold mb-2">Team Chat</h2>
      <p className="opacity-80">Real-time chat connects once we add sockets.</p>
    </div>
  );
}

function FinancesPage() {
  return (
    <div className="bg-gray-800 text-white rounded-md p-4">
      <h2 className="text-lg font-semibold mb-2">Finances</h2>
      <p className="opacity-80">Revenue breakdown and payouts will live here.</p>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("Offline");

  // Fetch live stats from your server
  useEffect(() => {
    const base = import.meta.env.VITE_API_URL;
    async function go() {
      try {
        const h = await fetch(`${base}/health`).then(r => r.json());
        setStatus(h.status === "ok" ? "Live" : "Offline");
        const s = await fetch(`${base}/stats/summary`).then(r => r.json());
        setStats(s);
      } catch (e) {
        setStatus("Offline");
      }
    }
    go();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="bg-green-600 p-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="font-bold">K.V. Rentals Team Dashboard</div>
          <nav className="flex gap-2 flex-wrap">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={`px-3 py-1 rounded ${active === t ? "bg-black/30" : "bg-black/10"}`}
              >
                {t}
              </button>
            ))}
          </nav>
          <div className="ml-auto text-xs">
            <span
              className={`inline-flex items-center px-2 py-1 rounded ${
                status === "Live" ? "bg-emerald-600" : "bg-red-600"
              }`}
            >
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-6xl mx-auto p-4">
        {active === "Dashboard" && <DashboardHome stats={stats} />}
        {active === "Calendar" && <CalendarPage />}
        {active === "Bookings" && <BookingsPage />}
        {active === "Customers" && <CustomersPage />}
        {active === "Vehicles" && <VehiclesPage />}
        {active === "Team Chat" && <TeamChatPage />}
        {active === "Finances" && <FinancesPage />}
      </div>
    </div>
  );
}

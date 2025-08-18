import React, { useEffect, useState } from "react";
import "./index.css";

// Small components
import KpiCard from "./components/KpiCard.jsx";
import SectionCard from "./components/SectionCard.jsx";

// Your server URL from Vercel env vars
const API = import.meta.env.VITE_API_URL;

// ------------------------------------
// Helpers / shared UI
// ------------------------------------
const TABS = [
  "Dashboard",
  "Calendar",
  "Bookings",
  "Customers",
  "Vehicles",
  "Team Chat",
  "Finances",
];

function OnlineBadge({ online }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        online ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-rose-400"}`} />
      {online ? "Live" : "Offline"}
    </span>
  );
}

function TopNav({ active, setActive }) {
  return (
    <div className="sticky top-0 z-20 bg-emerald-600/95 backdrop-blur border-b border-emerald-700">
      <div className="mx-auto max-w-6xl px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <div className="text-white font-semibold">K.V. Rentals</div>
        <div className="text-emerald-100/70">Team Dashboard</div>
        <div className="ml-auto flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActive(t)}
              className={`px-3 py-1 rounded-md text-sm ${
                active === t
                  ? "bg-white text-emerald-700"
                  : "text-white/90 hover:bg-emerald-700/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------
// Dashboard View
// ------------------------------------
function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [online, setOnline] = useState(false);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState(null);

  async function load() {
    setError("");
    try {
      const ok = await fetch(`${API}/health`).then((r) => r.ok);
      setOnline(ok);

      const data = await fetch(`${API}/stats/summary`).then((r) => r.json());
      setStats(data);
      setLastSync(new Date());
    } catch (e) {
      setError("Could not reach server");
      setOnline(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(t);
  }, []);

  const loading = !stats && !error;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">K.V. Rentals Dashboard</h2>
          <OnlineBadge online={online} />
        </div>
        <div className="text-xs text-slate-400">
          {lastSync ? `Last sync: ${lastSync.toLocaleTimeString()}` : "Syncing…"}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Bookings"
          value={loading ? "…" : stats?.bookingsTotal ?? 0}
          hint="All time / current"
        />
        <KpiCard
          label="Active Rentals"
          value={loading ? "…" : stats?.activeRentals ?? 0}
          hint="Vehicles out"
        />
        <KpiCard
          label="Vehicles"
          value={loading ? "…" : stats?.vehicles ?? 0}
          hint="Fleet size"
        />
        <KpiCard
          label="Revenue"
          value={
            loading
              ? "…"
              : (stats?.revenue ?? 0).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                })
          }
          hint="Month to date (demo)"
        />
      </div>

      {/* Info rows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Modules"
          right={<span className="text-xs text-slate-400">
            Calendar • Bookings • Customers • Vehicles
          </span>}
        >
          <div className="text-sm text-slate-300">
            Quick actions coming soon (add booking, check-in/out, assign vehicle, upsell items).
          </div>
        </SectionCard>

        <SectionCard title="Next">
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
            <li>Connect database (Supabase / Postgres)</li>
            <li>Enable team chat (Socket.IO)</li>
            <li>Embed calendar (month/week/day)</li>
          </ul>
        </SectionCard>

        <SectionCard title="Status">
          <div className="text-sm text-slate-300">
            API:&nbsp;
            <a
              className="underline text-slate-200 break-all"
              href={`${API}/health`}
              target="_blank"
              rel="noreferrer"
            >
              {API}/health
            </a>
            <div className="mt-2 text-xs text-slate-400">Data source: {API}</div>
            {error && <div className="mt-2 text-rose-300">{error}</div>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ------------------------------------
// Placeholder views for other tabs
// ------------------------------------
function PlaceholderPanel({ title, children }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <SectionCard title={title}>
        <div className="text-sm text-slate-300">{children}</div>
      </SectionCard>
    </div>
  );
}

function CalendarView() {
  return (
    <PlaceholderPanel title="Calendar">
      Calendar view coming next (month / week / day).
    </PlaceholderPanel>
  );
}

function BookingsView() {
  return (
    <PlaceholderPanel title="Bookings">
      Booking list, filters, and create/edit booking form coming next.
    </PlaceholderPanel>
  );
}

function CustomersView() {
  return (
    <PlaceholderPanel title="Customers">
      CRM-style list with search, notes, and booking history coming next.
    </PlaceholderPanel>
  );
}

function VehiclesView() {
  return (
    <PlaceholderPanel title="Vehicles">
      Fleet table with status (available/out/maintenance) and categories (cars, power sports) coming next.
    </PlaceholderPanel>
  );
}

function TeamChatView() {
  return (
    <PlaceholderPanel title="Team Chat">
      Real-time chat via Socket.IO coming next.
    </PlaceholderPanel>
  );
}

function FinancesView() {
  return (
    <PlaceholderPanel title="Finances">
      Revenue, expenses, payouts, and reports coming next.
    </PlaceholderPanel>
  );
}

// ------------------------------------
// App shell with tab switcher
// ------------------------------------
export default function App() {
  const [active, setActive] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <TopNav active={active} setActive={setActive} />
      {active === "Dashboard" && <DashboardHome />}
      {active === "Calendar" && <CalendarView />}
      {active === "Bookings" && <BookingsView />}
      {active === "Customers" && <CustomersView />}
      {active === "Vehicles" && <VehiclesView />}
      {active === "Team Chat" && <TeamChatView />}
      {active === "Finances" && <FinancesView />}

      {/* Footer */}
      <div className="mx-auto max-w-6xl px-4 pb-10 text-xs text-slate-500">
        © {new Date().getFullYear()} K.V. Rentals. All rights reserved.
      </div>
    </div>
  );
}

import React, { useEffect, useState } from "react";
import "./index.css";

/** Top-nav tab order (your requested order) */
const TABS = [
  "Dashboard",
  "Calendar",
  "Bookings",
  "Customers",
  "Vehicles",
  "Team Chat",
  "Finances",
];

/** Small pill for status */
function StatusPill({ online }) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded ${
        online ? "bg-green-600 text-white" : "bg-red-600 text-white"
      }`}
    >
      {online ? "Live" : "Offline"}
    </span>
  );
}

/** Simple stat card */
function StatCard({ label, value }) {
  return (
    <div className="bg-gray-800/70 text-white rounded p-4 shadow">
      <p className="text-xs uppercase opacity-80 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

/** Placeholder box for tabs we’ll build later */
function Placeholder({ title, children }) {
  return (
    <div className="bg-gray-800/60 text-white rounded p-4 shadow">
      <div className="font-semibold mb-2">{title}</div>
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}

/** Dashboard home showing stats */
function DashboardHome({ stats }) {
  const loading = (n = "---") => <span className="opacity-60">{n}</span>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={stats ? stats.bookingsTotal ?? 0 : loading()}
        />
        <StatCard
          label="Active Rentals"
          value={stats ? stats.activeRentals ?? 0 : loading()}
        />
        <StatCard
          label="Vehicles"
          value={stats ? stats.vehicles ?? 0 : loading()}
        />
        <StatCard
          label="Revenue"
          value={
            stats
              ? (stats.revenue ?? 0).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                })
              : loading("$—")
          }
        />
      </div>

      <p className="text-xs text-gray-300">
        Data source: <code>VITE_API_URL</code> →{" "}
        <span className="underline decoration-dotted">
          {import.meta.env.VITE_API_URL}
        </span>
      </p>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [status, setStatus] = useState("offline"); // "online" | "offline"
  const [stats, setStats] = useState(null);

  // ---- Server health + summary polling (every 10s) ----
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL;

    const check = async () => {
      try {
        // 1) health check
        const h = await fetch(`${API}/health`, { cache: "no-store" });
        if (!h.ok) throw new Error("health failed");
        setStatus("online");

        // 2) summary stats
        const s = await fetch(`${API}/stats/summary`, { cache: "no-store" });
        if (s.ok) {
          const data = await s.json();
          setStats(data);
        }
      } catch (err) {
        setStatus("offline");
        setStats(null);
      }
    };

    check(); // run immediately on load
    const id = setInterval(check, 10000); // poll every 10s
    return () => clearInterval(id);
  }, []);

  // ---- Simple tab views (placeholders for now) ----
  const renderBody = () => {
    switch (active) {
      case "Dashboard":
        return <DashboardHome stats={stats} />;

      case "Calendar":
        return (
          <Placeholder title="Calendar">
            Calendar view coming next (month / week / day).
          </Placeholder>
        );

      case "Bookings":
        return (
          <Placeholder title="Bookings">
            Booking list, filters, and create/edit booking will go here.
          </Placeholder>
        );

      case "Customers":
        return (
          <Placeholder title="Customers">
            Customer list, profiles, and search will go here.
          </Placeholder>
        );

      case "Vehicles":
        return (
          <Placeholder title="Vehicles">
            Vehicles &amp; Power Sports (with dropdowns) will go here.
          </Placeholder>
        );

      case "Team Chat":
        return (
          <Placeholder title="Team Chat">
            Real-time team chat (channels, mentions) coming soon.
          </Placeholder>
        );

      case "Finances":
        return (
          <Placeholder title="Finances">
            Payouts, invoices, expense tracking and reports coming soon.
          </Placeholder>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-bold">K.V. Rentals</div>
            <span className="opacity-90">Team Dashboard</span>
          </div>

          {/* Tabs */}
          <nav className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setActive(t)}
                className={`px-3 py-1 rounded text-sm ${
                  active === t ? "bg-green-800" : "bg-green-700 hover:bg-green-800"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="text-xs">
            <StatusPill online={status === "online"} />
          </div>
        </div>
      </header>

      {/* Summary header row */}
      <div className="max-w-6xl mx-auto px-4 mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/60 rounded p-4">
          <div className="text-xs uppercase opacity-70 mb-1">Status</div>
          <StatusPill online={status === "online"} />
        </div>

        <div className="bg-gray-800/60 rounded p-4">
          <div className="text-xs uppercase opacity-70 mb-1">Modules</div>
          <div className="font-semibold">
            Calendar • Bookings • Customers • Vehicles
          </div>
        </div>

        <div className="bg-gray-800/60 rounded p-4">
          <div className="text-xs uppercase opacity-70 mb-1">Next</div>
          <div className="font-semibold">Connect Server</div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">{renderBody()}</main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 pb-8 text-xs text-gray-400">
        © {new Date().getFullYear()} K.V. Rentals. All rights reserved.
      </footer>
    </div>
  );
}

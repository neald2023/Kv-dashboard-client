import React, { useState, useEffect } from "react";

function App() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-800">
      {/* Header */}
      <header className="bg-green-600 text-white p-4 flex justify-between items-center shadow">
        <h1 className="text-2xl font-bold">K.V. Rentals Dashboard</h1>
        <div>{time.toLocaleTimeString()}</div>
      </header>

      {/* Main content */}
      <main className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r p-4">
          <nav className="space-y-2">
            <button className="w-full text-left p-2 bg-gray-200 rounded">Bookings</button>
            <button className="w-full text-left p-2 bg-gray-200 rounded">Vehicles</button>
            <button className="w-full text-left p-2 bg-gray-200 rounded">Customers</button>
            <button className="w-full text-left p-2 bg-gray-200 rounded">Finances</button>
          </nav>
        </aside>

        {/* Dashboard content */}
        <section className="flex-1 p-6 space-y-6">
          {/* Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white shadow p-4 rounded">
              <h2 className="text-sm text-gray-500">Total Bookings</h2>
              <p className="text-2xl font-bold">128</p>
            </div>
            <div className="bg-white shadow p-4 rounded">
              <h2 className="text-sm text-gray-500">Active Rentals</h2>
              <p className="text-2xl font-bold">14</p>
            </div>
            <div className="bg-white shadow p-4 rounded">
              <h2 className="text-sm text-gray-500">Vehicles</h2>
              <p className="text-2xl font-bold">23</p>
            </div>
            <div className="bg-white shadow p-4 rounded">
              <h2 className="text-sm text-gray-500">Revenue</h2>
              <p className="text-2xl font-bold">$12,480</p>
            </div>
          </div>

          {/* Placeholder for upcoming features */}
          <div className="bg-white shadow p-6 rounded text-center">
            🚀 Team chat, live bookings, and calendar view coming soon!
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-200 p-4 text-center text-sm">
        © {new Date().getFullYear()} K.V. Rentals. All rights reserved.
      </footer>
    </div>
  );
}

export default App;

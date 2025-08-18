// src/api.js
export const API_BASE =
  import.meta.env.VITE_API_URL || "https://kv-dashboard-server.onrender.com";

// ---- Example API calls (adjust names as needed) ----
export async function getToday() {
  const r = await fetch(`${API_BASE}/api/today`);
  if (!r.ok) throw new Error("API /api/today failed");
  return r.json();
}

export async function getBookings() {
  const r = await fetch(`${API_BASE}/api/bookings`);
  if (!r.ok) throw new Error("API /api/bookings failed");
  return r.json();
}


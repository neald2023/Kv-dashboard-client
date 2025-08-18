// src/api.js
// Builds the API base from your Vercel env var set earlier
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

async function handle(res) {
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export function getHealth() {
  return fetch(`${API_BASE}/health`, { credentials: "omit" }).then(handle);
}

export function getSummary() {
  return fetch(`${API_BASE}/stats/summary`, { credentials: "omit" }).then(handle);
}

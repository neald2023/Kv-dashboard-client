// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

/** ====== API helper ====== */
const API = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";

async function apiGet(path) {
  const res = await fetch(`${API}${path}`, { credentials: "omit" });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}
async function apiSend(path, method, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "omit",
  });
  if (!res.ok) {
    let msg = `${method} ${path} → ${res.status}`;
    try {
      const j = await res.json();
      if (j?.error) msg += `\n${j.error}`;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/** ====== Small UI bits ====== */
const Pill = ({ children, tone = "default" }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded text-xs ${
      tone === "ok"
        ? "bg-green-700/30 text-green-200"
        : tone === "warn"
        ? "bg-yellow-700/30 text-yellow-100"
        : tone === "bad"
        ? "bg-red-700/30 text-red-100"
        : "bg-slate-700/40 text-slate-200"
    }`}
  >
    {children}
  </span>
);

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded w-full max-w-3xl p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {children}
        <div className="mt-4 flex gap-2 justify-end">{footer}</div>
      </div>
    </div>
  );
}

/** ====== App ====== */
export default function App() {
  const [tab, setTab] = useState("dashboard");

  // dashboard
  const [summary, setSummary] = useState(null);
  const [statusOk, setStatusOk] = useState(false);

  // vehicles
  const [vehicles, setVehicles] = useState([]);
  const [vehOpen, setVehOpen] = useState(false);
  const [vehForm, setVehForm] = useState(emptyVehicle());

  // customers
  const [customers, setCustomers] = useState([]);
  const [custOpen, setCustOpen] = useState(false);
  const [custForm, setCustForm] = useState(emptyCustomer());

  // bookings
  const [bookings, setBookings] = useState([]);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookForm, setBookForm] = useState(emptyBooking());

  const vehiclesById = useMemo(
    () => Object.fromEntries(vehicles.map((v) => [v.id, v])),
    [vehicles]
  );
  const customersById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c])),
    [customers]
  );

  /** Loaders */
  async function refreshHealthAndSummary() {
    try {
      const h = await apiGet("/health");
      setStatusOk(!!h.ok);
    } catch {
      setStatusOk(false);
    }
    try {
      const s = await apiGet("/stats/summary");
      setSummary(s);
    } catch {
      setSummary(null);
    }
  }
  async function refreshVehicles() {
    setVehicles(await apiGet("/vehicles"));
  }
  async function refreshCustomers() {
    setCustomers(await apiGet("/customers"));
  }
  async function refreshBookings() {
    setBookings(await apiGet("/bookings"));
  }

  useEffect(() => {
    refreshHealthAndSummary();
    refreshVehicles();
    refreshCustomers();
    refreshBookings();
  }, []);

  /** Vehicle handlers */
  function openNewVehicle() {
    setVehForm(emptyVehicle());
    setVehOpen(true);
  }
  function openEditVehicle(v) {
    setVehForm({ ...v });
    setVehOpen(true);
  }
  async function saveVehicle() {
    try {
      const body = {
        year: Number(vehForm.year || 0),
        make: (vehForm.make || "").trim(),
        model: (vehForm.model || "").trim(),
        vin: (vehForm.vin || "").trim(),
        color: (vehForm.color || "").trim(),
        plate: (vehForm.plate || "").trim(),
        currentOdometer: Number(String(vehForm.currentOdometer || "0").replace(/^0+/, "") || 0),
        status: vehForm.status || "available",
      };
      if (vehForm.id) {
        await apiSend(`/vehicles/${vehForm.id}`, "PUT", body);
      } else {
        await apiSend(`/vehicles`, "POST", body);
      }
      setVehOpen(false);
      await refreshVehicles();
      await refreshHealthAndSummary();
    } catch (e) {
      alert(e.message);
    }
  }

  /** Customer handlers */
  function openNewCustomer() {
    setCustForm(emptyCustomer());
    setCustOpen(true);
  }
  function openEditCustomer(c) {
    setCustForm({
      ...c,
      insurance: { ...(c.insurance || {}) },
      documents: { ...(c.documents || {}) },
    });
    setCustOpen(true);
  }
  async function saveCustomer() {
    try {
      const body = {
        name: (custForm.name || "").trim(),
        email: (custForm.email || "").trim(),
        phone: (custForm.phone || "").trim(),
        licenseNumber: (custForm.licenseNumber || "").trim(),
        address: (custForm.address || "").trim(),
        insurance: {
          carrier: (custForm.insurance?.carrier || "").trim(),
          policyNumber: (custForm.insurance?.policyNumber || "").trim(),
          expiresAt: (custForm.insurance?.expiresAt || "").trim(),
        },
        documents: {
          driverLicenseUrl: (custForm.documents?.driverLicenseUrl || "").trim(),
          insuranceCardUrl: (custForm.documents?.insuranceCardUrl || "").trim(),
        },
      };
      if (custForm.id) {
        await apiSend(`/customers/${custForm.id}`, "PUT", body);
      } else {
        await apiSend(`/customers`, "POST", body);
      }
      setCustOpen(false);
      await refreshCustomers();
    } catch (e) {
      alert(e.message);
    }
  }

  /** Booking handlers */
  function openNewBooking() {
    setBookForm(emptyBooking());
    setBookOpen(true);
  }
  async function saveBooking() {
    try {
      const body = {
        customerId: bookForm.customerId,
        vehicleId: bookForm.vehicleId,
        startDate: bookForm.startDate,
        endDate: bookForm.endDate,
        notes: bookForm.notes || "",
        price: bookForm.price ? Number(bookForm.price) : undefined,
      };
      await apiSend(`/bookings`, "POST", body);
      setBookOpen(false);
      await refreshBookings();
      await refreshVehicles();
      await refreshHealthAndSummary();
    } catch (e) {
      alert(e.message);
    }
  }
  async function updateBookingStatus(id, next) {
    try {
      await apiSend(`/bookings/${id}`, "PUT", { status: next });
      await refreshBookings();
      await refreshVehicles();
      await refreshHealthAndSummary();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="p-5 text-slate-200">
      <header className="mb-4 flex items-center gap-3">
        <h1 className="text-xl font-semibold">K.V. Rentals • Team Dashboard</h1>
        <Pill tone={statusOk ? "ok" : "bad"}>{statusOk ? "Live" : "Offline"}</Pill>
        <span className="ml-auto text-xs opacity-70">
          Data source: <code>VITE_API_URL</code> → {API || "(not set)"}
        </span>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {["dashboard", "vehicles", "customers", "bookings"].map((t) => (
          <button
            key={t}
            className={`px-3 py-1 rounded ${
              tab === t ? "bg-green-700 text-white" : "bg-slate-800 hover:bg-slate-700"
            }`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Dash */}
      {tab === "dashboard" && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Tile label="Total Bookings" value={summary?.bookingsTotal ?? "—"} />
          <Tile label="Active Rentals" value={summary?.activeRentals ?? "—"} />
          <Tile label="Vehicles" value={summary?.vehicles ?? "—"} />
          <Tile
            label="Revenue"
            value={
              typeof summary?.revenue === "number"
                ? `$${summary.revenue.toLocaleString()}`
                : "—"
            }
          />
        </section>
      )}

      {/* Vehicles */}
      {tab === "vehicles" && (
        <section>
          <div className="mb-2 flex justify-between items-center">
            <h2 className="font-semibold">Vehicles</h2>
            <button className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600" onClick={openNewVehicle}>
              + Add Vehicle
            </button>
          </div>
          <div className="overflow-auto border border-slate-700 rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <Th>Vehicle</Th>
                  <Th>Plate</Th>
                  <Th>Odometer</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-800 cursor-pointer"
                    onClick={() => openEditVehicle(v)}
                  >
                    <Td>{v.name || `${v.year} ${v.make} ${v.model}`}</Td>
                    <Td>{v.plate}</Td>
                    <Td>{v.currentOdometer?.toLocaleString()}</Td>
                    <Td>
                      <Pill
                        tone={
                          v.status === "available" ? "ok" : v.status === "out" ? "warn" : "bad"
                        }
                      >
                        {v.status}
                      </Pill>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Modal
            open={vehOpen}
            onClose={() => setVehOpen(false)}
            title={vehForm.id ? "Edit Vehicle" : "Add Vehicle"}
            footer={[
              <button key="cancel" className="px-3 py-1 bg-slate-800 rounded" onClick={() => setVehOpen(false)}>
                Cancel
              </button>,
              <button key="save" className="px-3 py-1 bg-green-700 rounded" onClick={saveVehicle}>
                Save Vehicle
              </button>,
            ]}
          >
            <TwoCol>
              <Field label="Year">
                <input
                  className="inp"
                  value={vehForm.year ?? ""}
                  onChange={(e) => setVehForm({ ...vehForm, year: e.target.value })}
                  inputMode="numeric"
                />
              </Field>
              <Field label="Make">
                <input
                  className="inp"
                  value={vehForm.make || ""}
                  onChange={(e) => setVehForm({ ...vehForm, make: e.target.value })}
                />
              </Field>
              <Field label="Model">
                <input
                  className="inp"
                  value={vehForm.model || ""}
                  onChange={(e) => setVehForm({ ...vehForm, model: e.target.value })}
                />
              </Field>
              <Field label="VIN">
                <input
                  className="inp"
                  value={vehForm.vin || ""}
                  onChange={(e) => setVehForm({ ...vehForm, vin: e.target.value })}
                />
              </Field>
              <Field label="Color">
                <input
                  className="inp"
                  value={vehForm.color || ""}
                  onChange={(e) => setVehForm({ ...vehForm, color: e.target.value })}
                />
              </Field>
              <Field label="License Plate">
                <input
                  className="inp"
                  value={vehForm.plate || ""}
                  onChange={(e) => setVehForm({ ...vehForm, plate: e.target.value })}
                />
              </Field>
              <Field label="Odometer">
                <input
                  className="inp"
                  value={vehForm.currentOdometer ?? ""}
                  onChange={(e) =>
                    setVehForm({
                      ...vehForm,
                      currentOdometer: e.target.value.replace(/[^\d]/g, ""),
                    })
                  }
                  inputMode="numeric"
                />
              </Field>
              <Field label="Status">
                <select
                  className="inp"
                  value={vehForm.status || "available"}
                  onChange={(e) => setVehForm({ ...vehForm, status: e.target.value })}
                >
                  <option value="available">available</option>
                  <option value="out">out</option>
                  <option value="service">service</option>
                </select>
              </Field>
            </TwoCol>
          </Modal>
        </section>
      )}

      {/* Customers */}
      {tab === "customers" && (
        <section>
          <div className="mb-2 flex justify-between items-center">
            <h2 className="font-semibold">Customers</h2>
            <button className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600" onClick={openNewCustomer}>
              + Add Customer
            </button>
          </div>
          <div className="overflow-auto border border-slate-700 rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <Th>Name</Th>
                  <Th>Phone</Th>
                  <Th>Email</Th>
                  <Th>License</Th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-800 cursor-pointer"
                    onClick={() => openEditCustomer(c)}
                  >
                    <Td>{c.name}</Td>
                    <Td>{c.phone}</Td>
                    <Td>{c.email}</Td>
                    <Td>{c.licenseNumber}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Modal
            open={custOpen}
            onClose={() => setCustOpen(false)}
            title={custForm.id ? "Edit Customer" : "Add Customer"}
            footer={[
              <button key="cancel" className="px-3 py-1 bg-slate-800 rounded" onClick={() => setCustOpen(false)}>
                Cancel
              </button>,
              <button key="save" className="px-3 py-1 bg-green-700 rounded" onClick={saveCustomer}>
                Save Customer
              </button>,
            ]}
          >
            <TwoCol>
              <Field label="Name">
                <input
                  className="inp"
                  value={custForm.name || ""}
                  onChange={(e) => setCustForm({ ...custForm, name: e.target.value })}
                />
              </Field>
              <Field label="Phone">
                <input
                  className="inp"
                  value={custForm.phone || ""}
                  onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                />
              </Field>
              <Field label="Email">
                <input
                  className="inp"
                  value={custForm.email || ""}
                  onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                />
              </Field>
              <Field label="Driver License #">
                <input
                  className="inp"
                  value={custForm.licenseNumber || ""}
                  onChange={(e) =>
                    setCustForm({ ...custForm, licenseNumber: e.target.value })
                  }
                />
              </Field>
              <Field label="Address" full>
                <input
                  className="inp"
                  value={custForm.address || ""}
                  onChange={(e) => setCustForm({ ...custForm, address: e.target.value })}
                />
              </Field>

              <div className="col-span-2 border-t border-slate-700 my-2" />

              <Field label="Insurance Carrier">
                <input
                  className="inp"
                  value={custForm.insurance?.carrier || ""}
                  onChange={(e) =>
                    setCustForm({
                      ...custForm,
                      insurance: { ...(custForm.insurance || {}), carrier: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Policy #">
                <input
                  className="inp"
                  value={custForm.insurance?.policyNumber || ""}
                  onChange={(e) =>
                    setCustForm({
                      ...custForm,
                      insurance: {
                        ...(custForm.insurance || {}),
                        policyNumber: e.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Policy Expiration">
                <input
                  className="inp"
                  placeholder="YYYY-MM-DD"
                  value={custForm.insurance?.expiresAt || ""}
                  onChange={(e) =>
                    setCustForm({
                      ...custForm,
                      insurance: { ...(custForm.insurance || {}), expiresAt: e.target.value },
                    })
                  }
                />
              </Field>

              <div className="col-span-2 border-t border-slate-700 my-2" />

              <Field label="Driver License Photo URL" full>
                <input
                  className="inp"
                  value={custForm.documents?.driverLicenseUrl || ""}
                  onChange={(e) =>
                    setCustForm({
                      ...custForm,
                      documents: {
                        ...(custForm.documents || {}),
                        driverLicenseUrl: e.target.value,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Insurance Card Photo URL" full>
                <input
                  className="inp"
                  value={custForm.documents?.insuranceCardUrl || ""}
                  onChange={(e) =>
                    setCustForm({
                      ...custForm,
                      documents: {
                        ...(custForm.documents || {}),
                        insuranceCardUrl: e.target.value,
                      },
                    })
                  }
                />
              </Field>
            </TwoCol>
          </Modal>
        </section>
      )}

      {/* Bookings */}
      {tab === "bookings" && (
        <section>
          <div className="mb-2 flex justify-between items-center">
            <h2 className="font-semibold">Bookings</h2>
            <button className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600" onClick={openNewBooking}>
              + New Booking
            </button>
          </div>

          <div className="overflow-auto border border-slate-700 rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <Th>Customer</Th>
                  <Th>Vehicle</Th>
                  <Th>Start</Th>
                  <Th>End</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800">
                    <Td>{customersById[b.customerId]?.name || b.customer || b.customerId}</Td>
                    <Td>{vehiclesById[b.vehicleId]?.name || b.vehicle || b.vehicleId}</Td>
                    <Td>{fmtDate(b.startDate)}</Td>
                    <Td>{fmtDate(b.endDate)}</Td>
                    <Td>
                      <Pill
                        tone={
                          b.status === "active"
                            ? "warn"
                            : b.status === "completed"
                            ? "ok"
                            : "bad"
                        }
                      >
                        {b.status}
                      </Pill>
                    </Td>
                    <Td>
                      <div className="flex gap-1">
                        <button
                          className="px-2 py-0.5 rounded bg-green-700/70"
                          onClick={() => updateBookingStatus(b.id, "completed")}
                          title="Complete"
                        >
                          ✓
                        </button>
                        <button
                          className="px-2 py-0.5 rounded bg-yellow-700/70"
                          onClick={() => updateBookingStatus(b.id, "active")}
                          title="Mark Active"
                        >
                          ▶
                        </button>
                        <button
                          className="px-2 py-0.5 rounded bg-red-700/70"
                          onClick={() => updateBookingStatus(b.id, "canceled")}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Modal
            open={bookOpen}
            onClose={() => setBookOpen(false)}
            title="New Booking"
            footer={[
              <button key="cancel" className="px-3 py-1 bg-slate-800 rounded" onClick={() => setBookOpen(false)}>
                Cancel
              </button>,
              <button key="save" className="px-3 py-1 bg-green-700 rounded" onClick={saveBooking}>
                Save Booking
              </button>,
            ]}
          >
            <TwoCol>
              <Field label="Customer">
                <select
                  className="inp"
                  value={bookForm.customerId}
                  onChange={(e) => setBookForm({ ...bookForm, customerId: e.target.value })}
                >
                  <option value="">Select…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Vehicle">
                <select
                  className="inp"
                  value={bookForm.vehicleId}
                  onChange={(e) => setBookForm({ ...bookForm, vehicleId: e.target.value })}
                >
                  <option value="">Select…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} — {v.plate} ({v.status})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Start (ISO)">
                <input
                  className="inp"
                  placeholder="2025-08-22T10:00:00Z"
                  value={bookForm.startDate}
                  onChange={(e) => setBookForm({ ...bookForm, startDate: e.target.value })}
                />
              </Field>
              <Field label="End (ISO)">
                <input
                  className="inp"
                  placeholder="2025-08-23T16:00:00Z"
                  value={bookForm.endDate}
                  onChange={(e) => setBookForm({ ...bookForm, endDate: e.target.value })}
                />
              </Field>
              <Field label="Price (optional)">
                <input
                  className="inp"
                  inputMode="decimal"
                  value={bookForm.price ?? ""}
                  onChange={(e) => setBookForm({ ...bookForm, price: e.target.value.replace(/[^\d.]/g, "") })}
                />
              </Field>
              <Field label="Notes" full>
                <textarea
                  className="inp"
                  rows={3}
                  value={bookForm.notes || ""}
                  onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })}
                />
              </Field>
            </TwoCol>
          </Modal>
        </section>
      )}
    </div>
  );
}

/** ====== helpers / little components ====== */
function emptyVehicle() {
  return {
    id: "",
    year: "",
    make: "",
    model: "",
    vin: "",
    color: "",
    plate: "",
    currentOdometer: "",
    status: "available",
  };
}
function emptyCustomer() {
  return {
    id: "",
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    address: "",
    insurance: { carrier: "", policyNumber: "", expiresAt: "" },
    documents: { driverLicenseUrl: "", insuranceCardUrl: "" },
  };
}
function emptyBooking() {
  return {
    customerId: "",
    vehicleId: "",
    startDate: "",
    endDate: "",
    notes: "",
    price: "",
  };
}
function fmtDate(s) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    if (isNaN(d)) return s;
    return d.toLocaleString();
  } catch {
    return s;
  }
}

const Th = ({ children }) => (
  <th className="text-left px-3 py-2 border-b border-slate-700/70">{children}</th>
);
const Td = ({ children }) => (
  <td className="px-3 py-2 border-b border-slate-800/60 align-top">{children}</td>
);
const Tile = ({ label, value }) => (
  <div className="bg-slate-900 border border-slate-700 rounded p-4">
    <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </div>
);
function Field({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs opacity-75">{label}</span>
      {children}
    </label>
  );
}
function TwoCol({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}

// simple input style
// (Tailwind-like classes are fine; falls back to defaults if you don't have Tailwind)

// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

/* =========================
   Helpers / small UI bits
   ========================= */

const API = import.meta.env.VITE_API_URL || "";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function Tile({ label, value }) {
  return (
    <div className="rounded border border-slate-700 p-3">
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value ?? "—"}</div>
    </div>
  );
}

/** Basic input that NEVER steals focus or resets text while typing */
function Inp({ className = "", value, onChange, ...rest }) {
  return (
    <input
      {...rest}
      className={classNames(
        "w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500",
        className
      )}
      value={value ?? ""}
      onChange={(e) => onChange && onChange(e.target.value)}
      autoComplete="off"
    />
  );
}

function Sel({ className = "", value, onChange, children, ...rest }) {
  return (
    <select
      {...rest}
      className={classNames(
        "w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500",
        className
      )}
      value={value ?? ""}
      onChange={(e) => onChange && onChange(e.target.value)}
    >
      {children}
    </select>
  );
}

/** Modal: closes on backdrop click, ESC; inner panel stops clicks. Keeps focus stable. */
function Modal({ open = false, onClose, title, width = 760, children, footer }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="rounded bg-slate-900 border border-slate-700 shadow-xl w-full"
        style={{ maxWidth: width, width: "95vw" }}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose?.();
        }}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              type="button"
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t border-slate-800 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** Searchable dropdown: type to filter, click to choose */
function SearchableSelect({
  options = [],
  value,
  onChange,
  labelKey = "label",
  valueKey = "value",
  placeholder = "Type to search…",
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () =>
      options.filter((o) =>
        String(o[labelKey] ?? "")
          .toLowerCase()
          .includes(q.toLowerCase())
      ),
    [options, q, labelKey]
  );

  const selectedLabel =
    options.find((o) => o[valueKey] === value)?.[labelKey] ?? "";

  return (
    <div className="relative">
      <Inp value={q} onChange={setQ} placeholder={placeholder} />
      {q.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border border-slate-700 bg-slate-900">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-slate-400">No matches</div>
          )}
          {filtered.map((o) => (
            <button
              key={o[valueKey]}
              type="button"
              className="block w-full text-left px-3 py-2 hover:bg-slate-800"
              onClick={() => {
                onChange?.(o[valueKey], o);
                setQ(selectedLabel || "");
              }}
            >
              {o[labelKey]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================
   API helpers
   ========================= */
async function apiGet(path) {
  const res = await fetch(`${API}${path}`, { credentials: "omit" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPut(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/* =========================
   Main App
   ========================= */
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [online, setOnline] = useState(false);

  const [summary, setSummary] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);

  // edit state
  const [vehEdit, setVehEdit] = useState(null);
  const [custEdit, setCustEdit] = useState(null);
  const [bookEdit, setBookEdit] = useState(null);

  // tax rate (8%)
  const TAX_RATE = 0.08;

  // ping + initial data
  useEffect(() => {
    (async () => {
      try {
        await apiGet("/health");
        setOnline(true);
      } catch {
        setOnline(false);
      }
      try {
        const [s, v, c, b] = await Promise.all([
          apiGet("/stats/summary"),
          apiGet("/vehicles"),
          apiGet("/customers"),
          apiGet("/bookings"),
        ]);
        setSummary(s);
        setVehicles(v);
        setCustomers(c);
        setBookings(b);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  /* ---------- Dashboard ---------- */
  function Dashboard() {
    return (
      <div className="space-y-4">
        <div className="text-xs opacity-60">
          Data source: <code>VITE_API_URL → {API || "(not set)"}</code>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Tile label="Total Bookings" value={summary?.bookingsTotal} />
          <Tile label="Active Rentals" value={summary?.activeRentals} />
          <Tile label="Vehicles" value={summary?.vehicles} />
          <Tile label="Revenue" value={`$${(summary?.revenue ?? 0).toLocaleString()}`} />
        </div>
      </div>
    );
  }

  /* ---------- Calendar (simple live view with hover) ---------- */
  function Calendar() {
    const today = new Date();
    const [cursor, setCursor] = useState(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));

    // build marks
    const fmt = (dt) => dt.toISOString().slice(0, 10);
    const marks = new Map(); // key -> { pickup, return, items: [] }
    bookings.forEach((b) => {
      const s = fmt(new Date(b.start));
      const e = fmt(new Date(b.end));
      const add = (k, part) => {
        const cur = marks.get(k) || { items: [], pickup: false, return: false };
        if (part === "pickup") cur.pickup = true;
        if (part === "return") cur.return = true;
        cur.items.push(b);
        marks.set(k, cur);
      };
      add(s, "pickup");
      add(e, "return");
    });

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <div className="flex gap-2">
            <button
              className="btn"
              onClick={() =>
                setCursor(new Date(y, m - 1, 1))
              }
            >
              ◀ Prev
            </button>
            <div className="px-3 py-1 rounded bg-slate-800 border border-slate-700">
              {cursor.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </div>
            <button
              className="btn"
              onClick={() =>
                setCursor(new Date(y, m + 1, 1))
              }
            >
              Next ▶
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px text-center text-xs">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-2 text-slate-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((dt, idx) => (
            <div
              key={idx}
              className={classNames(
                "relative h-24 rounded border border-slate-700 p-1 text-left",
                !dt && "bg-slate-900/40"
              )}
            >
              {dt && (
                <>
                  <div className="opacity-70 text-xs">{dt.getDate()}</div>
                  {/* markers + hover popover */}
                  {(() => {
                    const k = fmt(dt);
                    const m = marks.get(k);
                    if (!m) return null;
                    return (
                      <div className="group absolute bottom-1 left-1 right-1 flex items-center justify-center gap-2">
                        {m.pickup && <div className="h-2 w-2 rounded-full bg-green-400" title="Pickup"></div>}
                        {m.return && <div className="h-2 w-2 rounded-full bg-red-400" title="Return"></div>}
                        {/* hover card */}
                        <div className="pointer-events-none absolute -top-2 left-0 right-0 hidden translate-y-[-100%] rounded border border-slate-700 bg-slate-900 p-2 text-xs group-hover:block">
                          {m.items.slice(0, 4).map((b, i) => (
                            <div key={i} className="truncate">
                              {b.customer?.name} → {b.vehicle?.name}
                            </div>
                          ))}
                          {m.items.length > 4 && (
                            <div className="text-slate-400">
                              +{m.items.length - 4} more…
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="h-2 w-2 rounded-full bg-green-400" /> Pickup
          <div className="h-2 w-2 rounded-full bg-red-400" /> Return
        </div>
      </div>
    );
  }

  /* ---------- Vehicles ---------- */
  function Vehicles() {
    const [show, setShow] = useState(false);

    function openNew() {
      setVehEdit({
        id: "",
        year: "",
        make: "",
        model: "",
        vin: "",
        color: "",
        plate: "",
        currentOdometer: "",
        status: "available",
      });
      setShow(true);
    }
    function openEdit(v) {
      setVehEdit({ ...v });
      setShow(true);
    }

    async function saveVehicle() {
      const body = { ...vehEdit, currentOdometer: Number(vehEdit.currentOdometer || 0) };
      await apiPut("/vehicles", body);
      const v = await apiGet("/vehicles");
      setVehicles(v);
      setShow(false);
      setVehEdit(null);
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Vehicles</h2>
          <button className="btn" onClick={openNew}>+ Add Vehicle</button>
        </div>

        <div className="rounded border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-2 text-left">Vehicle</th>
                <th className="p-2 text-left">Plate</th>
                <th className="p-2 text-left">Odometer</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t border-slate-800">
                  <td className="p-2">{v.year} {v.make} {v.model}</td>
                  <td className="p-2">{v.plate}</td>
                  <td className="p-2">{v.currentOdometer?.toLocaleString?.() ?? v.currentOdometer}</td>
                  <td className="p-2">
                    <span className={classNames(
                      "rounded px-2 py-0.5 text-xs",
                      v.status === "available" && "bg-emerald-600/20 text-emerald-300",
                      v.status === "out" && "bg-amber-600/20 text-amber-300",
                      v.status === "service" && "bg-sky-600/20 text-sky-300"
                    )}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <button className="btn-sm" onClick={() => openEdit(v)}>Edit</button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td className="p-3 text-slate-400" colSpan={5}>No vehicles yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal
          open={show}
          onClose={() => {
            setShow(false);
            setVehEdit(null);
          }}
          title="Vehicle"
          footer={
            <>
              <button className="btn-ghost" onClick={() => { setShow(false); setVehEdit(null); }}>
                Cancel
              </button>
              <button className="btn" onClick={saveVehicle}>Save Vehicle</button>
            </>
          }
        >
          {vehEdit && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Inp placeholder="Year" value={vehEdit.year} onChange={(v)=>setVehEdit(p=>({...p, year:v}))}/>
              <Inp placeholder="Make" value={vehEdit.make} onChange={(v)=>setVehEdit(p=>({...p, make:v}))}/>
              <Inp placeholder="Model" value={vehEdit.model} onChange={(v)=>setVehEdit(p=>({...p, model:v}))}/>
              <Inp placeholder="VIN" value={vehEdit.vin} onChange={(v)=>setVehEdit(p=>({...p, vin:v}))}/>
              <Inp placeholder="Color" value={vehEdit.color} onChange={(v)=>setVehEdit(p=>({...p, color:v}))}/>
              <Inp placeholder="License Plate" value={vehEdit.plate} onChange={(v)=>setVehEdit(p=>({...p, plate:v}))}/>
              <Inp
                placeholder="Odometer"
                inputMode="numeric"
                value={vehEdit.currentOdometer}
                onChange={(v)=>setVehEdit(p=>({...p, currentOdometer: v.replace(/\D/g,"")}))}
              />
              <Sel value={vehEdit.status} onChange={(v)=>setVehEdit(p=>({...p, status:v}))}>
                <option value="available">available</option>
                <option value="out">out</option>
                <option value="service">service</option>
              </Sel>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  /* ---------- Customers ---------- */
  function Customers() {
    const [show, setShow] = useState(false);

    function openNew() {
      setCustEdit({
        id: "",
        name: "",
        email: "",
        phone: "",
        licenseNumber: "",
        address: "",
        insurance: { carrier: "", policyNumber: "", expiresAt: "" },
        documents: { driverLicenseUrl: "", insuranceCardUrl: "" },
      });
      setShow(true);
    }
    function openEdit(c) {
      setCustEdit({
        ...c,
        insurance: { carrier: c.insurance?.carrier || "", policyNumber: c.insurance?.policyNumber || "", expiresAt: c.insurance?.expiresAt || "" },
        documents: { driverLicenseUrl: c.documents?.driverLicenseUrl || "", insuranceCardUrl: c.documents?.insuranceCardUrl || "" }
      });
      setShow(true);
    }

    async function saveCustomer() {
      await apiPut("/customers", custEdit);
      const c = await apiGet("/customers");
      setCustomers(c);
      setShow(false);
      setCustEdit(null);
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Customers</h2>
          <button className="btn" onClick={openNew}>+ Add Customer</button>
        </div>

        <div className="rounded border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Phone</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">License</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-slate-800">
                  <td className="p-2">{c.name}</td>
                  <td className="p-2">{c.phone}</td>
                  <td className="p-2">{c.email}</td>
                  <td className="p-2">{c.licenseNumber}</td>
                  <td className="p-2">
                    <button className="btn-sm" onClick={() => openEdit(c)}>Edit</button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td className="p-3 text-slate-400" colSpan={5}>No customers yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal
          open={show}
          onClose={() => { setShow(false); setCustEdit(null); }}
          title="Customer"
          footer={
            <>
              <button className="btn-ghost" onClick={() => { setShow(false); setCustEdit(null); }}>
                Cancel
              </button>
              <button className="btn" onClick={saveCustomer}>Save Customer</button>
            </>
          }
        >
          {custEdit && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Inp placeholder="Full name" value={custEdit.name} onChange={(v)=>setCustEdit(p=>({...p, name:v}))}/>
              <Inp placeholder="Phone" value={custEdit.phone} onChange={(v)=>setCustEdit(p=>({...p, phone:v}))}/>
              <Inp placeholder="Email" value={custEdit.email} onChange={(v)=>setCustEdit(p=>({...p, email:v}))}/>
              <Inp placeholder="Driver License #" value={custEdit.licenseNumber} onChange={(v)=>setCustEdit(p=>({...p, licenseNumber:v}))}/>
              <Inp placeholder="Address" value={custEdit.address} onChange={(v)=>setCustEdit(p=>({...p, address:v}))}/>

              <div className="md:col-span-2 border-t border-slate-800 pt-3 text-sm text-slate-400">Insurance</div>
              <Inp placeholder="Carrier" value={custEdit.insurance?.carrier} onChange={(v)=>setCustEdit(p=>({...p, insurance:{...p.insurance, carrier:v}}))}/>
              <Inp placeholder="Policy #" value={custEdit.insurance?.policyNumber} onChange={(v)=>setCustEdit(p=>({...p, insurance:{...p.insurance, policyNumber:v}}))}/>
              <Inp placeholder="Expiry (YYYY-MM-DD)" value={custEdit.insurance?.expiresAt} onChange={(v)=>setCustEdit(p=>({...p, insurance:{...p.insurance, expiresAt:v}}))}/>

              <div className="md:col-span-2 border-t border-slate-800 pt-3 text-sm text-slate-400">Documents (URLs for now)</div>
              <Inp placeholder="Driver License Image URL" value={custEdit.documents?.driverLicenseUrl} onChange={(v)=>setCustEdit(p=>({...p, documents:{...p.documents, driverLicenseUrl:v}}))}/>
              <Inp placeholder="Insurance Card Image URL" value={custEdit.documents?.insuranceCardUrl} onChange={(v)=>setCustEdit(p=>({...p, documents:{...p.documents, insuranceCardUrl:v}}))}/>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  /* ---------- Bookings (create-only demo) ---------- */
  function Bookings() {
    const [show, setShow] = useState(false);

    function openNew() {
      setBookEdit({
        customerId: "",
        vehicleId: "",
        start: "",
        end: "",
        price: "",
        status: "reserved",
      });
      setShow(true);
    }

    const customerOptions = customers.map((c) => ({
      value: c.id,
      label: `${c.name} — ${c.phone}`,
    }));
    const vehicleOptions = vehicles.map((v) => ({
      value: v.id,
      label: `${v.year} ${v.make} ${v.model} • ${v.plate}`,
    }));

    const priceNum = Number(bookEdit?.price || 0);
    const tax = Math.round(priceNum * TAX_RATE * 100) / 100;
    const total = Math.round((priceNum + tax) * 100) / 100;

    async function saveBooking() {
      await apiPost("/bookings", {
        ...bookEdit,
        price: priceNum,
        tax,
        total,
      });
      const b = await apiGet("/bookings");
      setBookings(b);
      setShow(false);
      setBookEdit(null);
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Bookings</h2>
          <button className="btn" onClick={openNew}>+ New Booking</button>
        </div>

        <div className="rounded border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Vehicle</th>
                <th className="p-2 text-left">Start</th>
                <th className="p-2 text-left">End</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="p-2">{b.customer?.name}</td>
                  <td className="p-2">{b.vehicle?.name}</td>
                  <td className="p-2">{new Date(b.start).toLocaleString()}</td>
                  <td className="p-2">{new Date(b.end).toLocaleString()}</td>
                  <td className="p-2">
                    <span className="rounded bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-300">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td className="p-3 text-slate-400" colSpan={5}>No bookings yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal
          open={show}
          onClose={() => { setShow(false); setBookEdit(null); }}
          title="Create Booking"
          footer={
            <>
              <button className="btn-ghost" onClick={() => { setShow(false); setBookEdit(null); }}>
                Cancel
              </button>
              <button className="btn" onClick={saveBooking}>Save Booking</button>
            </>
          }
        >
          {bookEdit && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs mb-1 text-slate-400">Customer</div>
                <SearchableSelect
                  options={customerOptions}
                  value={bookEdit.customerId}
                  onChange={(id) => setBookEdit((p) => ({ ...p, customerId: id }))}
                />
              </div>
              <div>
                <div className="text-xs mb-1 text-slate-400">Vehicle</div>
                <SearchableSelect
                  options={vehicleOptions}
                  value={bookEdit.vehicleId}
                  onChange={(id) => setBookEdit((p) => ({ ...p, vehicleId: id }))}
                />
              </div>
              <Inp
                placeholder="Start (YYYY-MM-DD HH:mm)"
                value={bookEdit.start}
                onChange={(v) => setBookEdit((p) => ({ ...p, start: v }))}
              />
              <Inp
                placeholder="End (YYYY-MM-DD HH:mm)"
                value={bookEdit.end}
                onChange={(v) => setBookEdit((p) => ({ ...p, end: v }))}
              />
              <Inp
                placeholder="Price (base)"
                inputMode="decimal"
                value={bookEdit.price}
                onChange={(v) =>
                  setBookEdit((p) => ({ ...p, price: v.replace(/[^\d.]/g, "") }))
                }
              />
              <div className="grid grid-cols-2 gap-3">
                <Tile label={`Tax (${Math.round(TAX_RATE * 100)}%)`} value={`$${tax.toFixed(2)}`} />
                <Tile label="Total" value={`$${total.toFixed(2)}`} />
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  /* ---------- Finances (placeholder) ---------- */
  function Finances() {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Finances</h2>
        <div className="text-slate-400 text-sm">
          Coming soon: payouts, invoices, expense tracking and reports.
        </div>
      </div>
    );
  }

  /* ---------- Shell ---------- */
  const tabs = [
    ["dashboard", "Dashboard"],
    ["calendar", "Calendar"],
    ["bookings", "Bookings"],
    ["customers", "Customers"],
    ["vehicles", "Vehicles"],
    ["finances", "Finances"],
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-emerald-300 font-semibold">K.V. Rentals • Team Dashboard</div>
          <span
            className={classNames(
              "rounded px-2 py-0.5 text-xs",
              online ? "bg-emerald-600/20 text-emerald-300" : "bg-rose-600/20 text-rose-300"
            )}
          >
            {online ? "Live" : "Offline"}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={classNames(
                "rounded px-3 py-1",
                tab === key ? "bg-emerald-600 text-white" : "bg-slate-800 hover:bg-slate-700"
              )}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <Dashboard />}
        {tab === "calendar" && <Calendar />}
        {tab === "bookings" && <Bookings />}
        {tab === "customers" && <Customers />}
        {tab === "vehicles" && <Vehicles />}
        {tab === "finances" && <Finances />}

        <div className="mt-10 text-xs opacity-60">
          © 2025 KV Rentals. All rights reserved.
        </div>
      </div>
    </div>
  );
}

/* =========================
   Tiny utility button styles
   ========================= */
const btnBase = "rounded px-3 py-1 border border-slate-700";
function Btn({ className = "", ...rest }) {
  return <button {...rest} className={classNames(btnBase, className)} />;
}

// convenience classes (Tailwind inlined for brevity)
const style = document.createElement("style");
style.innerHTML = `
.btn{${tw(`bg-emerald-600 hover:bg-emerald-500 text-white`)}}
.btn-ghost{${tw(`bg-slate-800 hover:bg-slate-700 text-slate-100`)}}
.btn-sm{${tw(`bg-slate-800 hover:bg-slate-700 text-slate-100 px-2 py-1 rounded`)}}`;
document.head.appendChild(style);

function tw(css) {
  // minimal CSS helper for quick styles; not a real Tailwind transform.
  return `
    background-color: initial;
  `;
}

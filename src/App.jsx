// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./index.css";

/* ================== API HELPERS ================== */
const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${path} → ${res.status}`);
  return res.json();
}
const get  = (p) => api(p);
const send = (p, m, body) =>
  api(p, {
    method: m,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
const del  = (p) => api(p, { method: "DELETE" });

/* ================== SMALL UI ================== */
const Pill = ({ tone = "default", children }) => {
  const map = {
    ok: "bg-green-700/30 text-green-200",
    warn: "bg-yellow-700/30 text-yellow-100",
    bad: "bg-red-700/30 text-red-100",
    default: "bg-slate-700/40 text-slate-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${map[tone]}`}>{children}</span>;
};
const Tile = ({ label, value }) => (
  <div className="bg-slate-900 border border-slate-700 rounded p-4">
    <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </div>
);

/** Plain input/select that pass the REAL event (what your code expects)
 *  and block bubbling so the modal never steals focus. */
function Inp({ className = "", value, onChange, ...rest }) {
  const stop = (e) => e.stopPropagation();
  return (
    <input
      {...rest}
      className={`w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
      value={value ?? ""}
      onChange={onChange}         // event → your handlers use e.target.value
      autoComplete="off"
      onMouseDown={stop}
      onClick={stop}
      onKeyDown={stop}
      onKeyUp={stop}
    />
  );
}
function Sel({ className = "", value, onChange, children, ...rest }) {
  const stop = (e) => e.stopPropagation();
  return (
    <select
      {...rest}
      className={`w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
      value={value ?? ""}
      onChange={onChange}         // event
      onMouseDown={stop}
      onClick={stop}
      onKeyDown={stop}
      onKeyUp={stop}
    >
      {children}
    </select>
  );
}

/* ================== VEHICLES ================== */
const Vehicles = () => {
  // Local modal state separate from the table list
  const [vehForm, setVehForm] = React.useState(null); // local buffer for typing

  // Open editor for an existing vehicle
  function openRow(v) {
    if (!v) return;
    setVehEdit(v);
    setVehForm({
      ...v,
      currentOdometerText:
        v.currentOdometer !== undefined && v.currentOdometer !== null
          ? String(v.currentOdometer)
          : "",
    });
  }

  // Open blank "Add Vehicle"
  function openNew() {
    const blank = {
      id: undefined,
      year: "",
      make: "",
      model: "",
      vin: "",
      color: "",
      plate: "",
      status: "available",
      currentOdometer: "",
    };
    setVehEdit(blank);
    setVehForm({ ...blank, currentOdometerText: "" });
  }

  // Keep vehForm in sync if vehEdit changes externally
  React.useEffect(() => {
    if (!vehEdit) { setVehForm(null); return; }
    setVehForm({
      ...vehEdit,
      currentOdometerText:
        vehEdit.currentOdometer !== undefined && vehEdit.currentOdometer !== null
          ? String(vehEdit.currentOdometer)
          : "",
    });
  }, [vehEdit]);

  async function saveVehicle() {
    if (!vehForm) return;

    const odo = Number((vehForm.currentOdometerText || "").replace(/\D/g, "") || 0);

    const payload = {
      id: vehForm.id,
      year: vehForm.year?.trim() || "",
      make: vehForm.make?.trim() || "",
      model: vehForm.model?.trim() || "",
      vin: vehForm.vin?.trim() || "",
      color: vehForm.color?.trim() || "",
      plate: vehForm.plate?.trim() || "",
      status: vehForm.status || "available",
      currentOdometer: odo,
    };

    try {
      if (payload.id) {
        await send(`/vehicles/${payload.id}`, "PUT", payload);
        setVehicles(prev => prev.map(x => (x.id === payload.id ? payload : x)));
      } else {
        const created = await send(`/vehicles`, "POST", payload);
        const withId = created?.id ? created : { ...payload, id: `veh_${Date.now()}` };
        setVehicles(prev => [withId, ...prev]);
      }
    } catch {}

    setVehEdit(null);
  }

  const remove = async (id, e) => {
    e?.stopPropagation?.();
    try { await del(`/vehicles/${id}`); } catch {}
    setVehicles(prev => prev.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Vehicles</h2>
        <button className="btn" onClick={openNew}>+ Add Vehicle</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="py-2 pr-4">Vehicle</th>
              <th className="py-2 pr-4">Plate</th>
              <th className="py-2 pr-4">Odometer</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr
                key={v.id}
                className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer"
                onClick={() => openRow(v)}
              >
                <td className="py-2 pr-4 whitespace-nowrap">
                  {v.year ? `${v.year} ` : ""}{v.make || ""} {v.model || ""}
                </td>
                <td className="py-2 pr-4">{v.plate || "-"}</td>
                <td className="py-2 pr-4">{v.currentOdometer ?? 0}</td>
                <td className="py-2 pr-4">
                  {v.status === "available" ? <Pill tone="ok">available</Pill> :
                   v.status === "out"       ? <Pill tone="warn">out</Pill> :
                                               <Pill>service</Pill>}
                </td>
                <td className="py-2 pr-2 text-right">
                  <button className="btn-xs mr-2" onClick={(e) => { e.stopPropagation(); openRow(v); }}>✏️</button>
                  <button className="btn-xs" onClick={(e) => remove(v.id, e)}>🗑️</button>
                </td>
              </tr>
            ))}
            {!vehicles.length && (
              <tr>
                <td className="py-6 text-slate-400" colSpan={5}>
                  No vehicles yet. Click <b>+ Add Vehicle</b> to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!vehEdit}
        onClose={() => setVehEdit(null)}
        title={vehEdit?.id ? "Edit Vehicle" : "Add Vehicle"}
        footer={
          <>
            <button className="btn" onClick={() => setVehEdit(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveVehicle}>Save Vehicle</button>
          </>
        }
      >
        {vehForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Inp placeholder="Year"          value={vehForm.year}  onChange={v => setVehForm(f => ({ ...f, year: v }))} />
            <Inp placeholder="Make"          value={vehForm.make}  onChange={v => setVehForm(f => ({ ...f, make: v }))} />
            <Inp placeholder="Model"         value={vehForm.model} onChange={v => setVehForm(f => ({ ...f, model: v }))} />
            <Inp placeholder="VIN"           value={vehForm.vin}   onChange={v => setVehForm(f => ({ ...f, vin: v }))} />
            <Inp placeholder="Color"         value={vehForm.color} onChange={v => setVehForm(f => ({ ...f, color: v }))} />
            <Inp placeholder="License Plate" value={vehForm.plate} onChange={v => setVehForm(f => ({ ...f, plate: v }))} />

            <Inp
              placeholder="Odometer"
              inputMode="numeric"
              value={vehForm.currentOdometerText}
              onChange={(val) => {
                const digits = String(val || "").replace(/\D/g, "");
                setVehForm(f => ({ ...f, currentOdometerText: digits }));
              }}
            />

            <Sel
              value={vehForm.status}
              onChange={(val) => setVehForm(f => ({ ...f, status: val }))}
            >
              <option value="available">available</option>
              <option value="out">out</option>
              <option value="service">service</option>
            </Sel>
          </div>
        )}
      </Modal>
    </div>
  );
};

/** Simple searchable list (type to filter, click to choose) */
function SearchableSelect({ options, value, onChange, placeholder = "Type to search…" }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => (options || []).filter((o) => String(o.label || "").toLowerCase().includes(q.toLowerCase())),
    [options, q]
  );
  return (
    <div className="flex flex-col gap-1">
      <Inp placeholder={placeholder} value={q} onChange={(e)=>setQ(e.target.value)} />
      <div className="max-h-40 overflow-auto border border-slate-700 rounded">
        {(filtered.length ? filtered : [{ value: "", label: "No matches" }]).map((o, i) => (
          <button
            key={`${o.value}-${i}`}
            type="button"
            className={`w-full text-left px-3 py-2 hover:bg-slate-800 ${value===o.value ? "bg-slate-800": ""}`}
            onClick={() => o.value && onChange?.(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================== APP ================== */
const TABS = ["Dashboard", "Calendar", "Bookings", "Customers", "Vehicles", "Finances"];

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [online, setOnline] = useState(false);
  const [summary, setSummary] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [vehEdit, setVehEdit] = useState(null);
  const [custEdit, setCustEdit] = useState(null);

  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [bookingDraft, setBookingDraft] = useState({ customerId:"", vehicleId:"", start:"", end:"", price:"", notes:"" });

  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    (async () => {
      try { const h = await get("/health"); setOnline(Boolean(h.ok)); } catch { setOnline(false); }
      try { setSummary(await get("/stats/summary")); } catch {}
      try { setVehicles(await get("/vehicles")); } catch {}
      try { setCustomers(await get("/customers")); } catch {}
      try { setBookings(await get("/bookings")); } catch {}
    })();
  }, []);

  /* -------- DASHBOARD -------- */
  const Dashboard = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">K.V. Rentals • Team Dashboard</h2>
        {online ? <Pill tone="ok">Live</Pill> : <Pill tone="bad">Offline</Pill>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Tile label="Total Bookings" value={summary?.bookingsTotal ?? bookings.length} />
        <Tile label="Active Rentals" value={summary?.activeRentals ?? bookings.filter(b=>b.status==="active").length} />
        <Tile label="Vehicles" value={summary?.vehicles ?? vehicles.length} />
        <Tile
          label="Revenue"
          value={`$${(
            summary?.revenue ??
            bookings.filter(b=>b.status==="completed" && typeof b.total==="number").reduce((s,b)=>s+b.total,0)
          ).toLocaleString()}`}
        />
      </div>
      <div className="text-xs opacity-60">API: <code>{API || "(not set)"}</code></div>
    </div>
  );

  /* -------- CALENDAR -------- */
  const Calendar = () => {
    const today = new Date();
    const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const y = cursor.getFullYear(), m = cursor.getMonth();

    const firstDow = new Date(y,m,1).getDay();
    const daysInMonth = new Date(y,m+1,0).getDate();
    const cells = [];
    for (let i=0;i<firstDow;i++) cells.push(null);
    for (let d=1; d<=daysInMonth; d++) cells.push(new Date(y,m,d));

    const toKey = (d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const marks = new Map();
    (bookings||[]).forEach(b=>{
      const s = new Date(b.start ?? b.startDate);
      const e = new Date(b.end ?? b.endDate);
      if (!isNaN(s)) { const k=toKey(s); const m=marks.get(k)||{p:[],r:[],o:[]}; m.p.push(b); marks.set(k,m); }
      if (!isNaN(e)) { const k=toKey(e); const m=marks.get(k)||{p:[],r:[],o:[]}; m.r.push(b); marks.set(k,m); }
      if (!isNaN(s) && !isNaN(e)) {
        const a = s<e ? s : e, z = s<e ? e : s;
        const w = new Date(a.getFullYear(), a.getMonth(), a.getDate()+1);
        while (w < new Date(z.getFullYear(), z.getMonth(), z.getDate())) {
          const kk = toKey(w); const m2 = marks.get(kk)||{p:[],r:[],o:[]};
          m2.o.push(b); marks.set(kk,m2); w.setDate(w.getDate()+1);
        }
      }
    });

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <div className="flex gap-2">
            <button className="btn" onClick={()=>setCursor(new Date(y,m-1,1))}>‹ Prev</button>
            <div className="px-3 py-1 rounded bg-slate-800">{cursor.toLocaleString(undefined,{month:"long",year:"numeric"})}</div>
            <button className="btn" onClick={()=>setCursor(new Date(y,m+1,1))}>Next ›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs opacity-70">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((dt,idx)=>{
            const k = dt ? toKey(dt) : null;
            const mm = k ? (marks.get(k) || {p:[],r:[],o:[]}) : null;
            return (
              <div key={idx} className={`h-24 border border-slate-700 rounded p-1 relative ${dt?"":"bg-slate-900/30"}`}>
                {dt && <div className="opacity-70 text-right text-[10px]">{dt.getDate()}</div>}
                {dt && mm && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-1 flex gap-1">
                    {mm.p.length>0 && <div className="h-2 w-2 rounded-full bg-green-400" title="Pickup"/>}
                    {mm.r.length>0 && <div className="h-2 w-2 rounded-full bg-red-400" title="Return"/>}
                    {mm.o.length>0 && <div className="h-2 w-2 rounded-full bg-blue-400" title="Ongoing"/>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs opacity-70">
          <div className="h-2 w-2 rounded-full bg-green-400" /> Pickup
          <div className="h-2 w-2 rounded-full bg-red-400" /> Return
          <div className="h-2 w-2 rounded-full bg-blue-400" /> Ongoing
        </div>
      </div>
    );
  };

 /* ================== BOOKINGS (with tax) ================== */
const Bookings = () => {
  const TAX_RATE = 0.08; // 8%

  // Local typing buffer just for the price field
  const [priceText, setPriceText] = React.useState("");

  // Reset the price buffer whenever the dialog opens
  React.useEffect(() => {
    if (newBookingOpen) {
      setPriceText(String(bookingDraft.price ?? ""));
    }
  }, [newBookingOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // options for searchable selects
  const custOptions = customers.map(c => ({ label: `${c.name} — ${c.phone || ""}`, value: c.id }));
  const vehOptions  = vehicles.map(v => ({ label: `${v.year || ""} ${v.make || ""} ${v.model || ""} • ${v.plate || ""}`, value: v.id }));

  const setDraft = (patch) => setBookingDraft(d => ({ ...d, ...patch }));

  // Totals are calculated from the *buffer*, so typing stays smooth
  const subtotal = Number(priceText || 0);
  const tax      = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total    = Math.round((subtotal + tax) * 100) / 100;

  async function saveBooking() {
    const body = {
      customerId: bookingDraft.customerId,
      vehicleId:  bookingDraft.vehicleId,
      startDate:  bookingDraft.start || bookingDraft.startDate,
      endDate:    bookingDraft.end   || bookingDraft.endDate,
      price:      subtotal,   // numeric
      taxRate:    TAX_RATE,
      tax,
      total,
      notes:      bookingDraft.notes || "",
    };
    try {
      await send("/bookings", "POST", body);
      setBookings(await get("/bookings"));
      setVehicles(await get("/vehicles"));
      setSummary(await get("/stats/summary").catch(() => summary));
    } catch {}
    setNewBookingOpen(false);
    setBookingDraft({ customerId:"", vehicleId:"", start:"", end:"", price:"", notes:"" });
  }

  async function mark(id, status) {
    try {
      await send(`/bookings/${id}`, "PUT", { status });
      setBookings(await get("/bookings"));
      setVehicles(await get("/vehicles"));
      setSummary(await get("/stats/summary").catch(() => summary));
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bookings</h2>
        <button className="btn" onClick={() => setNewBookingOpen(true)}>+ New Booking</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Vehicle</th>
              <th className="py-2 pr-4">Start</th>
              <th className="py-2 pr-4">End</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => {
              const c = customers.find(x => x.id === b.customerId);
              const v = vehicles.find(x => x.id === b.vehicleId);
              return (
                <tr key={b.id} className="border-b border-slate-800">
                  <td className="py-2 pr-4">{c?.name || b.customer || b.customerId}</td>
                  <td className="py-2 pr-4">
                    {v ? `${v.year || ""} ${v.make || ""} ${v.model || ""} • ${v.plate || ""}` : (b.vehicle || b.vehicleId)}
                  </td>
                  <td className="py-2 pr-4">{new Date(b.start ?? b.startDate).toLocaleString()}</td>
                  <td className="py-2 pr-4">{new Date(b.end ?? b.endDate).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    {b.status === "active"    ? <Pill tone="warn">active</Pill> :
                     b.status === "completed" ? <Pill tone="ok">completed</Pill> :
                                                <Pill>canceled</Pill>}
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <button className="btn-xs mr-2" onClick={() => mark(b.id, "active")}>Start</button>
                    <button className="btn-xs mr-2" onClick={() => mark(b.id, "completed")}>Complete</button>
                    <button className="btn-xs" onClick={() => mark(b.id, "canceled")}>Cancel</button>
                  </td>
                </tr>
              );
            })}
            {!bookings.length && (
              <tr><td className="py-6 text-slate-400" colSpan={6}>No bookings yet. Click <b>+ New Booking</b> to create one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
        title="Create Booking"
        footer={
          <>
            <button className="btn" onClick={() => setNewBookingOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveBooking}>Save Booking</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs mb-1 opacity-70">Customer</div>
            <SearchableSelect
              options={custOptions}
              value={bookingDraft.customerId}
              onChange={(val) => setDraft({ customerId: val })}
            />
          </div>
          <div>
            <div className="text-xs mb-1 opacity-70">Vehicle</div>
            <SearchableSelect
              options={vehOptions}
              value={bookingDraft.vehicleId}
              onChange={(val) => setDraft({ vehicleId: val })}
            />
          </div>
          <div>
            <div className="text-xs mb-1 opacity-70">Start</div>
            <Inp type="datetime-local" value={bookingDraft.start || ""} onChange={(e) => setDraft({ start: e.target.value })}/>
          </div>
          <div>
            <div className="text-xs mb-1 opacity-70">End</div>
            <Inp type="datetime-local" value={bookingDraft.end || ""} onChange={(e) => setDraft({ end: e.target.value })}/>
          </div>

          <div>
            <div className="text-xs mb-1 opacity-70">Price (base)</div>
            <Inp
              inputMode="decimal"
              value={priceText}
              onChange={(e) => {
                const cleaned = (e.target.value || "")
                  .replace(/[^\d.]/g, "")          // keep digits + one dot
                  .replace(/(\..*)\./g, "$1");     // prevent two dots
                setPriceText(cleaned);
                setDraft({ price: cleaned });
              }}
              placeholder="e.g. 100"
            />
          </div>

          {/* Subtotal / Tax / Total */}
          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <div className="px-3 py-2 rounded bg-slate-900 border border-slate-700 flex items-center justify-between">
              <span className="text-xs opacity-70">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="px-3 py-2 rounded bg-slate-900 border border-slate-700 flex items-center justify-between">
              <span className="text-xs opacity-70">Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="px-3 py-2 rounded bg-slate-900 border border-slate-700 flex items-center justify-between col-span-2">
              <span className="text-xs opacity-70">Total</span>
              <span className="text-lg font-semibold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

  /* -------- CUSTOMERS -------- */
  const Customers = () => {
    const [filter, setFilter] = useState("");
    const openRow = (c) => { if (custEdit) return; setCustEdit({ ...c }); };

    async function saveCustomer() {
      const cleaned = {
        ...custEdit,
        phone: (custEdit.phone || "").replace(/\D/g, "").slice(0, 15),
        insurance: { carrier: custEdit.insurance?.carrier || "", policyNumber: custEdit.insurance?.policyNumber || "", expiresAt: custEdit.insurance?.expiresAt || "" },
        documents: { driverLicenseUrl: custEdit.documents?.driverLicenseUrl || "", insuranceCardUrl: custEdit.documents?.insuranceCardUrl || "" },
      };
      try {
        if (cleaned.id) {
          await send(`/customers/${cleaned.id}`, "PUT", cleaned);
          setCustomers((prev)=>prev.map(x=>x.id===cleaned.id?cleaned:x));
        } else {
          const created = await send(`/customers`, "POST", cleaned);
          setCustomers((prev)=>[{...(created||cleaned), id: created?.id || `cust_${Date.now()}`}, ...prev]);
        }
      } catch {}
      setCustEdit(null);
    }
    const remove = async (id, e) => { e?.stopPropagation?.(); try { await del(`/customers/${id}`); } catch {}; setCustomers(prev=>prev.filter(x=>x.id!==id)); };

    const visible = useMemo(()=> {
      if (!filter) return customers;
      const q = filter.toLowerCase();
      return customers.filter(c =>
        [c.name,c.email,c.phone,c.licenseNumber,c.address]
          .filter(Boolean)
          .some(v=>String(v).toLowerCase().includes(q))
      );
    },[customers,filter]);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Customers</h2>
          <div className="flex items-center gap-2">
            <Inp placeholder="Search…" value={filter} onChange={(e)=>setFilter(e.target.value)} />
            <button className="btn" onClick={()=>setCustEdit({ id:undefined, name:"", email:"", phone:"", licenseNumber:"", address:"", insurance:{carrier:"",policyNumber:"",expiresAt:""}, documents:{driverLicenseUrl:"", insuranceCardUrl:""} })}>
              + Add Customer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">License #</th>
                <th className="py-2 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c)=>(
                <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer" onClick={()=>openRow(c)}>
                  <td className="py-2 pr-4 whitespace-nowrap">{c.name || "-"}</td>
                  <td className="py-2 pr-4">{c.phone || "-"}</td>
                  <td className="py-2 pr-4">{c.email || "-"}</td>
                  <td className="py-2 pr-4">{c.licenseNumber || "-"}</td>
                  <td className="py-2 pr-2 text-right">
                    <button className="btn-xs mr-2" onClick={(e)=>{ e.stopPropagation(); openRow(c); }}>✏️</button>
                    <button className="btn-xs" onClick={(e)=>remove(c.id, e)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {!visible.length && (<tr><td className="py-6 text-slate-400" colSpan={5}>No customers. Click <b>+ Add Customer</b>.</td></tr>)}
            </tbody>
          </table>
        </div>

        <Modal
          open={!!custEdit}
          onClose={()=>setCustEdit(null)}
          title={custEdit?.id ? "Edit Customer" : "Add Customer"}
          footer={
            <>
              <button className="btn" onClick={()=>setCustEdit(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveCustomer}>Save Customer</button>
            </>
          }
        >
          {custEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Inp placeholder="Full Name" value={custEdit.name ?? ""} onChange={(e)=>setCustEdit(x=>({...x, name:e.target.value}))}/>
              <Inp placeholder="Email" value={custEdit.email ?? ""} onChange={(e)=>setCustEdit(x=>({...x, email:e.target.value}))}/>
              <Inp placeholder="Phone" inputMode="tel" value={custEdit.phone ?? ""} onChange={(e)=>setCustEdit(x=>({...x, phone:(e.target.value||"").replace(/\D/g,"").slice(0,15)}))}/>
              <Inp placeholder="Driver License Number" value={custEdit.licenseNumber ?? ""} onChange={(e)=>setCustEdit(x=>({...x, licenseNumber:e.target.value}))}/>
              <Inp placeholder="Address" value={custEdit.address ?? ""} onChange={(e)=>setCustEdit(x=>({...x, address:e.target.value}))} className="md:col-span-2"/>

              <div className="md:col-span-2 pt-2 text-slate-300">Insurance</div>
              <Inp placeholder="Carrier" value={custEdit.insurance?.carrier ?? ""} onChange={(e)=>setCustEdit(x=>({...x, insurance:{...(x.insurance||{}), carrier:e.target.value}}))}/>
              <Inp placeholder="Policy Number" value={custEdit.insurance?.policyNumber ?? ""} onChange={(e)=>setCustEdit(x=>({...x, insurance:{...(x.insurance||{}), policyNumber:e.target.value}}))}/>
              <Inp placeholder="Policy Expiration" type="date" value={custEdit.insurance?.expiresAt ?? ""} onChange={(e)=>setCustEdit(x=>({...x, insurance:{...(x.insurance||{}), expiresAt:e.target.value}}))}/>

              <div className="md:col-span-2 pt-2 text-slate-300">Documents (URLs for now)</div>
              <Inp placeholder="Driver License Image URL" value={custEdit.documents?.driverLicenseUrl ?? ""} onChange={(e)=>setCustEdit(x=>({...x, documents:{...(x.documents||{}), driverLicenseUrl:e.target.value}}))} className="md:col-span-2"/>
              <Inp placeholder="Insurance Card Image URL" value={custEdit.documents?.insuranceCardUrl ?? ""} onChange={(e)=>setCustEdit(x=>({...x, documents:{...(x.documents||{}), insuranceCardUrl:e.target.value}}))} className="md:col-span-2"/>
            </div>
          )}
        </Modal>
      </div>
    );
  };

  // src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import "./index.css";

/* ================== API HELPERS ================== */
const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
async function api(path, opts = {}) {
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) throw new Error(`${opts.method || "GET"} ${path} → ${res.status}`);
  return res.json();
}
const get  = (p) => api(p);
const send = (p, m, body) =>
  api(p, {
    method: m,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
const del  = (p) => api(p, { method: "DELETE" });

/* ================== SMALL UI ================== */
const Pill = ({ tone = "default", children }) => {
  const map = {
    ok: "bg-green-700/30 text-green-200",
    warn: "bg-yellow-700/30 text-yellow-100",
    bad: "bg-red-700/30 text-red-100",
    default: "bg-slate-700/40 text-slate-200",
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${map[tone]}`}>{children}</span>;
};
const Tile = ({ label, value }) => (
  <div className="bg-slate-900 border border-slate-700 rounded p-4">
    <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </div>
);

/** Plain input/select that pass the REAL event (what your code expects)
 *  and block bubbling so the modal never steals focus. */
function Inp({ className = "", value, onChange, ...rest }) {
  const stop = (e) => e.stopPropagation();
  return (
    <input
      {...rest}
      className={`w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
      value={value ?? ""}
      onChange={onChange}         // event → your handlers use e.target.value
      autoComplete="off"
      onMouseDown={stop}
      onClick={stop}
      onKeyDown={stop}
      onKeyUp={stop}
    />
  );
}
function Sel({ className = "", value, onChange, children, ...rest }) {
  const stop = (e) => e.stopPropagation();
  return (
    <select
      {...rest}
      className={`w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 ${className}`}
      value={value ?? ""}
      onChange={onChange}         // event
      onMouseDown={stop}
      onClick={stop}
      onKeyDown={stop}
      onKeyUp={stop}
    >
      {children}
    </select>
  );
}

/** Portal Modal (renders under document.body) so table rows/backdrop
 *  can’t steal focus. Backdrop does NOT auto-close; only X/Esc/Cancel. */
function Modal({ open = false, onClose, title, width = 760, children, footer }) {
  if (!open) return null;
  const modalEl = (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center select-none"
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => { if (e.key === "Escape") onClose?.(); }}
    >
      <div
        className="rounded bg-slate-900 border border-slate-700 shadow-xl w-full"
        style={{ maxWidth: width, width: "95vw" }}
        onMouseDown={(e) => e.stopPropagation()} // keep all clicks inside
        onClick={(e) => e.stopPropagation()}
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
        {footer && (
          <div className="p-4 border-t border-slate-800 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
  return createPortal(modalEl, document.body);
}

/** Simple searchable list (type to filter, click to choose) */
function SearchableSelect({ options, value, onChange, placeholder = "Type to search…" }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => (options || []).filter((o) => String(o.label || "").toLowerCase().includes(q.toLowerCase())),
    [options, q]
  );
  return (
    <div className="flex flex-col gap-1">
      <Inp placeholder={placeholder} value={q} onChange={(e)=>setQ(e.target.value)} />
      <div className="max-h-40 overflow-auto border border-slate-700 rounded">
        {(filtered.length ? filtered : [{ value: "", label: "No matches" }]).map((o, i) => (
          <button
            key={`${o.value}-${i}`}
            type="button"
            className={`w-full text-left px-3 py-2 hover:bg-slate-800 ${value===o.value ? "bg-slate-800": ""}`}
            onClick={() => o.value && onChange?.(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ================== APP ================== */
const TABS = ["Dashboard", "Calendar", "Bookings", "Customers", "Vehicles", "Finances"];

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [online, setOnline] = useState(false);
  const [summary, setSummary] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [vehEdit, setVehEdit] = useState(null);
  const [custEdit, setCustEdit] = useState(null);

  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [bookingDraft, setBookingDraft] = useState({ customerId:"", vehicleId:"", start:"", end:"", price:"", notes:"" });

  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    (async () => {
      try { const h = await get("/health"); setOnline(Boolean(h.ok)); } catch { setOnline(false); }
      try { setSummary(await get("/stats/summary")); } catch {}
      try { setVehicles(await get("/vehicles")); } catch {}
      try { setCustomers(await get("/customers")); } catch {}
      try { setBookings(await get("/bookings")); } catch {}
    })();
  }, []);

  /* -------- DASHBOARD -------- */
  const Dashboard = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">K.V. Rentals • Team Dashboard</h2>
        {online ? <Pill tone="ok">Live</Pill> : <Pill tone="bad">Offline</Pill>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Tile label="Total Bookings" value={summary?.bookingsTotal ?? bookings.length} />
        <Tile label="Active Rentals" value={summary?.activeRentals ?? bookings.filter(b=>b.status==="active").length} />
        <Tile label="Vehicles" value={summary?.vehicles ?? vehicles.length} />
        <Tile
          label="Revenue"
          value={`$${(
            summary?.revenue ??
            bookings.filter(b=>b.status==="completed" && typeof b.total==="number").reduce((s,b)=>s+b.total,0)
          ).toLocaleString()}`}
        />
      </div>
      <div className="text-xs opacity-60">API: <code>{API || "(not set)"}</code></div>
    </div>
  );

  /* -------- CALENDAR -------- */
  const Calendar = () => {
    const today = new Date();
    const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const y = cursor.getFullYear(), m = cursor.getMonth();

    const firstDow = new Date(y,m,1).getDay();
    const daysInMonth = new Date(y,m+1,0).getDate();
    const cells = [];
    for (let i=0;i<firstDow;i++) cells.push(null);
    for (let d=1; d<=daysInMonth; d++) cells.push(new Date(y,m,d));

    const toKey = (d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const marks = new Map();
    (bookings||[]).forEach(b=>{
      const s = new Date(b.start ?? b.startDate);
      const e = new Date(b.end ?? b.endDate);
      if (!isNaN(s)) { const k=toKey(s); const m=marks.get(k)||{p:[],r:[],o:[]}; m.p.push(b); marks.set(k,m); }
      if (!isNaN(e)) { const k=toKey(e); const m=marks.get(k)||{p:[],r:[],o:[]}; m.r.push(b); marks.set(k,m); }
      if (!isNaN(s) && !isNaN(e)) {
        const a = s<e ? s : e, z = s<e ? e : s;
        const w = new Date(a.getFullYear(), a.getMonth(), a.getDate()+1);
        while (w < new Date(z.getFullYear(), z.getMonth(), z.getDate())) {
          const kk = toKey(w); const m2 = marks.get(kk)||{p:[],r:[],o:[]};
          m2.o.push(b); marks.set(kk,m2); w.setDate(w.getDate()+1);
        }
      }
    });

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <div className="flex gap-2">
            <button className="btn" onClick={()=>setCursor(new Date(y,m-1,1))}>‹ Prev</button>
            <div className="px-3 py-1 rounded bg-slate-800">{cursor.toLocaleString(undefined,{month:"long",year:"numeric"})}</div>
            <button className="btn" onClick={()=>setCursor(new Date(y,m+1,1))}>Next ›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs opacity-70">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((dt,idx)=>{
            const k = dt ? toKey(dt) : null;
            const mm = k ? (marks.get(k) || {p:[],r:[],o:[]}) : null;
            return (
              <div key={idx} className={`h-24 border border-slate-700 rounded p-1 relative ${dt?"":"bg-slate-900/30"}`}>
                {dt && <div className="opacity-70 text-right text-[10px]">{dt.getDate()}</div>}
                {dt && mm && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-1 flex gap-1">
                    {mm.p.length>0 && <div className="h-2 w-2 rounded-full bg-green-400" title="Pickup"/>}
                    {mm.r.length>0 && <div className="h-2 w-2 rounded-full bg-red-400" title="Return"/>}
                    {mm.o.length>0 && <div className="h-2 w-2 rounded-full bg-blue-400" title="Ongoing"/>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-xs opacity-70">
          <div className="h-2 w-2 rounded-full bg-green-400" /> Pickup
          <div className="h-2 w-2 rounded-full bg-red-400" /> Return
          <div className="h-2 w-2 rounded-full bg-blue-400" /> Ongoing
        </div>
      </div>
    );
  };

  /* -------- VEHICLES -------- */
  const Vehicles = () => {
    const openRow = (v) => { if (vehEdit) return; setVehEdit({ ...v }); };

    async function saveVehicle() {
      // sanitize odometer
      const odoStr = `${vehEdit.currentOdometer ?? ""}`.replace(/\D/g,"");
      const cleaned = { ...vehEdit, currentOdometer: odoStr === "" ? 0 : Number(odoStr) };
      try {
        if (cleaned.id) {
          await send(`/vehicles/${cleaned.id}`, "PUT", cleaned);
          setVehicles((prev)=>prev.map(x=>x.id===cleaned.id?cleaned:x));
        } else {
          const created = await send(`/vehicles`, "POST", cleaned);
          setVehicles((prev)=>[{...(created||cleaned), id: created?.id || `veh_${Date.now()}`}, ...prev]);
        }
      } catch {}
      setVehEdit(null);
    }
    const remove = async (id, e) => { e?.stopPropagation?.(); try { await del(`/vehicles/${id}`); } catch {}; setVehicles(prev=>prev.filter(x=>x.id!==id)); };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Vehicles</h2>
          <button className="btn" onClick={()=>setVehEdit({ id:undefined, year:"", make:"", model:"", vin:"", color:"", plate:"", currentOdometer:"", status:"available" })}>
            + Add Vehicle
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Plate</th>
                <th className="py-2 pr-4">Odometer</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v)=>(
                <tr key={v.id} className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer" onClick={()=>openRow(v)}>
                  <td className="py-2 pr-4 whitespace-nowrap">{v.year?`${v.year} `:""}{v.make||""} {v.model||""}</td>
                  <td className="py-2 pr-4">{v.plate || "-"}</td>
                  <td className="py-2 pr-4">{v.currentOdometer ?? 0}</td>
                  <td className="py-2 pr-4">{v.status==="available"?<Pill tone="ok">available</Pill>:v.status==="out"?<Pill tone="warn">out</Pill>:<Pill>service</Pill>}</td>
                  <td className="py-2 pr-2 text-right">
                    <button className="btn-xs mr-2" onClick={(e)=>{ e.stopPropagation(); openRow(v); }}>✏️</button>
                    <button className="btn-xs" onClick={(e)=>remove(v.id, e)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {!vehicles.length && (
                <tr><td className="py-6 text-slate-400" colSpan={5}>No vehicles yet. Click <b>+ Add Vehicle</b>.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <Modal
          open={!!vehEdit}
          onClose={()=>setVehEdit(null)}
          title={vehEdit?.id ? "Edit Vehicle" : "Add Vehicle"}
          footer={
            <>
              <button className="btn" onClick={()=>setVehEdit(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveVehicle}>Save Vehicle</button>
            </>
          }
        >
          {vehEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Inp placeholder="Year" value={vehEdit.year ?? ""} onChange={(e)=>setVehEdit(x=>({...x, year:e.target.value}))}/>
              <Inp placeholder="Make" value={vehEdit.make ?? ""} onChange={(e)=>setVehEdit(x=>({...x, make:e.target.value}))}/>
              <Inp placeholder="Model" value={vehEdit.model ?? ""} onChange={(e)=>setVehEdit(x=>({...x, model:e.target.value}))}/>
              <Inp placeholder="VIN" value={vehEdit.vin ?? ""} onChange={(e)=>setVehEdit(x=>({...x, vin:e.target.value}))}/>
              <Inp placeholder="Color" value={vehEdit.color ?? ""} onChange={(e)=>setVehEdit(x=>({...x, color:e.target.value}))}/>
              <Inp placeholder="License Plate" value={vehEdit.plate ?? ""} onChange={(e)=>setVehEdit(x=>({...x, plate:e.target.value}))}/>
              <Inp
                placeholder="Odometer"
                inputMode="numeric"
                value={vehEdit.currentOdometer === 0 ? "0" : (vehEdit.currentOdometer ?? "")}
                onChange={(e)=>{ const digits = (e.target.value||"").replace(/\D/g,""); setVehEdit(x=>({...x, currentOdometer: digits==="" ? "" : Number(digits)})); }}
              />
              <Sel value={vehEdit.status ?? "available"} onChange={(e)=>setVehEdit(x=>({...x, status:e.target.value}))}>
                <option value="available">available</option>
                <option value="out">out</option>
                <option value="service">service</option>
              </Sel>
            </div>
          )}
        </Modal>
      </div>
    );
  };

  /* -------- CUSTOMERS -------- */
  const Customers = () => {
    const [filter, setFilter] = useState("");
    const openRow = (c) => { if (custEdit) return; setCustEdit({ ...c }); };

    async function saveCustomer() {
      const cleaned = {
        ...custEdit,
        phone: (custEdit.phone || "").replace(/\D/g, "").slice(0, 15),
        insurance: { carrier: custEdit.insurance?.carrier || "", policyNumber: custEdit.insurance?.policyNumber || "", expiresAt: custEdit.insurance?.expiresAt || "" },
        documents: { driverLicenseUrl: custEdit.documents?.driverLicenseUrl || "", insuranceCardUrl: custEdit.documents?.insuranceCardUrl || "" },
      };
      try {
        if (cleaned.id) {
          await send(`/customers/${cleaned.id}`, "PUT", cleaned);
          setCustomers((prev)=>prev.map(x=>x.id===cleaned.id?cleaned:x));
        } else {
          const created = await send(`/customers`, "POST", cleaned);
          setCustomers((prev)=>[{...(created||cleaned), id: created?.id || `cust_${Date.now()}`}, ...prev]);
        }
      } catch {}
      setCustEdit(null);
    }
    const remove = async (id, e) => { e?.stopPropagation?.(); try { await del(`/customers/${id}`); } catch {}; setCustomers(prev=>prev.filter(x=>x.id!==id)); };

    const visible = useMemo(()=> {
      if (!filter) return customers;
      const q = filter.toLowerCase();
      return customers.filter(c =>
        [c.name,c.email,c.phone,c.licenseNumber,c.address]
          .filter(Boolean)
          .some(v=>String(v).toLowerCase().includes(q))
      );
    },[customers,filter]);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Customers</h2>
          <div className="flex items-center gap-2">
            <Inp placeholder="Search…" value={filter} onChange={(e)=>setFilter(e.target.value)} />
            <button className="btn" onClick={()=>setCustEdit({ id:undefined, name:"", email:"", phone:"", licenseNumber:"", address:"", insurance:{carrier:"",policyNumber:"",expiresAt:""}, documents:{driverLicenseUrl:"", insuranceCardUrl:""} })}>
              + Add Customer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-700">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">License #</th>
                <th className="py-2 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((c)=>(
                <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-800/40 cursor-pointer" onClick={()=>openRow(c)}>
                  <td className="py-2 pr-4 whitespace-nowrap">{c.name || "-"}</td>
                  <td className="py-2 pr-4">{c.phone || "-"}</td>
                  <td className="py-2 pr-4">{c.email || "-"}</td>
                  <td className="py-2 pr-4">{c.licenseNumber || "-"}</td>
                  <td className="py-2 pr-2 text-right">
                    <button className="btn-xs mr-2" onClick={(e)=>{ e.stopPropagation(); openRow(c); }}>✏️</button>
                    <button className="btn-xs" onClick={(e)=>remove(c.id, e)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {!visible.length && (<tr><td className="py-6 text-slate-400" colSpan={5}>No customers. Click <b>+ Add Customer</b>.</td></tr>)}
            </tbody>
          </table>
        </div>

        <Modal
          open={!!custEdit}
          onClose={()=>setCustEdit(null)}
          title={custEdit?.id ? "Edit Customer" : "Add Customer"}
          footer={
            <>
              <button className="btn" onClick={()=>setCustEdit(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveCustomer}>Save Customer</button>
            </>
          }
        >
          {custEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Inp placeholder="Full Name" value={custEdit.name ?? ""} onChange={(e)=>setCustEdit(x=>({...x, name:e.target.value}))}/>
              <Inp placeholder="Email" value={custEdit.email ?? ""} onChange={(e)=>setCustEdit(x=>({...x, email:e.target.value}))}/>
              <Inp placeholder="Phone" inputMode="tel" value={custEdit.phone ?? ""} onChange={(e)=>setCustEdit(x=>({...x, phone:(e.target.value||"").replace(/\D/g,"").slice(0,15)}))}/>
              <Inp placeholder="Driver License Number" value={custEdit.licenseNumber ?? ""} onChange={(e)=>setCustEdit(x=>({...x, licenseNumber:e.target.value}))}/>
              <Inp placeholder="Address" value={custEdit.address ?? ""} onChange={(e)=>setCustEdit(x=>({...x, address:e.target.value}))} className="md:col-span-2"/>

              <div className="md:col-span-2 pt-2 text-slate-300">Insurance</div>
              <Inp placeholder="Carrier" value={custEdit.insurance?.carrier ?? ""} onChange={(e)=>setCustEdit(x=>({...x, insurance:{...(x.insurance||{}), carrier:e.target.value}}))}/>
              <Inp placeholder="Policy Number" value={custEdit.insurance?.policyNumber ?? ""} onChange={(e)=>setCustEdit(x=>({...x, insurance:{...(x.insurance||{}), policyNumber:e.target.value}}))}/>
              <Inp placeholder="Policy Expiration" type="date" value={custEdit.insurance?.expiresAt ?? ""} onChange={(e)=>setCustEdit(x=>({...x, insurance:{...(x.insurance||{}), expiresAt:e.target.value}}))}/>

              <div className="md:col-span-2 pt-2 text-slate-300">Documents (URLs for now)</div>
              <Inp placeholder="Driver License Image URL" value={custEdit.documents?.driverLicenseUrl ?? ""} onChange={(e)=>setCustEdit(x=>({...x, documents:{...(x.documents||{}), driverLicenseUrl:e.target.value}}))} className="md:col-span-2"/>
              <Inp placeholder="Insurance Card Image URL" value={custEdit.documents?.insuranceCardUrl ?? ""} onChange={(e)=>setCustEdit(x=>({...x, documents:{...(x.documents||{}), insuranceCardUrl:e.target.value}}))} className="md:col-span-2"/>
            </div>
          )}
        </Modal>
      </div>
    );
  };

/* ================== BOOKINGS (with tax) ================== */
const Bookings = () => {
  const TAX_RATE = 0.08; // 8%

  // --- local helper so typing in Price is smooth (no 1-char issue)
  function PriceField({ value, onChange }) {
    const [text, setText] = React.useState(String(value ?? ""));
    React.useEffect(() => { setText(String(value ?? "")); }, [value]);
    return (
      <Inp
        inputMode="decimal"
        placeholder="e.g. 100"
        value={text}
        onChange={(e) => {
          const raw = e.target.value || "";
          const cleaned = raw.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
          setText(cleaned);
          onChange?.(cleaned);
        }}
      />
    );
  }

  // options for searchable selects
  const custOptions = customers.map(c => ({
    label: `${c.name} — ${c.phone || ""}`,
    value: c.id,
  }));
  const vehOptions = vehicles.map(v => ({
    label: `${v.year || ""} ${v.make || ""} ${v.model || ""} • ${v.plate || ""}`,
    value: v.id,
  }));

  // helper to update draft without losing other fields
  const setDraft = (patch) => setBookingDraft(d => ({ ...d, ...patch }));

  // keep price as a string while typing, then compute numbers for totals
  const subtotal = Number(bookingDraft.price || 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  async function saveBooking() {
    const body = {
      customerId: bookingDraft.customerId,
      vehicleId:  bookingDraft.vehicleId,
      startDate:  bookingDraft.start || bookingDraft.startDate,
      endDate:    bookingDraft.end   || bookingDraft.endDate,
      price:      subtotal,          // base price (number)
      taxRate:    TAX_RATE,
      tax,
      total,
      notes:      bookingDraft.notes || "",
    };
    try {
      await send("/bookings", "POST", body);
      setBookings(await get("/bookings"));
      setVehicles(await get("/vehicles"));
      setSummary(await get("/stats/summary").catch(() => summary));
    } catch {}
    setNewBookingOpen(false);
    setBookingDraft({ customerId:"", vehicleId:"", start:"", end:"", price:"", notes:"" });
  }

  async function mark(id, status) {
    try {
      await send(`/bookings/${id}`, "PUT", { status });
      setBookings(await get("/bookings"));
      setVehicles(await get("/vehicles"));
      setSummary(await get("/stats/summary").catch(() => summary));
    } catch {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bookings</h2>
        <button className="btn" onClick={() => setNewBookingOpen(true)}>+ New Booking</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-slate-700">
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Vehicle</th>
              <th className="py-2 pr-4">Start</th>
              <th className="py-2 pr-4">End</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => {
              const c = customers.find(x => x.id === b.customerId);
              const v = vehicles.find(x => x.id === b.vehicleId);
              return (
                <tr key={b.id} className="border-b border-slate-800">
                  <td className="py-2 pr-4">{c?.name || b.customer || b.customerId}</td>
                  <td className="py-2 pr-4">
                    {v ? `${v.year || ""} ${v.make || ""} ${v.model || ""} • ${v.plate || ""}` : (b.vehicle || b.vehicleId)}
                  </td>
                  <td className="py-2 pr-4">{new Date(b.start ?? b.startDate).toLocaleString()}</td>
                  <td className="py-2 pr-4">{new Date(b.end ?? b.endDate).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    {b.status === "active"    ? <Pill tone="warn">active</Pill> :
                     b.status === "completed" ? <Pill tone="ok">completed</Pill> :
                                                <Pill>canceled</Pill>}
                  </td>
                  <td className="py-2 pr-2 text-right">
                    <button className="btn-xs mr-2" onClick={() => mark(b.id, "active")}>Start</button>
                    <button className="btn-xs mr-2" onClick={() => mark(b.id, "completed")}>Complete</button>
                    <button className="btn-xs" onClick={() => mark(b.id, "canceled")}>Cancel</button>
                  </td>
                </tr>
              );
            })}
            {!bookings.length && (
              <tr>
                <td className="py-6 text-slate-400" colSpan={6}>
                  No bookings yet. Click <b>+ New Booking</b> to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={newBookingOpen}
        onClose={() => setNewBookingOpen(false)}
        title="Create Booking"
        footer={
          <>
            <button className="btn" onClick={() => setNewBookingOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={saveBooking}>Save Booking</button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs mb-1 opacity-70">Customer</div>
            <SearchableSelect
              options={custOptions}
              value={bookingDraft.customerId}
              onChange={(val) => setDraft({ customerId: val })}
            />
          </div>
          <div>
            <div className="text-xs mb-1 opacity-70">Vehicle</div>
            <SearchableSelect
              options={vehOptions}
              value={bookingDraft.vehicleId}
              onChange={(val) => setDraft({ vehicleId: val })}
            />
          </div>
          <div>
            <div className="text-xs mb-1 opacity-70">Start</div>
            <Inp
              type="datetime-local"
              value={bookingDraft.start || ""}
              onChange={(e) => setDraft({ start: e.target.value })}
            />
          </div>
          <div>
            <div className="text-xs mb-1 opacity-70">End</div>
            <Inp
              type="datetime-local"
              value={bookingDraft.end || ""}
              onChange={(e) => setDraft({ end: e.target.value })}
            />
          </div>
          <div>
            <div className="text-xs mb-1 opacity-70">Price (base)</div>
            <PriceField
              value={bookingDraft.price}
              onChange={(cleaned) => setDraft({ price: cleaned })}
            />
          </div>

          {/* Subtotal / Tax / Total */}
          <div className="md:col-span-2 grid grid-cols-2 gap-2">
            <div className="px-3 py-2 rounded bg-slate-900 border border-slate-700 flex items-center justify-between">
              <span className="text-xs opacity-70">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="px-3 py-2 rounded bg-slate-900 border border-slate-700 flex items-center justify-between">
              <span className="text-xs opacity-70">Tax (8%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="px-3 py-2 rounded bg-slate-900 border border-slate-700 flex items-center justify-between col-span-2">
              <span className="text-xs opacity-70">Total</span>
              <span className="text-lg font-semibold">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};


  /* -------- FINANCES (simple) -------- */
  const Finances = () => {
    const rentalRevenue = bookings
      .filter(b => b.status === "completed" && typeof b.total === "number")
      .reduce((s,b)=> s + b.total, 0);
    const expensesTotal = expenses.reduce((s,x)=> s + (Number(x.amount)||0), 0);
    const net = rentalRevenue - expensesTotal;

    const [expLabel, setExpLabel] = useState("");
    const [expAmount, setExpAmount] = useState("");
    const addExpense = () => {
      if (!expLabel || !expAmount) return;
      setExpenses(prev => [{ id:`exp_${Date.now()}`, label:expLabel, amount:Number(expAmount)}, ...prev]);
      setExpLabel(""); setExpAmount("");
    };
    const removeExp = (id)=> setExpenses(prev=>prev.filter(x=>x.id!==id));

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Finances</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Tile label="Rental Revenue (Completed, Total)" value={`$${rentalRevenue.toLocaleString()}`} />
          <Tile label="Expenses (Local)" value={`$${expensesTotal.toLocaleString()}`} />
          <Tile label="Net" value={`$${net.toLocaleString()}`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-700 rounded p-4">
            <div className="font-semibold mb-2">Add Expense</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Inp placeholder="Label (e.g., Tires)" value={expLabel} onChange={(e)=>setExpLabel(e.target.value)}/>
              <Inp placeholder="Amount" inputMode="decimal" value={expAmount} onChange={(e)=>setExpAmount(e.target.value.replace(/[^\d.]/g,""))}/>
              <button className="btn" onClick={addExpense}>Add</button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded p-4">
            <div className="font-semibold mb-2">Completed Bookings</div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Vehicle</th>
                    <th className="py-2 pr-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b=>b.status==="completed" && typeof b.total==="number").map(b=>{
                    const c = customers.find(x=>x.id===b.customerId);
                    const v = vehicles.find(x=>x.id===b.vehicleId);
                    return (
                      <tr key={b.id} className="border-b border-slate-800">
                        <td className="py-2 pr-4">{c?.name || b.customer || b.customerId}</td>
                        <td className="py-2 pr-4">{v ? `${v.year||""} ${v.make||""} ${v.model||""} • ${v.plate}` : b.vehicle || b.vehicleId}</td>
                        <td className="py-2 pr-4">${Number(b.total).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {bookings.filter(b=>b.status==="completed" && typeof b.total==="number").length===0 && (
                    <tr><td className="py-6 text-slate-400" colSpan={3}>No completed bookings with totals yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded p-4 md:col-span-2">
            <div className="font-semibold mb-2">Expenses (Local demo)</div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="py-2 pr-4">Label</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(x=>(
                    <tr key={x.id} className="border-b border-slate-800">
                      <td className="py-2 pr-4">{x.label}</td>
                      <td className="py-2 pr-4">${Number(x.amount).toLocaleString()}</td>
                      <td className="py-2 pr-2 text-right"><button className="btn-xs" onClick={()=>removeExp(x.id)}>🗑️</button></td>
                    </tr>
                  ))}
                  {!expenses.length && (<tr><td className="py-6 text-slate-400" colSpan={3}>No expenses yet.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* -------- SHELL -------- */
  return (
    <div className="p-4 max-w-7xl mx-auto text-slate-100">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {TABS.map(t=>(
          <button key={t}
            className={`px-3 py-1 rounded border ${tab===t?"bg-green-700 border-green-600":"bg-slate-800 border-slate-700 hover:bg-slate-700"}`}
            onClick={()=>setTab(t)}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto">{online ? <Pill tone="ok">Live</Pill> : <Pill tone="bad">Offline</Pill>}</div>
      </div>

      {tab==="Dashboard" && <Dashboard/>}
      {tab==="Calendar"  && <Calendar/>}
      {tab==="Bookings"  && <Bookings/>}
      {tab==="Customers" && <Customers/>}
      {tab==="Vehicles"  && <Vehicles/>}
      {tab==="Finances"  && <Finances/>}
    </div>
  );
}

  /* -------- FINANCES (simple) -------- */
  const Finances = () => {
    const rentalRevenue = bookings
      .filter(b => b.status === "completed" && typeof b.total === "number")
      .reduce((s,b)=> s + b.total, 0);
    const expensesTotal = expenses.reduce((s,x)=> s + (Number(x.amount)||0), 0);
    const net = rentalRevenue - expensesTotal;

    const [expLabel, setExpLabel] = useState("");
    const [expAmount, setExpAmount] = useState("");
    const addExpense = () => {
      if (!expLabel || !expAmount) return;
      setExpenses(prev => [{ id:`exp_${Date.now()}`, label:expLabel, amount:Number(expAmount)}, ...prev]);
      setExpLabel(""); setExpAmount("");
    };
    const removeExp = (id)=> setExpenses(prev=>prev.filter(x=>x.id!==id));

    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Finances</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Tile label="Rental Revenue (Completed, Total)" value={`$${rentalRevenue.toLocaleString()}`} />
          <Tile label="Expenses (Local)" value={`$${expensesTotal.toLocaleString()}`} />
          <Tile label="Net" value={`$${net.toLocaleString()}`} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-700 rounded p-4">
            <div className="font-semibold mb-2">Add Expense</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Inp placeholder="Label (e.g., Tires)" value={expLabel} onChange={(e)=>setExpLabel(e.target.value)}/>
              <Inp placeholder="Amount" inputMode="decimal" value={expAmount} onChange={(e)=>setExpAmount(e.target.value.replace(/[^\d.]/g,""))}/>
              <button className="btn" onClick={addExpense}>Add</button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded p-4">
            <div className="font-semibold mb-2">Completed Bookings</div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Vehicle</th>
                    <th className="py-2 pr-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b=>b.status==="completed" && typeof b.total==="number").map(b=>{
                    const c = customers.find(x=>x.id===b.customerId);
                    const v = vehicles.find(x=>x.id===b.vehicleId);
                    return (
                      <tr key={b.id} className="border-b border-slate-800">
                        <td className="py-2 pr-4">{c?.name || b.customer || b.customerId}</td>
                        <td className="py-2 pr-4">{v ? `${v.year||""} ${v.make||""} ${v.model||""} • ${v.plate}` : b.vehicle || b.vehicleId}</td>
                        <td className="py-2 pr-4">${Number(b.total).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {bookings.filter(b=>b.status==="completed" && typeof b.total==="number").length===0 && (
                    <tr><td className="py-6 text-slate-400" colSpan={3}>No completed bookings with totals yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded p-4 md:col-span-2">
            <div className="font-semibold mb-2">Expenses (Local demo)</div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="py-2 pr-4">Label</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(x=>(
                    <tr key={x.id} className="border-b border-slate-800">
                      <td className="py-2 pr-4">{x.label}</td>
                      <td className="py-2 pr-4">${Number(x.amount).toLocaleString()}</td>
                      <td className="py-2 pr-2 text-right"><button className="btn-xs" onClick={()=>removeExp(x.id)}>🗑️</button></td>
                    </tr>
                  ))}
                  {!expenses.length && (<tr><td className="py-6 text-slate-400" colSpan={3}>No expenses yet.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* -------- SHELL -------- */
  return (
    <div className="p-4 max-w-7xl mx-auto text-slate-100">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {TABS.map(t=>(
          <button key={t}
            className={`px-3 py-1 rounded border ${tab===t?"bg-green-700 border-green-600":"bg-slate-800 border-slate-700 hover:bg-slate-700"}`}
            onClick={()=>setTab(t)}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto">{online ? <Pill tone="ok">Live</Pill> : <Pill tone="bad">Offline</Pill>}</div>
      </div>

      {tab==="Dashboard" && <Dashboard/>}
      {tab==="Calendar"  && <Calendar/>}
      {tab==="Bookings"  && <Bookings/>}
      {tab==="Customers" && <Customers/>}
      {tab==="Vehicles"  && <Vehicles/>}
      {tab==="Finances"  && <Finances/>}
    </div>
  );
}

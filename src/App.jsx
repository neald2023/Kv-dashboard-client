// src/App.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./index.css";

/* ========== API HELPERS ========== */
const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const get  = async (p) => (await fetch(`${API}${p}`)).json();
const send = async (p, m, body) =>
  (await fetch(`${API}${p}`, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })).json();

/* ========== SMALL UI ========== */
const Pill = ({ tone="default", children }) => {
  const map = {
    ok:"bg-green-700/30 text-green-200",
    warn:"bg-yellow-700/30 text-yellow-100",
    bad:"bg-red-700/30 text-red-100",
    default:"bg-slate-700/40 text-slate-200"
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${map[tone]}`}>{children}</span>;
};
const Tile = ({label,value})=>(
  <div className="bg-slate-900 border border-slate-700 rounded p-4">
    <div className="text-xs uppercase tracking-wide opacity-70">{label}</div>
    <div className="text-2xl font-semibold mt-1">{value}</div>
  </div>
);

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded w-full max-w-3xl p-5 shadow-xl" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700" onClick={onClose}>✕</button>
        </div>
        {children}
        <div className="mt-4 flex gap-2 justify-end">{footer}</div>
      </div>
    </div>
  );
}
const Inp = (p)=><input {...p} className={`inp ${p.className||""}`} />;
const Sel = (p)=><select {...p} className={`inp ${p.className||""}`} />;

/* Searchable dropdown */
function SearchableSelect({ options, value, onChange, labelKey="label", valueKey="value", placeholder="Type to search..." }) {
  const [q,setQ]=useState("");
  const filtered = useMemo(()=>options.filter(o=>String(o[labelKey]).toLowerCase().includes(q.toLowerCase())),[options,q,labelKey]);
  return (
    <div className="flex flex-col gap-1">
      <Inp placeholder={placeholder} value={q} onChange={e=>setQ(e.target.value)} />
      <div className="max-h-40 overflow-auto border border-slate-700 rounded">
        {filtered.map(o=>(
          <button key={o[valueKey]}
                  className={`w-full text-left px-3 py-2 hover:bg-slate-800 ${value===o[valueKey]?"bg-slate-800":""}`}
                  onClick={()=>onChange(o[valueKey])}>
            {o[labelKey]}
          </button>
        ))}
        {!filtered.length && <div className="px-3 py-2 opacity-60">No matches</div>}
      </div>
    </div>
  );
}

/* ========== MAIN APP ========== */
const TABS = ["Dashboard","Calendar","Bookings","Customers","Vehicles","Team Chat","Finances"];

export default function App() {
  const [tab,setTab]=useState("Dashboard");
  const [online,setOnline]=useState(false);
  const [summary,setSummary]=useState({bookingsTotal:0,activeRentals:0,vehicles:0,revenue:0});

  const [vehicles,setVehicles]=useState([]);
  const [customers,setCustomers]=useState([]);
  const [bookings,setBookings]=useState([]);

  // Modals
  const [vehEdit,setVehEdit]=useState(null);
  const [custEdit,setCustEdit]=useState(null);
  const [newBookingOpen,setNewBookingOpen]=useState(false);
  const [bookingDraft,setBookingDraft]=useState({customerId:"", vehicleId:"", start:"", end:""});

  /* Load everything */
  useEffect(()=>{
    (async()=>{
      try {
        const h = await get("/health");
        setOnline(Boolean(h.ok));
      } catch { setOnline(false); }
      try { setSummary(await get("/stats/summary")); } catch {}
      try { setVehicles(await get("/vehicles")); } catch {}
      try { setCustomers(await get("/customers")); } catch {}
      try { setBookings(await get("/bookings")); } catch {}
    })();
  },[]);

  /* Helpers */
  const statusPill = online ? <Pill tone="ok">Live</Pill> : <Pill tone="bad">Offline</Pill>;

  /* ------- Dashboard ------- */
  const Dashboard = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">K.V. Rentals • Team Dashboard</h2>
        {statusPill}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Tile label="Total Bookings" value={summary.bookingsTotal ?? bookings.length} />
        <Tile label="Active Rentals" value={summary.activeRentals ?? 0} />
        <Tile label="Vehicles" value={summary.vehicles ?? vehicles.length} />
        <Tile label="Revenue" value={`$${(summary.revenue ?? 0).toLocaleString()}`} />
      </div>
      <div className="text-xs opacity-60">
        Data source: <code>VITE_API_URL → {API || "(not set)"}</code>
      </div>
    </div>
  );

  /* ------- Calendar (simple live view) ------- */
  const Calendar = () => {
    const today = new Date();
    const [cursor,setCursor]=useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const y = cursor.getFullYear(), m = cursor.getMonth();
    const firstDow = new Date(y,m,1).getDay();              // 0..6
    const daysInMonth = new Date(y,m+1,0).getDate();        // number of days
    const cells = [];
    for (let i=0;i<firstDow;i++) cells.push(null);
    for (let d=1; d<=daysInMonth; d++) cells.push(new Date(y,m,d));

    // Mark pickups/returns from bookings
    const marks = new Map(); // key 'YYYY-MM-DD' -> {pickup:boolean, return:boolean}
    const fmt = (dt)=>dt.toISOString().slice(0,10);
    bookings.forEach(b=>{
      const s=new Date(b.start), e=new Date(b.end);
      const ks=fmt(s), ke=fmt(e);
      marks.set(ks,{...(marks.get(ks)||{}), pickup:true});
      marks.set(ke,{...(marks.get(ke)||{}), return:true});
    });

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Calendar</h2>
          <div className="flex gap-2">
            <button className="btn" onClick={()=>setCursor(new Date(y,m-1,1))}>← Prev</button>
            <div className="px-3 py-1 bg-slate-800 rounded">{cursor.toLocaleString(undefined,{month:"long", year:"numeric"})}</div>
            <button className="btn" onClick={()=>setCursor(new Date(y,m+1,1))}>Next →</button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs opacity-70">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((dt,idx)=>(
            <div key={idx} className="h-24 border border-slate-700 rounded p-1 text-xs relative">
              {dt && (
                <>
                  <div className="opacity-70">{dt.getDate()}</div>
                  {/* markers */}
                  {(()=>{
                    const k = fmt(dt);
                    const m = marks.get(k);
                    return (
                      <div className="absolute bottom-1 left-1 right-1 flex gap-1 justify-center">
                        {m?.pickup && <span className="h-2 w-2 rounded-full bg-green-400" title="Pickup" />}
                        {m?.return && <span className="h-2 w-2 rounded-full bg-red-400" title="Return" />}
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
  };

  /* ------- Vehicles ------- */
  const Vehicles = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Vehicles</h2>
        <button className="btn" onClick={()=>setVehEdit({})}>+ Add Vehicle</button>
      </div>
      <div className="table w-full">
        <div className="thead grid grid-cols-6">
          <div>Year</div><div>Make</div><div>Model</div><div>Plate</div><div>Odometer</div><div>Status</div>
        </div>
        {vehicles.map(v=>(
          <div key={v.id} className="trow grid grid-cols-6" onClick={()=>setVehEdit(v)}>
            <div>{v.year||""}</div><div>{v.make||""}</div><div>{v.model||""}</div>
            <div>{v.plate}</div><div>{v.currentOdometer}</div>
            <div>{v.status==="out" ? <Pill tone="warn">out</Pill> : <Pill tone="ok">available</Pill>}</div>
          </div>
        ))}
        {!vehicles.length && <div className="px-3 py-6 opacity-60">No vehicles yet.</div>}
      </div>

      <Modal open={!!vehEdit} onClose={()=>setVehEdit(null)} title={vehEdit?.id ? "Edit Vehicle" : "Add Vehicle"}
        footer={<>
          <button className="btn ghost" onClick={()=>setVehEdit(null)}>Cancel</button>
          <button className="btn" onClick={async ()=>{
            const clean = {
              ...vehEdit,
              currentOdometer: Number(String(vehEdit.currentOdometer||"").replace(/\D/g,"")) || 0
            };
            const saved = await send(`/vehicles/${clean.id||"new"}`, clean.id?"PUT":"POST", clean);
            // refresh list
            setVehicles(await get("/vehicles"));
            setVehEdit(null);
          }}>Save Vehicle</button>
        </>}>
        {vehEdit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Inp placeholder="Year" value={vehEdit.year||""} onChange={e=>setVehEdit({...vehEdit,year:e.target.value})}/>
            <Inp placeholder="Make" value={vehEdit.make||""} onChange={e=>setVehEdit({...vehEdit,make:e.target.value})}/>
            <Inp placeholder="Model" value={vehEdit.model||""} onChange={e=>setVehEdit({...vehEdit,model:e.target.value})}/>
            <Inp placeholder="VIN" value={vehEdit.vin||""} onChange={e=>setVehEdit({...vehEdit,vin:e.target.value})}/>
            <Inp placeholder="Color" value={vehEdit.color||""} onChange={e=>setVehEdit({...vehEdit,color:e.target.value})}/>
            <Inp placeholder="License Plate" value={vehEdit.plate||""} onChange={e=>setVehEdit({...vehEdit,plate:e.target.value})}/>
            <Inp placeholder="Odometer" inputMode="numeric" value={vehEdit.currentOdometer??""}
                 onChange={e=>{
                   const v=e.target.value.replace(/\D/g,""); // strip non-digits, no leading 0 issue
                   setVehEdit({...vehEdit,currentOdometer:v});
                 }}/>
            <Sel value={vehEdit.status||"available"} onChange={e=>setVehEdit({...vehEdit,status:e.target.value})}>
              <option value="available">available</option>
              <option value="out">out</option>
              <option value="service">service</option>
            </Sel>
          </div>
        )}
      </Modal>
    </div>
  );

  /* ------- Customers ------- */
  const Customers = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Customers</h2>
        <button className="btn" onClick={()=>setCustEdit({})}>+ Add Customer</button>
      </div>
      <div className="table w-full">
        <div className="thead grid grid-cols-5">
          <div>Name</div><div>Email</div><div>Phone</div><div>License #</div><div>Insurance</div>
        </div>
        {customers.map(c=>(
          <div key={c.id} className="trow grid grid-cols-5" onClick={()=>setCustEdit(c)}>
            <div>{c.name}</div><div>{c.email}</div><div>{c.phone}</div><div>{c.licenseNumber}</div>
            <div>{c.insurance?.carrier||"-"}</div>
          </div>
        ))}
        {!customers.length && <div className="px-3 py-6 opacity-60">No customers yet.</div>}
      </div>

      <Modal open={!!custEdit} onClose={()=>setCustEdit(null)} title={custEdit?.id?"Edit Customer":"Add Customer"}
        footer={<>
          <button className="btn ghost" onClick={()=>setCustEdit(null)}>Cancel</button>
          <button className="btn" onClick={async ()=>{
            const saved = await send(`/customers/${custEdit.id||"new"}`, custEdit.id?"PUT":"POST", custEdit);
            setCustomers(await get("/customers"));
            setCustEdit(null);
          }}>Save Customer</button>
        </>}>
        {custEdit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Inp placeholder="Full Name" value={custEdit.name||""} onChange={e=>setCustEdit({...custEdit,name:e.target.value})}/>
            <Inp placeholder="Email" value={custEdit.email||""} onChange={e=>setCustEdit({...custEdit,email:e.target.value})}/>
            <Inp placeholder="Phone" value={custEdit.phone||""} onChange={e=>setCustEdit({...custEdit,phone:e.target.value})}/>
            <Inp placeholder="Address" value={custEdit.address||""} onChange={e=>setCustEdit({...custEdit,address:e.target.value})}/>
            <Inp placeholder="Driver License #" value={custEdit.licenseNumber||""} onChange={e=>setCustEdit({...custEdit,licenseNumber:e.target.value})}/>
            <Inp placeholder="Insurance Carrier" value={custEdit.insurance?.carrier||""}
                 onChange={e=>setCustEdit({...custEdit,insurance:{...(custEdit.insurance||{}),carrier:e.target.value}})}/>
            <Inp placeholder="Policy Number" value={custEdit.insurance?.policyNumber||""}
                 onChange={e=>setCustEdit({...custEdit,insurance:{...(custEdit.insurance||{}),policyNumber:e.target.value}})}/>
            <Inp placeholder="Insurance Expiration (YYYY-MM-DD)" value={custEdit.insurance?.expiresAt||""}
                 onChange={e=>setCustEdit({...custEdit,insurance:{...(custEdit.insurance||{}),expiresAt:e.target.value}})}/>
          </div>
        )}
      </Modal>
    </div>
  );

  /* ------- Bookings ------- */
  const Bookings = () => {
    const custOptions = customers.map(c=>({label:c.name, value:c.id}));
    const vehOptions  = vehicles.map(v=>({label:`${v.year||""} ${v.make||""} ${v.model||""} • ${v.plate}`, value:v.id}));
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Bookings</h2>
          <button className="btn" onClick={()=>{ setBookingDraft({customerId:"",vehicleId:"",start:"",end:""}); setNewBookingOpen(true); }}>+ New Booking</button>
        </div>

        <div className="table w-full">
          <div className="thead grid grid-cols-6">
            <div>Customer</div><div>Vehicle</div><div>Start</div><div>End</div><div>Status</div><div>Actions</div>
          </div>
          {bookings.map(b=>{
            const c = customers.find(x=>x.id===b.customerId);
            const v = vehicles.find(x=>x.id===b.vehicleId);
            return (
              <div key={b.id} className="trow grid grid-cols-6">
                <div>{c?.name||b.customerId}</div>
                <div>{v?`${v.year||""} ${v.make||""} ${v.model||""} • ${v.plate}`:b.vehicleId}</div>
                <div>{new Date(b.start).toLocaleString()}</div>
                <div>{new Date(b.end).toLocaleString()}</div>
                <div><Pill tone={b.status==="active"?"ok":"default"}>{b.status||"pending"}</Pill></div>
                <div className="flex gap-2">
                  <button className="btn xs" onClick={async ()=>{
                    await send(`/bookings/${b.id}`, "PUT", { ...b, status:"active" });
                    setBookings(await get("/bookings"));
                  }}>Start</button>
                  <button className="btn xs" onClick={async ()=>{
                    await send(`/bookings/${b.id}`, "PUT", { ...b, status:"returned" });
                    setBookings(await get("/bookings"));
                  }}>Return</button>
                </div>
              </div>
            );
          })}
          {!bookings.length && <div className="px-3 py-6 opacity-60">No bookings yet.</div>}
        </div>

        <Modal open={newBookingOpen} onClose={()=>setNewBookingOpen(false)} title="Create Booking"
          footer={<>
            <button className="btn ghost" onClick={()=>setNewBookingOpen(false)}>Cancel</button>
            <button className="btn" onClick={async ()=>{
              const b = await send("/bookings", "POST", bookingDraft);
              setBookings(await get("/bookings"));
              setNewBookingOpen(false);
            }}>Save Booking</button>
          </>}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="text-xs mb-1 opacity-70">Customer</div>
              <SearchableSelect options={custOptions} value={bookingDraft.customerId}
                                onChange={(val)=>setBookingDraft({...bookingDraft,customerId:val})}/>
            </div>
            <div>
              <div className="text-xs mb-1 opacity-70">Vehicle</div>
              <SearchableSelect options={vehOptions} value={bookingDraft.vehicleId}
                                onChange={(val)=>setBookingDraft({...bookingDraft,vehicleId:val})}/>
            </div>
            <div>
              <div className="text-xs mb-1 opacity-70">Start</div>
              <Inp type="datetime-local" value={bookingDraft.start||""} onChange={e=>setBookingDraft({...bookingDraft,start:e.target.value})}/>
            </div>
            <div>
              <div className="text-xs mb-1 opacity-70">End</div>
              <Inp type="datetime-local" value={bookingDraft.end||""} onChange={e=>setBookingDraft({...bookingDraft,end:e.target.value})}/>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  /* ------- Team Chat & Finances placeholders ------- */
  const TeamChat = () => <div className="opacity-70">Team Chat (coming soon)</div>;
  const Finances = () => <div className="opacity-70">Finances (coming soon)</div>;

  return (
    <div className="p-4 max-w-7xl mx-auto text-slate-100">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {TABS.map(t=>(
          <button key={t}
                  className={`px-3 py-1 rounded border ${tab===t?"bg-green-700 border-green-600":"bg-slate-800 border-slate-700 hover:bg-slate-700"}`}
                  onClick={()=>setTab(t)}>{t}</button>
        ))}
        <div className="ml-auto">{statusPill}</div>
      </div>

      {tab==="Dashboard" && <Dashboard/>}
      {tab==="Calendar" && <Calendar/>}
      {tab==="Vehicles"  && <Vehicles/>}
      {tab==="Customers" && <Customers/>}
      {tab==="Bookings"  && <Bookings/>}
      {tab==="Team Chat" && <TeamChat/>}
      {tab==="Finances"  && <Finances/>}
    </div>
  );
}

/* ========== tiny style helpers via class names used above ========== */
// index.css adds .inp, .btn, .table, .thead, .trow classes (see next snippet)

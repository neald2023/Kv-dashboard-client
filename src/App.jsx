import React, { useEffect, useMemo, useState } from "react";

/* ========= config ========= */
const API_URL = import.meta.env.VITE_API_URL; // e.g. https://kv-dashboard-server.onrender.com
const TABS = ["Dashboard","Calendar","Bookings","Customers","Vehicles","Team Chat","Finances"];

/* ========= tiny UI helpers ========= */
const Box = ({ children, style }) => (
  <div style={{ background:"#12151a", border:"1px solid #262c34", borderRadius:10, padding:14, ...style }}>
    {children}
  </div>
);
const Pill = ({ tone="gray", children }) => {
  const bg = tone==="green"?"#14532d":tone==="red"?"#7f1d1d":tone==="blue"?"#1e3a8a":tone==="yellow"?"#854d0e":"#374151";
  return <span style={{background:bg,color:"#fff",borderRadius:999,padding:"4px 10px",fontSize:12}}>{children}</span>;
};
const Button = ({children,onClick,tone="default",type="button",disabled})=>{
  const bg = tone==="primary"?"#22c55e":tone==="danger"?"#ef4444":"#374151";
  const hover = tone==="primary"?"#16a34a":tone==="danger"?"#dc2626":"#4b5563";
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      style={{background:disabled? "#37415180":bg,color:"#fff",border:"none",borderRadius:8,padding:"8px 12px",cursor:disabled?"not-allowed":"pointer"}}
      onMouseOver={(e)=>e.currentTarget.style.background=disabled?"#37415180":hover}
      onMouseOut={(e)=>e.currentTarget.style.background=disabled?"#37415180":bg}>
      {children}
    </button>
  );
};
const Row = ({label,children})=>(
  <div style={{display:"grid",gridTemplateColumns:"160px 1fr",gap:10,marginBottom:10}}>
    <div style={{opacity:.8}}>{label}</div><div>{children}</div>
  </div>
);
const Input = ({value,onChange,type="text",placeholder})=>(
  <input value={value} type={type} placeholder={placeholder}
    onChange={(e)=>onChange(e.target.value)}
    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #262c34",background:"#0b0e12",color:"#fff"}}/>
);
const Select = ({value,onChange,options})=>(
  <select value={value} onChange={(e)=>onChange(e.target.value)}
    style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #262c34",background:"#0b0e12",color:"#fff"}}>
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
const Modal = ({title,onClose,children,footer})=>(
  <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:16}}>
    <div onClick={(e)=>e.stopPropagation()} style={{width:"min(900px,95vw)",background:"#0f1318",border:"1px solid #2a313a",borderRadius:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px",borderBottom:"1px solid #2a313a"}}>
        <h3 style={{margin:0}}>{title}</h3>
        <button onClick={onClose} style={{background:"transparent",color:"#9aa3af",border:"none",fontSize:18,cursor:"pointer"}}>×</button>
      </div>
      <div style={{padding:16}}>{children}</div>
      {footer && <div style={{padding:16,borderTop:"1px solid #2a313a",display:"flex",gap:8,justifyContent:"flex-end"}}>{footer}</div>}
    </div>
  </div>
);

/* ========= data helpers ========= */
async function getJSON(path){ const r=await fetch(`${API_URL}${path}`); if(!r.ok) throw new Error(path); return r.json(); }
const usePing = ()=> {
  const [online,setOnline]=useState(false);
  useEffect(()=>{
    let cancel=false;
    async function ping(){
      try{ const j=await getJSON("/health"); if(!cancel) setOnline(!!j.ok); }
      catch{ if(!cancel) setOnline(false); }
    }
    ping(); const id=setInterval(ping,15000); return ()=>{cancel=true; clearInterval(id);};
  },[]);
  return online;
};

/* ========= header + tabs ========= */
function Header({online}) {
  return (
    <div style={{padding:"10px 14px",borderBottom:"1px solid #262c34",display:"flex",alignItems:"center",gap:12,background:"#12151a",position:"sticky",top:0,zIndex:10}}>
      <div style={{fontWeight:700}}>K.V. Rentals • Team Dashboard</div>
      <div style={{marginLeft:"auto"}}>{online ? <Pill tone="green">Live</Pill> : <Pill tone="red">Offline</Pill>}</div>
    </div>
  );
}
function Tabs({activeTab,setActiveTab}){
  return (
    <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"12px 14px"}}>
      {TABS.map(t=>(
        <button key={t} onClick={()=>setActiveTab(t)}
          style={{background: activeTab===t? "#22c55e":"#1f2937", color:"#fff",border:"1px solid #2a313a",borderRadius:8,padding:"8px 12px",cursor:"pointer"}}>
          {t}
        </button>
      ))}
    </div>
  );
}

/* ========= dashboard ========= */
const Tile = ({label,value})=>(
  <Box style={{textAlign:"center"}}>
    <div style={{opacity:.8,marginBottom:6}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700}}>{value}</div>
  </Box>
);
function Dashboard({summary}) {
  return (
    <div style={{padding:"0 14px 14px"}}>
      <Box>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12}}>
          <Tile label="Total Bookings" value={summary?.bookingsTotal ?? "—"} />
          <Tile label="Active Rentals" value={summary?.activeRentals ?? "—"} />
          <Tile label="Vehicles" value={summary?.vehicles ?? "—"} />
          <Tile label="Revenue" value={summary?.revenue ? `$${summary.revenue.toLocaleString()}` : "—"} />
        </div>
        <div style={{fontSize:12,opacity:.7,marginTop:10}}>
          Data source: <code>VITE_API_URL</code> → {API_URL}
        </div>
      </Box>
    </div>
  );
}

/* ========= calendar ========= */
const dayKey = (d)=> d.toISOString().slice(0,10);
function Calendar({bookings}) {
  // normalize events per day
  const perDay = useMemo(()=>{
    const m = {};
    (bookings||[]).forEach(b=>{
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);
      const sKey = dayKey(start), eKey = dayKey(end);
      m[sKey] = m[sKey] || {pickup:0, return:0, ongoing:0};
      m[eKey] = m[eKey] || {pickup:0, return:0, ongoing:0};
      m[sKey].pickup++; m[eKey].return++;
      // mark ongoing days between
      let cur = new Date(start);
      cur.setDate(cur.getDate()+1);
      while(cur <= end){
        const k = dayKey(cur);
        m[k] = m[k] || {pickup:0, return:0, ongoing:0};
        m[k].ongoing++; cur.setDate(cur.getDate()+1);
      }
    });
    return m;
  },[bookings]);

  const [cursor,setCursor]=useState(()=> new Date());
  const y = cursor.getFullYear(), mo = cursor.getMonth(); // 0..11
  const first = new Date(y,mo,1);
  const startDay = first.getDay(); // 0=Sun
  const daysInMonth = new Date(y,mo+1,0).getDate();

  const cells = [];
  for(let i=0;i<startDay;i++) cells.push(null);
  for(let d=1; d<=daysInMonth; d++) cells.push(new Date(y,mo,d));

  const prev = ()=> setCursor(new Date(y,mo-1,1));
  const next = ()=> setCursor(new Date(y,mo+1,1));

  return (
    <div style={{padding:"0 14px 14px"}}>
      <Box>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Button onClick={prev}>←</Button>
            <h3 style={{margin:0}}>{cursor.toLocaleString(undefined,{month:"long"})} {y}</h3>
            <Button onClick={next}>→</Button>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Pill tone="green">Pickup</Pill>
            <Pill tone="red">Returns</Pill>
            <Pill tone="blue">Ongoing</Pill>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8,marginBottom:8,opacity:.8}}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} style={{textAlign:"center"}}>{d}</div>)}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
          {cells.map((date,idx)=>(
            <div key={idx} style={{height:92, border:"1px solid #262c34",borderRadius:10,padding:8, background:"#0f1318"}}>
              {date && (
                <>
                  <div style={{opacity:.8,marginBottom:6}}>{date.getDate()}</div>
                  {(()=>{ 
                    const k = dayKey(date);
                    const e = perDay[k];
                    if(!e) return null;
                    return (
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {e.pickup>0 && <Dot tone="green" text={e.pickup}/>}
                        {e.return>0 && <Dot tone="red" text={e.return}/>}
                        {e.ongoing>0 && <Dot tone="blue" text={e.ongoing}/>}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          ))}
        </div>
      </Box>
    </div>
  );
}
const Dot = ({tone,text})=>{
  const color = tone==="green"?"#22c55e":tone==="red"?"#ef4444":"#60a5fa";
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:6,background:"#111827",border:"1px solid #1f2937",borderRadius:999,padding:"2px 8px",fontSize:12}}>
      <span style={{width:8,height:8,borderRadius:999,background:color}}/>
      {text}
    </span>
  );
};

/* ========= Vehicles ========= */
function Vehicles({items,setItems}) {
  const [modal,setModal]=useState(null);
  const addNew = ()=> setModal({ id:`veh_${Date.now()}`, year:"", make:"", model:"", vin:"", color:"", plate:"", odometer:"", status:"available" });
  const save = (v)=>{ setItems(prev=>{ const next = prev.some(x=>x.id===v.id)? prev.map(x=>x.id===v.id?v:x) : [v,...prev]; localStorage.setItem("kv_vehicles",JSON.stringify(next)); return next; }); setModal(null); };
  const remove = (id)=>{ setItems(prev=>{ const next = prev.filter(x=>x.id!==id); localStorage.setItem("kv_vehicles",JSON.stringify(next)); return next; }); setModal(null); };

  return (
    <div style={{padding:"0 14px 14px"}}>
      <Box>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <h3 style={{margin:0}}>Vehicles</h3>
          <Button tone="primary" onClick={addNew}>+ Add Vehicle</Button>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{textAlign:"left",opacity:.8}}>
              <th style={{padding:"8px 6px"}}>Year</th>
              <th style={{padding:"8px 6px"}}>Make</th>
              <th style={{padding:"8px 6px"}}>Model</th>
              <th style={{padding:"8px 6px"}}>Plate</th>
              <th style={{padding:"8px 6px"}}>Odometer</th>
              <th style={{padding:"8px 6px"}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(v=>(
              <tr key={v.id} onClick={()=>setModal(v)} style={{cursor:"pointer",borderTop:"1px solid #262c34"}}>
                <td style={{padding:"10px 6px"}}>{v.year||"—"}</td>
                <td style={{padding:"10px 6px"}}>{v.make||"—"}</td>
                <td style={{padding:"10px 6px"}}>{v.model||"—"}</td>
                <td style={{padding:"10px 6px"}}>{v.plate||"—"}</td>
                <td style={{padding:"10px 6px"}}>{v.odometer||0}</td>
                <td style={{padding:"10px 6px"}}><Pill tone={v.status==="available"?"green":v.status==="out"?"yellow":"red"}>{v.status||"—"}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {modal && (
        <VehicleModal value={modal} onCancel={()=>setModal(null)} onSave={save} onDelete={()=>remove(modal.id)} />
      )}
    </div>
  );
}
function VehicleModal({value,onCancel,onSave,onDelete}){
  const [v,setV]=useState({...value});
  const set = (k,val)=>setV(s=>({...s,[k]:val}));
  return (
    <Modal title="Vehicle Profile" onClose={onCancel} footer={
      <>
        {value?.id && <Button tone="danger" onClick={onDelete}>Delete</Button>}
        <Button onClick={onCancel}>Cancel</Button>
        <Button tone="primary" onClick={()=>onSave(v)}>Save Vehicle</Button>
      </>
    }>
      <Row label="Year"><Input value={v.year} onChange={(x)=>set("year",x.replace(/\D/g,""))} /></Row>
      <Row label="Make"><Input value={v.make} onChange={(x)=>set("make",x)} /></Row>
      <Row label="Model"><Input value={v.model} onChange={(x)=>set("model",x)} /></Row>
      <Row label="VIN"><Input value={v.vin} onChange={(x)=>set("vin",x)} /></Row>
      <Row label="Color"><Input value={v.color} onChange={(x)=>set("color",x)} /></Row>
      <Row label="License Plate"><Input value={v.plate} onChange={(x)=>set("plate",x)} /></Row>
      <Row label="Odometer">
        <Input value={String(v.odometer ?? "")} onChange={(x)=>set("odometer", x.replace(/[^\d]/g,""))} />
      </Row>
      <Row label="Status">
        <Select value={v.status} onChange={(x)=>set("status",x)} options={[
          {value:"available",label:"available"},
          {value:"out",label:"out"},
          {value:"maintenance",label:"maintenance"},
        ]}/>
      </Row>
    </Modal>
  );
}

/* ========= Customers ========= */
function Customers({items,setItems}){
  const [modal,setModal]=useState(null);
  const addNew=()=>setModal({ id:`cus_${Date.now()}`, name:"", email:"", phone:"", licenseNumber:"", address:"", insurance:{company:"",policy:"",expiry:""}, licensePhotoUrl:"" });
  const save=(c)=>{ setItems(prev=>{ const next= prev.some(x=>x.id===c.id)? prev.map(x=>x.id===c.id?c:x) : [c,...prev]; localStorage.setItem("kv_customers",JSON.stringify(next)); return next;}); setModal(null); };
  const remove=(id)=>{ setItems(prev=>{ const next= prev.filter(x=>x.id!==id); localStorage.setItem("kv_customers",JSON.stringify(next)); return next;}); setModal(null); };

  return (
    <div style={{padding:"0 14px 14px"}}>
      <Box>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
          <h3 style={{margin:0}}>Customers</h3>
          <Button tone="primary" onClick={addNew}>+ Add Customer</Button>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead>
            <tr style={{textAlign:"left",opacity:.8}}>
              <th style={{padding:"8px 6px"}}>Name</th>
              <th style={{padding:"8px 6px"}}>Email</th>
              <th style={{padding:"8px 6px"}}>Phone</th>
              <th style={{padding:"8px 6px"}}>License #</th>
              <th style={{padding:"8px 6px"}}>Insurance</th>
            </tr>
          </thead>
          <tbody>
            {items.map(c=>(
              <tr key={c.id} onClick={()=>setModal(c)} style={{cursor:"pointer",borderTop:"1px solid #262c34"}}>
                <td style={{padding:"10px 6px"}}>{c.name||"—"}</td>
                <td style={{padding:"10px 6px"}}>{c.email||"—"}</td>
                <td style={{padding:"10px 6px"}}>{c.phone||"—"}</td>
                <td style={{padding:"10px 6px"}}>{c.licenseNumber||"—"}</td>
                <td style={{padding:"10px 6px"}}>{c.insurance?.company || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {modal && (
        <CustomerModal value={modal} onCancel={()=>setModal(null)} onSave={save} onDelete={()=>remove(modal.id)} />
      )}
    </div>
  );
}
function CustomerModal({value,onCancel,onSave,onDelete}){
  const [c,setC]=useState({...value});
  const set=(k,val)=>setC(s=>({...s,[k]:val}));
  const setIns=(k,val)=>setC(s=>({...s,insurance:{...(s.insurance||{}),[k]:val}}));
  return (
    <Modal title="Customer Profile" onClose={onCancel} footer={
      <>
        {value?.id && <Button tone="danger" onClick={onDelete}>Delete</Button>}
        <Button onClick={onCancel}>Cancel</Button>
        <Button tone="primary" onClick={()=>onSave(c)}>Save Customer</Button>
      </>
    }>
      <Row label="Full Name"><Input value={c.name} onChange={(x)=>set("name",x)} /></Row>
      <Row label="Email"><Input value={c.email} onChange={(x)=>set("email",x)} /></Row>
      <Row label="Phone"><Input value={c.phone} onChange={(x)=>set("phone",x.replace(/[^\d\-()+\s]/g,""))} /></Row>
      <Row label="Address"><Input value={c.address} onChange={(x)=>set("address",x)} /></Row>
      <Row label="License #"><Input value={c.licenseNumber} onChange={(x)=>set("licenseNumber",x)} /></Row>

      <h4 style={{marginTop:18}}>Insurance</h4>
      <Row label="Company"><Input value={c.insurance?.company||""} onChange={(x)=>setIns("company",x)} /></Row>
      <Row label="Policy #"><Input value={c.insurance?.policy||""} onChange={(x)=>setIns("policy",x)} /></Row>
      <Row label="Expiry (YYYY-MM-DD)"><Input value={c.insurance?.expiry||""} onChange={(x)=>setIns("expiry",x)} /></Row>

      <h4 style={{marginTop:18}}>Driver’s License Photo</h4>
      <Row label="Image URL"><Input value={c.licensePhotoUrl||""} onChange={(x)=>set("licensePhotoUrl",x)} /></Row>
      {c.licensePhotoUrl && (
        <div style={{marginTop:8}}>
          <img src={c.licensePhotoUrl} alt="DL" style={{maxWidth:"100%",borderRadius:8,border:"1px solid #2a313a"}}/>
        </div>
      )}
      <div style={{opacity:.7,fontSize:12,marginTop:8}}>
        (Uploads will be wired to cloud storage later; for now paste an image URL to preview & save locally.)
      </div>
    </Modal>
  );
}

/* ========= Bookings (placeholder) ========= */
function Bookings({bookings}) {
  return (
    <div style={{padding:"0 14px 14px"}}>
      <Box>
        <h3 style={{marginTop:0}}>Bookings (read-only mock)</h3>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{textAlign:"left",opacity:.8}}>
            <th style={{padding:"8px 6px"}}>Customer</th>
            <th style={{padding:"8px 6px"}}>Vehicle</th>
            <th style={{padding:"8px 6px"}}>Pickup</th>
            <th style={{padding:"8px 6px"}}>Return</th>
          </tr></thead>
          <tbody>
            {(bookings||[]).map(b=>(
              <tr key={b.id} style={{borderTop:"1px solid #262c34"}}>
                <td style={{padding:"10px 6px"}}>{b.customerName}</td>
                <td style={{padding:"10px 6px"}}>{b.vehicleName || b.plate}</td>
                <td style={{padding:"10px 6px"}}>{new Date(b.startDate).toLocaleDateString()}</td>
                <td style={{padding:"10px 6px"}}>{new Date(b.endDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </div>
  );
}

/* ========= Team Chat / Finances placeholders ========= */
const Placeholder = ({title,children})=>(
  <div style={{padding:"0 14px 14px"}}><Box><h3 style={{marginTop:0}}>{title}</h3><div>{children}</div></Box></div>
);

/* ========= Root App ========= */
export default function App(){
  const online = usePing();
  const [activeTab,setActiveTab]=useState("Dashboard");

  const [summary,setSummary]=useState(null);
  const [vehicles,setVehicles]=useState(()=> JSON.parse(localStorage.getItem("kv_vehicles")||"[]"));
  const [customers,setCustomers]=useState(()=> JSON.parse(localStorage.getItem("kv_customers")||"[]"));
  const [bookings,setBookings]=useState([]);

  useEffect(()=>{
    async function load(){
      try{ setSummary(await getJSON("/stats/summary")); } catch{}
      try{ const vs=await getJSON("/vehicles"); if(vehicles.length===0){ setVehicles(vs); localStorage.setItem("kv_vehicles",JSON.stringify(vs)); } } catch{}
      try{ const cs=await getJSON("/customers"); if(customers.length===0){ setCustomers(cs); localStorage.setItem("kv_customers",JSON.stringify(cs)); } } catch{}
      try{ setBookings(await getJSON("/bookings")); } catch{}
    }
    load();
  },[]); // load once

  return (
    <div style={{color:"#e5e7eb", background:"#0b0e12", minHeight:"100vh", fontFamily:"system-ui, -apple-system, Segoe UI, Roboto, sans-serif"}}>
      <Header online={online}/>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab}/>
      {activeTab==="Dashboard" && <Dashboard summary={summary}/>}
      {activeTab==="Calendar" && <Calendar bookings={bookings}/>}
      {activeTab==="Bookings" && <Bookings bookings={bookings}/>}
      {activeTab==="Customers" && <Customers items={customers} setItems={setCustomers}/>}
      {activeTab==="Vehicles" && <Vehicles items={vehicles} setItems={setVehicles}/>}
      {activeTab==="Team Chat" && <Placeholder title="Team Chat">Lightweight team chat and notifications will go here.</Placeholder>}
      {activeTab==="Finances" && <Placeholder title="Finances">Reports, payouts, and expense tracking coming soon.</Placeholder>}

      <div style={{opacity:.6,fontSize:12,textAlign:"center",padding:"10px 0 30px"}}>© 2025 KV Rentals</div>
    </div>
  );
}

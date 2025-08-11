import React, { useEffect, useMemo, useState } from "react";

/* ---------- tiny helpers ---------- */
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };

const Button = ({ className = "", ...p }) => (
  <button
    className={
      "px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 active:scale-[.99] transition " +
      className
    }
    {...p}
  />
);

const Card = ({ title, children }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
    <div className="text-gray-300 text-sm">{title}</div>
    <div className="text-2xl font-bold mt-1">{children}</div>
  </div>
);

const Table = ({ cols, rows }) => (
  <div className="rounded-xl overflow-auto border bg-white text-gray-800">
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100">
        <tr>{cols.map((c) => <th key={c} className="p-3 text-left">{c}</th>)}</tr>
      </thead>
      <tbody>
        {rows.length ? rows.map((r, i) => (
          <tr key={i} className="border-t">
            {r.map((cell, j) => <td key={j} className="p-3">{cell}</td>)}
          </tr>
        )) : (
          <tr><td className="p-3 text-gray-500" colSpan={cols.length}>No data.</td></tr>
        )}
      </tbody>
    </table>
  </div>
);

/* ---------- demo data (swap to API later) ---------- */
const demoBookings = [
  ["#1023","RZR XP 1000","2025‑08‑22","1 day","Paid"],
  ["#1024","Sea‑Doo Spark","2025‑08‑23","Half‑day","Pending"],
];

const fleetVehicles = [
  ["UTV‑12","RZR XP 1000","Available","1,240 mi","fleet"],
  ["TRK‑05","Ford F‑150","Maintenance","42,110 mi","fleet"],
];

const powerJetSkis = [
  ["PWC‑01","Sea‑Doo Spark","Available","82 hrs","jetski"],
  ["PWC‑07","Sea‑Doo Spark","Out","89 hrs","jetski"],
  ["PWC‑11","Yamaha VX","Maintenance","104 hrs","jetski"],
];

const powerScooters = [
  ["SCO‑03","Honda Ruckus","Available","1,240 mi","scooter"],
  ["SCO‑08","Vespa Primavera","Out","3,420 mi","scooter"],
  ["SCO‑10","Honda Metropolitan","Available","780 mi","scooter"],
];

const demoCustomers = [
  ["Maria Lopez","maria@example.com","(555) 555‑1222","3 bookings"],
  ["Devin King","devin@example.com","(555) 555‑4411","1 booking"],
];

const demoFinance = [
  ["Today","$1,240","2"],
  ["This Month","$12,480","18"],
];

/* ---------- Calendar ---------- */
function makeMonthGrid(y, m) {
  const f = new Date(y, m, 1), s = new Date(f);
  s.setDate(f.getDate() - ((f.getDay() + 6) % 7)); // start Monday
  const a = [];
  for (let i = 0; i < 42; i++) { const d = new Date(s); d.setDate(s.getDate() + i); a.push(d); }
  return a;
}

function Calendar() {
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const days = useMemo(() => makeMonthGrid(view.getFullYear(), view.getMonth()), [view]);
  const fmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
  const isSame = (a, b) => a.toDateString() === b.toDateString();

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xl font-semibold">{fmt.format(view)}</div>
        <div className="flex gap-2">
          <Button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>← Prev</Button>
          <Button onClick={() => setView(new Date())}>Today</Button>
          <Button onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>Next →</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-sm text-gray-500 mb-1">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="p-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === view.getMonth(), todayFlag = isSame(d, today);
          const dot = [8, 21].includes(d.getDate()); // sample dots
          return (
            <div key={i} className={`h-24 rounded-lg border p-2 text-sm bg-white transition ${inMonth ? "border-gray-200" : "border-gray-200 opacity-40"} ${todayFlag ? "ring-2 ring-emerald-400" : ""}`}>
              <div className="font-medium">{d.getDate()}</div>
              {dot && <div className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Time Clock (local) ---------- */
function TimeClock() {
  const key = "kv_punches_" + new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState(load(key, []));
  const last = rows.at(-1)?.action ?? "out";
  const punch = (a) => { const next = [...rows, { id: crypto.randomUUID(), action: a, ts: Date.now() }]; setRows(next); save(key, next); };
  const total = useMemo(() => {
    let ms = 0; for (let i = 0; i < rows.length; i += 2) { const iIn = rows[i], iOut = rows[i + 1]; if (iIn?.action === "in") { ms += (iOut?.ts ?? Date.now()) - iIn.ts; } }
    return (ms / 36e5).toFixed(2);
  }, [rows]);

  return (
    <div className="max-w-xl w-full space-y-3">
      <div className="flex gap-3">
        <Button className={last === "in" ? "opacity-40 cursor-not-allowed" : "bg-emerald-500 text-white border-emerald-600"} onClick={() => last !== "in" && punch("in")}>Clock In</Button>
        <Button className={last === "out" ? "opacity-40 cursor-not-allowed" : ""} onClick={() => last !== "out" && punch("out")}>Clock Out</Button>
        <div className="ml-auto text-sm text-gray-300">Today: <span className="font-semibold">{total} h</span></div>
      </div>
      <Table cols={["Action", "Time"]} rows={rows.map(r => [r.action[0].toUpperCase() + r.action.slice(1), new Date(r.ts).toLocaleTimeString()])} />
    </div>
  );
}

/* ---------- Team Chat (local) ---------- */
function Chat() {
  const [name, setName] = useState(load("kv_name", "You")), [text, setText] = useState(""), [msgs, setMsgs] = useState(load("kv_chat", []));
  const send = () => { const v = text.trim(); if (!v) return; const m = { id: crypto.randomUUID(), name, content: v, ts: Date.now() }; const next = [...msgs, m]; setMsgs(next); save("kv_chat", next); save("kv_name", name); setText(""); };
  return (
    <div className="grid md:grid-cols-[1fr,260px] gap-4 w-full max-w-4xl">
      <div className="border rounded-xl p-3 h-[60vh] flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {msgs.length ? msgs.map(m => (
            <div key={m.id} className="max-w-[75%] bg-gray-100 rounded-lg p-2">
              <div className="text-xs text-gray-500">{m.name}</div>
              <div>{m.content}</div>
              <div className="text-[10px] text-gray-400 mt-1">{new Date(m.ts).toLocaleTimeString()}</div>
            </div>
          )) : <div className="text-gray-500">No messages yet. Say hi!</div>}
        </div>
        <div className="flex gap-2 mt-3">
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message…" className="flex-1 px-3 py-2 rounded border" />
          <Button onClick={send}>Send</Button>
        </div>
      </div>
      <div className="border rounded-xl p-3 h-[60vh] bg-white">
        <div className="font-semibold mb-2">Your Name</div>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded border" placeholder="Display name" />
        <div className="text-sm text-gray-500 mt-3">(Demo stores messages locally. Server = realtime for everyone.)</div>
      </div>
    </div>
  );
}

/* ---------- Vehicles (with dropdown incl. Power Sports) ---------- */
function VehiclesPanel(){
  const [view, setView] = useState("all"); // all | fleet | jetski | scooter
  const cols = ["ID","Model","Status","Usage"];

  const all = useMemo(() => [...fleetVehicles, ...powerJetSkis, ...powerScooters], []);
  const rows = useMemo(() => {
    switch(view){
      case "fleet":   return fleetVehicles.map(r => r.slice(0,4));
      case "jetski":  return powerJetSkis.map(r => r.slice(0,4));
      case "scooter": return powerScooters.map(r => r.slice(0,4));
      default:        return all.map(r => r.slice(0,4));
    }
  }, [view, all]);

  return (
    <div className="w-full max-w-4xl space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-300">Category</label>
        <select
          value={view}
          onChange={(e)=>setView(e.target.value)}
          className="px-3 py-2 rounded border bg-white text-gray-800"
        >
          <option value="all">All Vehicles</option>
          <option value="fleet">Fleet (land)</option>
          <option value="jetski">Power Sports — Jet Skis</option>
          <option value="scooter">Power Sports — Scooters</option>
        </select>
      </div>
      <Table cols={cols} rows={rows} />
    </div>
  );
}

/* ---------- App shell with your tab order ---------- */
export default function App(){
  const [tab, setTab] = useState("dashboard");
  const tabs = [
    ["dashboard", "Dashboard"],
    ["calendar", "Calendar"],
    ["bookings", "Bookings"],
    ["customers", "Customers"],
    ["vehicles", "Vehicles"],          // unified + dropdown inside
    ["chat", "Team Chat"],
    ["finances", "Finances"],
  ];

  const [clock, setClock] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 bg-black/70 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-emerald-400 shadow" />
            <div><div className="text-sm text-gray-300">KV Rentals</div><div className="font-semibold">Team Dashboard</div></div>
          </div>
          <nav className="flex gap-2 flex-wrap">
            {tabs.map(([k, l]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={
                  "px-3 py-1.5 rounded-full text-sm border transition " +
                  (tab === k ? "bg-emerald-500 text-black border-emerald-500" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50")
                }
              >
                {l}
              </button>
            ))}
          </nav>
          <div className="text-sm text-gray-300">{clock.toLocaleTimeString()}</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {tab === "dashboard" && (
          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Status">Live</Card>
            <Card title="Modules">Calendar • Bookings • Customers • Vehicles</Card>
            <Card title="Next">Connect Server</Card>
          </div>
        )}

        {tab === "calendar" && <Calendar />}
        {tab === "bookings" && <Table cols={["ID","Vehicle","Date","Duration","Status"]} rows={demoBookings} />}
        {tab === "customers" && <Table cols={["Name","Email","Phone","History"]} rows={demoCustomers} />}
        {tab === "vehicles" && <VehiclesPanel />}
        {tab === "chat" && <Chat />}
        {tab === "finances" && <Table cols={["Period","Revenue","Bookings"]} rows={demoFinance} />}
      </main>
    </div>
  );
}

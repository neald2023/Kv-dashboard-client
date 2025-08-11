import React, {useEffect, useMemo, useState} from "react";

/* ---------- tiny helpers ---------- */
const save = (k,v)=>localStorage.setItem(k, JSON.stringify(v));
const load = (k,d)=>{ try{ return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
const Button = ({className="", ...p}) =>
  <button className={"px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50 active:scale-[.99] transition "+className} {...p} />;

/* ---------- CALENDAR ---------- */
function makeMonthGrid(year, month){ // month: 0-11
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay()+6)%7)); // start Monday
  const days = [];
  for(let i=0;i<42;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    days.push(d);
  }
  return days;
}
function Calendar(){
  const today = new Date();
  const [view, setView] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const days = useMemo(()=>makeMonthGrid(view.getFullYear(), view.getMonth()), [view]);
  const fmt = new Intl.DateTimeFormat(undefined,{month:"long", year:"numeric"});
  const isSameDay = (a,b)=>a.toDateString()===b.toDateString();

  return (
    <div className="w-full max-w-4xl">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xl font-semibold">{fmt.format(view)}</div>
        <div className="flex gap-2">
          <Button onClick={()=>setView(new Date(view.getFullYear(), view.getMonth()-1, 1))}>← Prev</Button>
          <Button onClick={()=>setView(new Date())}>Today</Button>
          <Button onClick={()=>setView(new Date(view.getFullYear(), view.getMonth()+1, 1))}>Next →</Button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-sm text-gray-500 mb-1">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><div key={d} className="p-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d,i)=>{
          const inMonth = d.getMonth()===view.getMonth();
          const isToday = isSameDay(d, today);
          return (
            <div key={i}
              className={"h-24 rounded-lg border p-2 text-sm bg-white transition " +
                (inMonth ? "border-gray-200" : "border-gray-200 opacity-40") +
                (isToday ? " ring-2 ring-emerald-400" : "")}>
              <div className="font-medium">{d.getDate()}</div>
              {/* sample booking dot */}
              {(d.getDate()===8 || d.getDate()===21) && <div className="mt-1 inline-block h-2 w-2 rounded-full bg-emerald-500" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- TIME CLOCK (local demo) ---------- */
function TimeClock(){
  const key = "kv_punches_"+new Date().toISOString().slice(0,10);
  const [rows,setRows]=useState(load(key,[]));
  const last = rows.at(-1)?.action ?? "out";
  const punch = (action)=>{
    const next=[...rows,{id:crypto.randomUUID(), action, ts:Date.now()}];
    setRows(next); save(key,next);
  };
  const totalHrs = useMemo(()=>{
    let ms=0;
    for(let i=0;i<rows.length;i+=2){
      const iIn = rows[i]; const iOut = rows[i+1];
      if(iIn?.action==="in"){ ms += (iOut?.ts ?? Date.now()) - iIn.ts; }
    }
    return (ms/36e5).toFixed(2);
  },[rows]);

  return (
    <div className="max-w-xl w-full space-y-3">
      <div className="flex gap-3">
        <Button className={last==="in"?"opacity-40 cursor-not-allowed":"bg-emerald-500 text-white border-emerald-600"}
                onClick={()=>last!=="in" && punch("in")}>Clock In</Button>
        <Button className={last==="out"?"opacity-40 cursor-not-allowed":""}
                onClick={()=>last!=="out" && punch("out")}>Clock Out</Button>
        <div className="ml-auto text-sm text-gray-600">Today: <span className="font-semibold">{totalHrs} h</span></div>
      </div>
      <div className="rounded-xl overflow-hidden border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100"><tr><th className="p-3 text-left">Action</th><th className="p-3 text-left">Time</th></tr></thead>
          <tbody>
            {rows.length? rows.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="p-3 capitalize">{r.action}</td>
                <td className="p-3">{new Date(r.ts).toLocaleTimeString()}</td>
              </tr>
            )): <tr><td colSpan={2} className="p-3 text-gray-500">No punches yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- CHAT (local demo) ---------- */
function Chat(){
  const [name,setName]=useState(load("kv_name","You"));
  const [text,setText]=useState("");
  const [msgs,setMsgs]=useState(load("kv_chat",[]));
  const send=()=>{
    const v=text.trim(); if(!v) return;
    const m={id:crypto.randomUUID(), name, content:v, ts:Date.now()};
    const next=[...msgs,m]; setMsgs(next); save("kv_chat",next); save("kv_name",name); setText("");
  };
  return (
    <div className="grid md:grid-cols-[1fr,260px] gap-4 w-full max-w-4xl">
      <div className="border rounded-xl p-3 h-[60vh] flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {msgs.length? msgs.map(m=>(
            <div key={m.id} className="max-w-[75%] bg-gray-100 rounded-lg p-2">
              <div className="text-xs text-gray-500">{m.name}</div>
              <div>{m.content}</div>
              <div className="text-[10px] text-gray-400 mt-1">{new Date(m.ts).toLocaleTimeString()}</div>
            </div>
          )): <div className="text-gray-500">No messages yet. Say hi!</div>}
        </div>
        <div className="flex gap-2 mt-3">
          <input value={text} onChange={e=>setText(e.target.value)}
                 onKeyDown={e=>e.key==="Enter"&&send()}
                 placeholder="Type a message…" className="flex-1 px-3 py-2 rounded border" />
          <Button onClick={send}>Send</Button>
        </div>
      </div>
      <div className="border rounded-xl p-3 h-[60vh] bg-white">
        <div className="font-semibold mb-2">Your Name</div>
        <input value={name} onChange={e=>setName(e.target.value)}
               className="w-full px-3 py-2 rounded border" placeholder="Enter a display name" />
        <div className="text-sm text-gray-500 mt-3">
          (Demo stores messages locally. When we add the server, chat syncs for everyone.)
        </div>
      </div>
    </div>
  );
}

/* ---------- APP SHELL WITH TABS ---------- */
export default function App(){
  const [tab,setTab]=useState("dashboard");
  const tabs=[["dashboard","Dashboard"],["calendar","Calendar"],["time","Time Clock"],["chat","Team Chat"]];

  // clock in header
  const [clock,setClock]=useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setClock(new Date()),1000); return ()=>clearInterval(t); },[]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 bg-black/70 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-emerald-400 shadow" />
            <div>
              <div className="text-sm text-gray-300">KV Rentals</div>
              <div className="font-semibold">Team Dashboard</div>
            </div>
          </div>
          <nav className="flex gap-2">
            {tabs.map(([key,label])=>(
              <button key={key} onClick={()=>setTab(key)}
                className={"px-3 py-1.5 rounded-full text-sm border transition "+
                  (tab===key?"bg-emerald-500 text-black border-emerald-500":"bg-white text-gray-800 border-gray-300 hover:bg-gray-50")}>
                {label}
              </button>
            ))}
          </nav>
          <div className="text-sm text-gray-300">{clock.toLocaleTimeString()}</div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {tab==="dashboard" && (
          <div className="grid md:grid-cols-3 gap-4 animate-[fadeIn_.25s_ease]">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm">Status</div>
              <div className="text-2xl font-bold mt-1">Live</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm">Modules</div>
              <div className="text-2xl font-bold mt-1">Calendar • Clock • Chat</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-gray-300 text-sm">Next</div>
              <div className="text-2xl font-bold mt-1">Connect Server</div>
            </div>
          </div>
        )}
        {tab==="calendar" && <Calendar />}
        {tab==="time" && <TimeClock />}
        {tab==="chat" && <Chat />}
      </main>
    </div>
  );
}

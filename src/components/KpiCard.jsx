export default function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-semibold text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

export default function SectionCard({ title, children, right }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

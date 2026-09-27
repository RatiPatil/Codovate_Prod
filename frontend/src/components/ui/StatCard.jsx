export default function StatCard({
  label,
  value = 0,
  helper,
  icon = '•',
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs font-medium text-slate-400">
          Codovate
        </span>
      </div>

      <div className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </div>

      <div className="mt-1 text-sm font-medium text-slate-700">
        {label}
      </div>

      {helper ? (
        <div className="mt-1 text-xs text-slate-500">
          {helper}
        </div>
      ) : null}
    </div>
  );
}

export default function LoadingState({
  label = 'Loading...',
  compact = false,
}) {
  return (
    <div
      className={
        compact
          ? 'flex items-center gap-2 py-4 text-sm text-slate-500'
          : 'flex min-h-[180px] items-center justify-center text-sm text-slate-500'
      }
      role="status"
      aria-live="polite"
    >
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#2015ff]" />
      <span>{label}</span>
    </div>
  );
}

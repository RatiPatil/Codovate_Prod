export default function SecondaryButton({
  children,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800',
        'transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50',
        'focus:outline-none focus:ring-2 focus:ring-slate-200',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

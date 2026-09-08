export default function PrimaryButton({
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
        'rounded-xl bg-[#2015ff] px-4 py-2.5 text-sm font-semibold text-white',
        'transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50',
        'focus:outline-none focus:ring-2 focus:ring-[#2015ff]/30',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

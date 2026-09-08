export default function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again.',
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
      <h3 className="font-semibold text-red-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-red-700">
        {description}
      </p>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-xl bg-[#2015ff] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

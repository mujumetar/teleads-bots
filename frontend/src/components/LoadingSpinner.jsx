export default function LoadingSpinner({ className = '', label = 'Loading…' }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 min-h-[min(60vh,480px)] py-16 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      {label && (
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      )}
    </div>
  );
}

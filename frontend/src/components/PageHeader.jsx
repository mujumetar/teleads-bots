export default function PageHeader({
  title,
  description,
  badge,
  children,
  className = '',
}) {
  return (
    <header
      className={`flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between pb-8 border-b border-slate-200/80 ${className}`}
    >
      <div className="space-y-2 min-w-0">
        {badge && (
          <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
            {badge}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-slate-600 text-sm font-medium leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">{children}</div>
      )}
    </header>
  );
}

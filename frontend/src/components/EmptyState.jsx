export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-6 text-center">
      {Icon && (
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Icon className="h-7 w-7" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm font-medium text-slate-500 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

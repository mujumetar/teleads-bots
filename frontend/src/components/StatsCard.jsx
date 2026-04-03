export default function StatsCard({ icon, label, value, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-primary/10 text-primary ring-1 ring-primary/10',
    emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
    amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
    purple: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
    blue: 'bg-sky-50 text-sky-800 ring-1 ring-sky-100',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    orange: 'bg-orange-50 text-orange-800 ring-1 ring-orange-100',
  };

  return (
    <div className="group pro-card p-5 sm:p-6 flex items-center gap-4 sm:gap-5 transition-all duration-300 hover:shadow-lg hover:border-slate-200/90">
      <div
        className={`p-3.5 rounded-2xl shrink-0 transition-transform duration-300 group-hover:scale-[1.03] ${colors[color] || colors.indigo}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.16em] mb-1 truncate">
          {label}
        </p>
        <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight tabular-nums truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

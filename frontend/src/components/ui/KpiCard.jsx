export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }) {
  const colors = {
    blue:
      'text-primary-700 bg-primary-50 border-primary-100 dark:text-primary-300 dark:bg-primary-950/40 dark:border-primary-900/40',
    amber:
      'text-amber-700 bg-amber-50 border-amber-200/80 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900/40',
    emerald:
      'text-emerald-700 bg-emerald-50 border-emerald-200/80 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-900/40',
    red:
      'text-rose-700 bg-rose-50 border-rose-200/80 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-900/40',
    indigo:
      'text-indigo-700 bg-indigo-50 border-indigo-200/80 dark:text-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-900/40',
    violet:
      'text-purple-700 bg-purple-50 border-purple-200/80 dark:text-purple-300 dark:bg-purple-950/40 dark:border-purple-900/40',
    slate:
      'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700',
  }

  // Scale down font for large Ariary amounts:
  const valueLen = String(value ?? '').length
  const valueSizeClass =
    valueLen > 14 ? 'text-base' :
    valueLen > 11 ? 'text-lg sm:text-xl' :
    valueLen > 8  ? 'text-xl sm:text-2xl' :
    'text-2xl sm:text-3xl'

  return (
    <div className="bg-white border border-slate-200/80 shadow-card hover:shadow-card-hover rounded-2xl p-5 sm:p-6 flex flex-col gap-3 transition-all duration-200 dark:bg-slate-800/80 dark:border-slate-700/60 min-h-[9.5rem]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
          {title}
        </p>
        {Icon && (
          <div className={`p-2.5 rounded-xl border shrink-0 ${colors[color] ?? colors.blue}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className={`${valueSizeClass} font-extrabold font-heading text-slate-900 dark:text-white leading-none tracking-tight break-words w-full`}>
        {value}
      </p>
      <div className="mt-auto pt-2 flex items-center justify-between">
        {subtitle && (
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
        {trend !== undefined && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend >= 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
            }`}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}

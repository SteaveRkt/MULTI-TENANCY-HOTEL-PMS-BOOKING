import { clsx } from 'clsx'

export default function Select({ label, options = [], error, className, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
      )}
      <select
        className={clsx(
          'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-950 outline-none transition-all shadow-subtle dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
            : 'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}

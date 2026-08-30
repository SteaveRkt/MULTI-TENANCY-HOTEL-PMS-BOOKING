import { clsx } from 'clsx'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:
    'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold shadow-sm hover:shadow-md hover:shadow-primary-600/15 active:scale-[0.98]',
  secondary:
    'bg-primary-50 hover:bg-primary-100 text-primary-800 border border-primary-200/60 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-primary-300 dark:border-slate-700 font-medium',
  outline:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/90 shadow-subtle hover:border-slate-400 dark:bg-slate-800 dark:hover:bg-slate-750 dark:text-slate-200 dark:border-slate-700 dark:hover:border-slate-600 font-medium',
  ghost:
    'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white font-medium',
  danger:
    'bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm active:scale-[0.98]',
  success:
    'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm active:scale-[0.98]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  onClick,
  type = 'button',
  children,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  )
}

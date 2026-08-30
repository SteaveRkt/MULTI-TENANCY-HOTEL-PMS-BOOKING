import { clsx } from 'clsx'

export function Card({ children, className }) {
  return (
    <div
      className={clsx(
        'bg-white border border-slate-200/80 shadow-card dark:bg-slate-800/80 dark:border-slate-700/60 rounded-2xl transition-colors duration-200',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }) {
  return (
    <div className={clsx('px-6 py-5 border-b border-slate-100 dark:border-slate-700/60', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }) {
  return (
    <h3 className={clsx('text-base sm:text-lg font-bold text-slate-900 dark:text-white font-heading tracking-tight', className)}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className }) {
  return (
    <p className={clsx('text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1', className)}>
      {children}
    </p>
  )
}

export function CardContent({ children, className }) {
  return <div className={clsx('p-6', className)}>{children}</div>
}

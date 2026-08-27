import { Outlet } from 'react-router-dom'
import PublicNavbar from './PublicNavbar'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      <PublicNavbar />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  )
}

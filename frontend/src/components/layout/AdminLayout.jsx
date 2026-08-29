import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Sidebar from './Sidebar'
import { Menu, Building2 } from 'lucide-react'
import ThemeToggle from '../ui/ThemeToggle'

export default function AdminLayout() {
  const { isAuthenticated, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated || user?.role === 'SUPER_ADMIN') return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors">
      {/* Sidebar (Desktop fixed + Mobile off-canvas drawer) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar (Only on screens < lg) */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Ouvrir le menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                <Building2 size={18} />
              </div>
              <span className="font-extrabold font-heading text-primary-700 dark:text-primary-300 text-sm sm:text-base truncate max-w-[170px]" title={user?.hotel_name || user?.tenant_name || 'Établissement'}>
                {user?.hotel_name || user?.tenant_name || 'Établissement'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 font-bold text-xs flex items-center justify-center border border-primary-200/60 dark:border-primary-800">
              {user?.first_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

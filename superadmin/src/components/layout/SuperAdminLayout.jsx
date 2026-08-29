import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Globe,
  Hotel,
  Crown,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../ui/ThemeToggle'

const navItems = [
  { path: '/dashboard', label: 'Vue Globale', icon: LayoutDashboard },
  { path: '/hotels', label: 'Tous les Hôtels', icon: Building2 },
  { path: '/users', label: 'Utilisateurs Plateforme', icon: Users },
  { path: '/reservations', label: 'Toutes les Réservations', icon: CalendarCheck },
]

export default function SuperAdminLayout() {
  const { user, logout, isAuthenticated } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 text-white flex flex-col justify-between p-4 transform transition-transform duration-300 ease-in-out border-r border-slate-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-6">
          {/* Brand & Super Admin Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-primary-600 to-primary-500 text-white shadow-md">
                <Crown size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <span className="text-lg font-black font-heading tracking-tight text-white block leading-none">
                  HotelPMS
                </span>
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-primary-400">
                  Super Admin Hub
                </span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Super Admin Info Card */}
          <div className="p-3.5 rounded-2xl bg-primary-950/40 border border-primary-800/40 text-primary-200 text-xs">
            <div className="flex items-center gap-2 font-bold mb-1">
              <ShieldAlert size={15} className="text-primary-400 flex-shrink-0" />
              <span>Contrôle Multi-Hôtels</span>
            </div>
            <p className="text-[11px] text-primary-300/80 leading-relaxed">
              Supervision globale de tous les établissements hôteliers et de la plateforme.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/')
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white font-bold shadow-md shadow-primary-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom Profile & External Links */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="space-y-1 text-xs">
            <a
              href="http://localhost:5173/hotelier"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span className="flex items-center gap-2"><Hotel size={14} /> Espace Hôtelier</span>
              <ExternalLink size={12} />
            </a>
            <a
              href="http://localhost:5173/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span className="flex items-center gap-2"><Globe size={14} /> Site Public Voyageurs</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* User profile & Logout */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-2">
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[10px] text-primary-400 font-semibold truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer flex-shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest block">
                Super Administrateur
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                Contrôle Central Multi-Hôtels
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition cursor-pointer"
            >
              <LogOut size={14} /> Déconnexion
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

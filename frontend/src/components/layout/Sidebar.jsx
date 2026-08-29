import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Grid,
  CalendarDays,
  BedDouble,
  Users,
  UserCog,
  LogOut,
  Building2,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Badge from '../ui/Badge'
import ThemeToggle from '../ui/ThemeToggle'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/rooms-grid', icon: Grid, label: 'Rack des Chambres' },
  { to: '/admin/reservations', icon: CalendarDays, label: 'Réservations' },
  { to: '/admin/rooms', icon: BedDouble, label: 'Chambres' },
  { to: '/admin/customers', icon: Users, label: 'Clients' },
  { to: '/admin/staff', icon: UserCog, label: 'Personnel' },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-primary-50 border border-primary-100 text-primary-600 dark:bg-primary-950/50 dark:border-primary-900/50 dark:text-primary-400 flex-shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-base font-extrabold font-heading text-primary-700 dark:text-primary-300 tracking-tight truncate block" title={user?.hotel_name || user?.tenant_name || 'Établissement'}>
                {user?.hotel_name || user?.tenant_name || 'Établissement'}
              </span>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block flex-shrink-0"></span>
                Espace Hôtelier PMS
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300 border border-primary-100 dark:border-primary-900/40 shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/80'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User profile card */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 border border-primary-200/70 dark:bg-primary-950/80 dark:border-primary-800 text-primary-800 dark:text-primary-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {user?.first_name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.first_name} {user?.last_name}
                </p>
              <Badge variant={user?.role ? user.role.toLowerCase() : 'default'}>
                  {user?.role || 'Utilisateur'}
                </Badge>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

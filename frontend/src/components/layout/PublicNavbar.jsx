import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Search, LogIn, Menu, X } from 'lucide-react'
import ThemeToggle from '../ui/ThemeToggle'

export default function PublicNavbar() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-600 dark:bg-primary-950/50 dark:border-primary-900/50 dark:text-primary-400 group-hover:bg-primary-100 transition-colors">
              <Building2 size={20} />
            </div>
            <span className="text-lg font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">HotelPMS</span>
          </Link>

          {/* Desktop Nav links & Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/track"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/70 transition-all"
            >
              <Search size={16} />
              Suivre ma réservation
            </Link>

            <ThemeToggle />

            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-primary-600/15 transition-all active:scale-98 cursor-pointer"
            >
              <LogIn size={15} />
              Espace Hôtelier
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-4 space-y-3 transition-colors shadow-lg">
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Search size={16} />
            Suivre ma réservation
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false)
              navigate('/login')
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <LogIn size={16} />
            Espace Hôtelier (PMS)
          </button>
        </div>
      )}
    </header>
  )
}

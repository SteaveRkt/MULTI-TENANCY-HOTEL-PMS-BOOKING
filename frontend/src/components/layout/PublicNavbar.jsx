import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Search, LogIn, Menu, X, Compass, ShieldCheck, BedDouble } from 'lucide-react'
import ThemeToggle from '../ui/ThemeToggle'

export default function PublicNavbar() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Traveler brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-primary-600 text-white shadow-sm group-hover:bg-primary-700 transition-colors">
              <BedDouble size={20} />
            </div>
            <div>
              <span className="text-lg font-black font-heading text-slate-900 dark:text-white tracking-tight block leading-none">
                HotelBooking
              </span>
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-wider uppercase">
                Portail Voyageurs
              </span>
            </div>
          </Link>

          {/* Desktop Nav links & Actions */}
          <div className="hidden md:flex items-center gap-6">
            <a
              href="#destinations"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition"
            >
              Destinations
            </a>
            <a
              href="#services"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition"
            >
              Services Voyageurs
            </a>
            <Link
              to="/track"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400 transition"
            >
              <Search size={15} />
              Suivre ma réservation
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              to="/hotelier"
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Building2 size={15} className="text-primary-600 dark:text-primary-400" />
              <span>Espace Hôtelier & Pro</span>
            </Link>

            {/* Mobile Menu Button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-4 space-y-3 transition-colors shadow-lg">
          <a
            href="#destinations"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Destinations
          </a>
          <a
            href="#services"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Services Voyageurs
          </a>
          <Link
            to="/track"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Search size={16} />
            Suivre ma réservation
          </Link>
          <Link
            to="/hotelier"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold shadow-sm transition"
          >
            <Building2 size={16} className="text-primary-600" />
            Accéder à l'Espace Hôtelier & Pro
          </Link>
        </div>
      )}
    </header>
  )
}

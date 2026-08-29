import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getApiErrorMessage } from '../../api/client'
import ThemeToggle from '../../components/ui/ThemeToggle'

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { registerHotel, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const [form, setForm] = useState({
    hotel_name: '',
    city: '',
    address: '',
    phone: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await registerHotel(form)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      console.error('Register error:', err)
      setError(getApiErrorMessage(err, 'Erreur lors de la création de votre hôtel'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#070F2B] via-[#1B1A55] to-[#535C91] flex-col justify-between p-12 relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent" />
        
        <div className="relative z-10">
          <Link to="/hotelier" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors mb-8">
            <ArrowLeft size={16} /> Retour à la présentation
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-white">
              <Building2 size={28} />
            </div>
            <span className="text-2xl font-extrabold font-heading text-white tracking-tight">HotelPMS</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="text-3xl xl:text-4xl font-extrabold font-heading text-white leading-tight tracking-tight">
            Digitalisez la gestion de votre hôtel en moins de 2 minutes
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Rejoignez les établissements qui modernisent leur réception, optimisent leur taux d'occupation et automatisent leur facturation.
          </p>

          <div className="space-y-3 pt-2">
            {[
              'Rack de planning interactif & zéro surréservation',
              'Traçabilité complète des réceptions et facturation PDF',
              'Tableau de bord financier (ADR, RevPAR, Encaissements)',
              'Comptes multi-utilisateurs (Administrateurs & Réceptionnistes)',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-slate-200">
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} HotelPMS Solution Hôtelière</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-400" /> Données sécurisées & isolées</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 relative overflow-y-auto">
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-lg">
          <div className="mb-6 lg:hidden">
            <Link to="/hotelier" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-4">
              <ArrowLeft size={14} /> Retour à la présentation
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                <Building2 size={22} />
              </div>
              <span className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">HotelPMS</span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mb-1.5 tracking-tight">
              Créer mon hôtel
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Remplissez les détails ci-dessous pour configurer votre établissement et votre compte administrateur.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Section 1 : Informations hôtel */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 shadow-subtle">
              <span className="text-[11px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider block">
                1. Votre Établissement
              </span>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nom de l'hôtel *</label>
                <input
                  type="text"
                  required
                  value={form.hotel_name}
                  onChange={(e) => setForm((p) => ({ ...p, hotel_name: e.target.value }))}
                  placeholder="ex: Hotel Grand Palace"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ville *</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="ex: Nosy Be"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="ex: +261 34 00 000 00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Adresse complète</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="ex: Boulevard de la Plage"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-primary-500"
                />
              </div>
            </div>

            {/* Section 2 : Compte Administrateur */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3 shadow-subtle">
              <span className="text-[11px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider block">
                2. Compte Administrateur Principal
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                    placeholder="Prénom"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                    placeholder="Nom"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Email professionnel (Identifiant) *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="direction@monhotel.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Mot de passe de sécurité *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm outline-none focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-extrabold text-sm shadow-md hover:shadow-primary-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
              Créer mon hôtel & Accéder au PMS
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="font-bold text-primary-600 hover:underline dark:text-primary-400">
                  Se connecter
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

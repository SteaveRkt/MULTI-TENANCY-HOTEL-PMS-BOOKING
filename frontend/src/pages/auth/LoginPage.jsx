import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getApiErrorMessage } from '../../api/client'
import ThemeToggle from '../../components/ui/ThemeToggle'

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, registerHotel, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [regForm, setRegForm] = useState({
    hotel_name: '',
    city: '',
    address: '',
    phone: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(loginForm.email, loginForm.password)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      setError(getApiErrorMessage(err, 'Email ou mot de passe incorrect'))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await registerHotel(regForm)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      console.error('Register error:', err)
      setError(getApiErrorMessage(err, 'Erreur lors de la création du compte'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Left branding panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0b1c30] via-[#102a4a] to-[#0058be]/40 flex-col justify-center px-16 relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent" />
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-12">
            <div className="p-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md text-white">
              <Building2 size={28} />
            </div>
            <span className="text-2xl font-extrabold font-heading text-white tracking-tight">HotelPMS</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold font-heading text-white leading-tight mb-6 tracking-tight">
            Gérez votre établissement <br />
            <span className="text-primary-300">avec précision & fluidité</span>
          </h1>
          <p className="text-slate-300 text-base xl:text-lg leading-relaxed mb-10 font-normal">
            Solution hôtelière complète : planning en temps réel, réservations, facturation officielle en Ariary et métriques financières (ADR, RevPAR).
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Multi-Établissements', 'Isolation stricte des données'],
              ['Métriques Clés', 'ADR, RevPAR, ALOS'],
              ['Sécurité & Rapprochement', 'Zéro surréservation'],
              ['Facturation Officielle', 'Génération PDF en Ariary'],
            ].map(([val, label]) => (
              <div
                key={val}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm"
              >
                <p className="text-sm font-bold text-white font-heading">{val}</p>
                <p className="text-xs text-slate-300/80 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative">
        {/* Top right theme toggle */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="p-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-600 dark:bg-primary-950 dark:border-primary-900 dark:text-primary-400">
              <Building2 size={24} />
            </div>
            <span className="text-xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">HotelPMS</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1.5 mb-8 border border-slate-200/80 dark:border-slate-700/60">
            {[
              ['login', 'Connexion'],
              ['register', 'Créer un hôtel'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key)
                  setError('')
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  tab === key
                    ? 'bg-white text-primary-700 shadow-sm border border-slate-200/70 dark:bg-primary-600 dark:text-white dark:border-transparent font-bold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-sm font-medium">
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white mb-1 tracking-tight">
                  Espace Hôtelier
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Connectez-vous pour accéder au tableau de bord
                </p>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Adresse Email
                </label>
                <input
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="admin@hotel.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 transition-all text-sm shadow-subtle"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500 transition-all text-sm shadow-subtle"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-sm shadow-sm hover:shadow-md hover:shadow-primary-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6 active:scale-[0.99] cursor-pointer"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Se connecter
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white mb-1 tracking-tight">
                  Créer votre hôtel
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-5">
                  Enregistrez votre établissement et configurez votre compte
                </p>
              </div>

              <p className="text-[11px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider">
                Informations de l'établissement
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <input
                    type="text"
                    required
                    value={regForm.hotel_name}
                    onChange={(e) => setRegForm((p) => ({ ...p, hotel_name: e.target.value }))}
                    placeholder="Nom de l'hôtel *"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm shadow-subtle"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={regForm.city}
                    onChange={(e) => setRegForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Ville *"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm shadow-subtle"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    value={regForm.phone}
                    onChange={(e) => setRegForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="Téléphone"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm shadow-subtle"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={regForm.address}
                    onChange={(e) => setRegForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="Adresse de l'hôtel"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm shadow-subtle"
                  />
                </div>
              </div>

              <p className="text-[11px] font-bold text-primary-700 dark:text-primary-400 uppercase tracking-wider pt-2">
                Compte administrateur
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    value={regForm.first_name}
                    onChange={(e) => setRegForm((p) => ({ ...p, first_name: e.target.value }))}
                    placeholder="Prénom *"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm shadow-subtle"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    required
                    value={regForm.last_name}
                    onChange={(e) => setRegForm((p) => ({ ...p, last_name: e.target.value }))}
                    placeholder="Nom *"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm shadow-subtle"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="Email professionnel *"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm shadow-subtle"
                  />
                </div>
                <div className="col-span-2">
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      value={regForm.password}
                      onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Mot de passe *"
                      className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm shadow-subtle"
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
                className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-sm shadow-sm hover:shadow-md hover:shadow-primary-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6 active:scale-[0.99] cursor-pointer"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Créer l'hôtel
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

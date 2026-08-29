import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Eye, EyeOff, Loader2, ShieldCheck, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getApiErrorMessage } from '../../api/client'
import ThemeToggle from '../../components/ui/ThemeToggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Super Admin Login error:', err)
      setError(getApiErrorMessage(err, 'Identifiants incorrects ou droits Super Admin insuffisants.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-white transition-colors relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Header & Crown Icon */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-3xl bg-primary-600/20 border border-primary-500/30 text-primary-400 shadow-xl shadow-primary-600/10">
              <Crown size={36} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight">
                Super Admin Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Portail de Supervision Centrale Multi-Hôtels
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="p-7 rounded-3xl bg-slate-850/80 border border-slate-800 backdrop-blur-xl shadow-2xl space-y-5">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-900/60 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                  Email Super Administrateur
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@hotelpms.com"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                  Mot de passe de sécurité
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-extrabold text-sm shadow-md hover:shadow-primary-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-6 cursor-pointer"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                Accéder au Hub de Contrôle
              </button>
            </form>
          </div>

          <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-500" />
            Accès restreint & audité par signature cryptographique
          </div>
        </div>
      </div>
    </div>
  )
}

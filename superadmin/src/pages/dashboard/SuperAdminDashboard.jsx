import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  BedDouble,
  CalendarCheck,
  DollarSign,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle,
  Plus,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Crown,
  ChevronRight,
  Hotel,
} from 'lucide-react'
import { superAdminAPI, getApiErrorMessage } from '../../api/client'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await superAdminAPI.getStats()
      setStats(res.data)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des statistiques globales'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 text-sm flex items-center gap-2">
        <AlertCircle size={18} />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-primary-950 text-white border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600/20 text-primary-300 text-xs font-bold border border-primary-500/30">
            <Crown size={13} /> Vue Super Administrateur
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            Tableau de Bord Global Multi-Hôtels
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Supervision centralisée de l'ensemble du parc hôtelier et des flux financiers.
          </p>
        </div>

        <Link
          to="/hotels"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} className="stroke-[3]" />
          Gérer les Hôtels
        </Link>
      </div>

      {/* Global KPIs Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Hotels */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Hôtels Enregistrés</span>
            <span className="text-3xl font-black font-heading text-slate-900 dark:text-white">
              {stats?.total_hotels ?? 0}
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <Building2 size={24} />
          </div>
        </div>

        {/* Total Rooms */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Chambres Totales</span>
            <span className="text-3xl font-black font-heading text-slate-900 dark:text-white">
              {stats?.total_rooms ?? 0}
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <BedDouble size={24} />
          </div>
        </div>

        {/* Total Reservations */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Réservations Globales</span>
            <span className="text-3xl font-black font-heading text-slate-900 dark:text-white">
              {stats?.total_reservations ?? 0}
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CalendarCheck size={24} />
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Chiffre d'Affaires Global</span>
            <span className="text-2xl sm:text-3xl font-black font-heading text-emerald-600 dark:text-emerald-400">
              {new Intl.NumberFormat('fr-FR').format(Math.round(stats?.total_revenue ?? 0))} <span className="text-xs text-slate-400">Ar</span>
            </span>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Grid: Breakdown by status & Recent Hotels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status breakdown */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
          <h2 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">
            Volume des Réservations
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Confirmées (En attente de séjour)', key: 'CONFIRMED', color: 'bg-primary-500' },
              { label: 'Occupées (En cours de séjour)', key: 'CHECKED_IN', color: 'bg-emerald-500' },
              { label: 'Terminées (Check-out effectué)', key: 'CHECKED_OUT', color: 'bg-slate-500' },
              { label: 'En attente de confirmation', key: 'PENDING', color: 'bg-amber-500' },
              { label: 'Annulées', key: 'CANCELLED', color: 'bg-rose-500' },
            ].map((s) => {
              const count = stats?.status_breakdown?.[s.key] ?? 0
              return (
                <div key={s.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{s.label}</span>
                  </div>
                  <span className="font-black font-heading text-slate-900 dark:text-white">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recently onboarded hotels */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">
              Établissements Récents
            </h2>
            <Link
              to="/hotels"
              className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
            >
              Voir tous les hôtels <ChevronRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {stats?.recent_hotels?.map((h) => (
              <div key={h.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                    <Hotel size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{h.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={12} /> {h.city || 'Non renseignée'} • {h.rooms_count} chambre(s)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-extrabold font-heading text-emerald-600 dark:text-emerald-400 block">
                    {new Intl.NumberFormat('fr-FR').format(Math.round(h.revenue))} Ar
                  </span>
                  <span className="text-[11px] text-slate-400">{h.reservations_count} réservation(s)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

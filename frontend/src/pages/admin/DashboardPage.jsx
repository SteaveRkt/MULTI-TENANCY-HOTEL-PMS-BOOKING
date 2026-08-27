import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  BedDouble,
  BarChart2,
  Activity,
  Calendar,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { dashboardAPI } from '../../api/client'
import { useTheme } from '../../context/ThemeContext'
import KpiCard from '../../components/ui/KpiCard'
import Badge from '../../components/ui/Badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'

const RANGES = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 jours', value: 'last_7' },
  { label: '30 jours', value: 'last_30' },
]

const PIE_COLORS = ['#0058be', '#6b38d4', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6']

function getDateRange(range) {
  const today = new Date()
  const fmt = (d) => d.toISOString().split('T')[0]
  if (range === 'today') {
    return { start_date: fmt(today), end_date: fmt(today) }
  }
  if (range === 'last_7') {
    const d = new Date(today)
    d.setDate(d.getDate() - 7)
    return { start_date: fmt(d), end_date: fmt(today) }
  }
  // last_30
  const d = new Date(today)
  d.setDate(d.getDate() - 30)
  return { start_date: fmt(d), end_date: fmt(today) }
}

function Skeleton({ className = '' }) {
  return (
    <div
      className={`bg-slate-200/80 dark:bg-slate-700/50 animate-pulse rounded-2xl ${className}`}
    />
  )
}

const fmt = (n) => {
  const val = Math.round(n ?? 0)
  return `${new Intl.NumberFormat('fr-FR').format(val)} Ar`
}

export default function DashboardPage() {
  const { isDark } = useTheme()
  const [range, setRange] = useState('today')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    const params = getDateRange(range)
    dashboardAPI
      .getStats(params)
      .then((res) => setData(res.data))
      .catch(() => setError('Erreur lors du chargement des statistiques.'))
      .finally(() => setLoading(false))
  }, [range])

  const fin = data?.financial ?? {}
  const occ = data?.occupancy ?? {}

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">Tableau de bord</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Aperçu des performances hôtelières et financières
          </p>
        </div>

        {/* Range selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-1 gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                range === r.value
                  ? 'bg-white text-primary-700 shadow-sm border border-slate-200/70 dark:bg-primary-600 dark:text-white dark:border-transparent font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-sm font-medium">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* KPI Cards Grid (Responsive 1 to 6 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)
        ) : (
          <>
            <KpiCard
              title="Revenu Encaissé"
              value={fmt(fin.collected_revenue)}
              icon={DollarSign}
              color="blue"
              subtitle="Trésorerie perçue"
            />
            <KpiCard
              title="Revenu Engagé"
              value={fmt(fin.booked_revenue)}
              icon={TrendingUp}
              color="indigo"
              subtitle="Total des séjours"
            />
            <KpiCard
              title="Reste à percevoir"
              value={fmt(fin.pending_revenue)}
              icon={AlertCircle}
              color={fin.pending_revenue > 0 ? 'red' : 'slate'}
              subtitle="Solde impayé"
            />
            <KpiCard
              title="Taux d'Occupation"
              value={`${occ.rate ?? 0}%`}
              icon={BedDouble}
              color="emerald"
              subtitle={`${occ.occupied_rooms ?? 0} / ${occ.total_rooms ?? 0} chambres`}
            />
            <KpiCard
              title="ADR"
              value={fmt(fin.adr)}
              icon={BarChart2}
              color="violet"
              subtitle="Prix moyen nuitée"
            />
            <KpiCard
              title="RevPAR"
              value={fmt(fin.revpar)}
              icon={Activity}
              color="amber"
              subtitle="Revenu / ch. dispo"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area chart */}
        <Card className="xl:col-span-2 shadow-card">
          <CardHeader>
            <CardTitle>Évolution des Revenus & Réservations</CardTitle>
            <CardDescription>Performance journalière sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart
                  data={data?.daily_stats ?? []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0058be" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0058be" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b38d4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6b38d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#334155' : '#f1f5f9'}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      color: isDark ? '#ffffff' : '#0f172a',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Revenu (Ar)"
                    stroke="#0058be"
                    fill="url(#colorRev)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="reservations"
                    name="Réservations"
                    stroke="#6b38d4"
                    fill="url(#colorRes)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus par Type de Chambre</CardTitle>
            <CardDescription>Part de chaque catégorie dans le CA</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (fin.revenue_by_room_type ?? []).length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Aucune donnée sur cette période.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={fin.revenue_by_room_type ?? []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="revenue"
                    nameKey="room_type"
                  >
                    {(fin.revenue_by_room_type ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {value}
                      </span>
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      color: isDark ? '#ffffff' : '#0f172a',
                    }}
                    formatter={(val) => [`${Number(val).toLocaleString('fr-FR')} Ar`, 'Revenu']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent reservations */}
      <Card className="shadow-card overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
            <Calendar size={18} />
          </div>
          <div>
            <CardTitle>Dernières Réservations</CardTitle>
            <CardDescription>Activité récente au sein de l'établissement</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/40">
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Chambre</th>
                <th className="px-6 py-4">Arrivée</th>
                <th className="px-6 py-4">Départ</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Paiement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    Chargement des réservations...
                  </td>
                </tr>
              ) : (data?.recent_reservations ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    Aucune réservation récente
                  </td>
                </tr>
              ) : (
                (data?.recent_reservations ?? []).map((r) => (
                  <tr
                    key={r.reservation_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-primary-700 dark:text-primary-300 text-xs">
                      {r.reservation_code}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {r.customer_name || 'Client de passage'}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                      Chambre {r.room_number || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {r.check_in ? new Date(r.check_in).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs font-medium">
                      {r.check_out ? new Date(r.check_out).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={r.status}>{r.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={r.is_paid ? 'paid' : 'unpaid'}>{r.payment_status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

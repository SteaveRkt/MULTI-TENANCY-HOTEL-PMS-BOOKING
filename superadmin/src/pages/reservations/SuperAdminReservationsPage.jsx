import { useState, useEffect } from 'react'
import {
  CalendarCheck,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Building2,
  User,
  BedDouble,
  CreditCard,
  CheckCircle2,
  Clock,
  Ban,
  UserCheck,
} from 'lucide-react'
import { superAdminAPI, getApiErrorMessage } from '../../api/client'

const STATUS_BADGES = {
  CONFIRMED: { label: 'Confirmée', bg: 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300' },
  CHECKED_IN: { label: 'En séjour', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' },
  CHECKED_OUT: { label: 'Terminée', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  PENDING: { label: 'En attente', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' },
  CANCELLED: { label: 'Annulée', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' },
}

export default function SuperAdminReservationsPage() {
  const [reservations, setReservations] = useState([])
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedHotel, setSelectedHotel] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')

  const fetchReservations = async () => {
    setLoading(true)
    setError('')
    try {
      const [resRes, hotelsRes] = await Promise.all([
        superAdminAPI.getReservations({
          hotel_id: selectedHotel || undefined,
          status: selectedStatus || undefined,
        }),
        superAdminAPI.getHotels(),
      ])
      setReservations(resRes.data || [])
      setHotels(hotelsRes.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des réservations'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [selectedHotel, selectedStatus])

  const filtered = reservations.filter((r) => {
    if (!search) return true
    const term = search.toLowerCase()
    const code = (r.reservation_code || '').toLowerCase()
    const cust = (r.customer_name || '').toLowerCase()
    const hotel = (r.hotel_name || '').toLowerCase()
    const staff = (r.receptionist_name || '').toLowerCase()
    return code.includes(term) || cust.includes(term) || hotel.includes(term) || staff.includes(term)
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
            <CalendarCheck size={24} />
          </div>
          Audit Global des Réservations Plateforme
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Historique et traçabilité de toutes les réservations opérées sur l'ensemble des établissements
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par code dossier, client, hôtel..."
            className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-primary-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {/* Hotel Filter */}
          <select
            value={selectedHotel}
            onChange={(e) => setSelectedHotel(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="">Tous les établissements</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="CONFIRMED">Confirmée</option>
            <option value="CHECKED_IN">En séjour</option>
            <option value="CHECKED_OUT">Terminée</option>
            <option value="PENDING">En attente</option>
            <option value="CANCELLED">Annulée</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Code Dossier</th>
                  <th className="py-3.5 px-4">Établissement</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Chambre</th>
                  <th className="py-3.5 px-4">Opéré / Encaissé Par</th>
                  <th className="py-3.5 px-4">Dates Séjour</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      Aucune réservation trouvée.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const badge = STATUS_BADGES[r.status] || { label: r.status, bg: 'bg-slate-100' }
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                          {r.reservation_code}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">{r.hotel_name}</span>
                          {r.hotel_city && <span className="text-[11px] text-slate-400">{r.hotel_city}</span>}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                          <div>{r.customer_name}</div>
                          {r.customer_phone && <div className="text-[11px] text-slate-400">{r.customer_phone}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Chambre {r.room_number}
                          </span>
                          <span className="text-[11px] text-slate-400 block">({r.room_type})</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                            <UserCheck size={13} className="text-primary-600 dark:text-primary-400" />
                            {r.receptionist_name}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 space-y-0.5">
                          <div>Du {new Date(r.check_in).toLocaleDateString('fr-FR')}</div>
                          <div className="text-[11px] text-slate-400">au {new Date(r.check_out).toLocaleDateString('fr-FR')}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-extrabold font-heading text-slate-900 dark:text-white text-xs sm:text-sm block">
                            {new Intl.NumberFormat('fr-FR').format(Math.round(r.total_price))} Ar
                          </span>
                          {r.is_paid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                              <CheckCircle2 size={11} /> Acquitté
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                              <Clock size={11} /> Non réglé
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

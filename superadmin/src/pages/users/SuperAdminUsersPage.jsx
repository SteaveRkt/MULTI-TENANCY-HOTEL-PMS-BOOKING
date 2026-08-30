import { useState, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  Shield,
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle2,
  XCircle,
  Power,
} from 'lucide-react'
import { superAdminAPI, getApiErrorMessage } from '../../api/client'

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState([])
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedHotel, setSelectedHotel] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const [usersRes, hotelsRes] = await Promise.all([
        superAdminAPI.getUsers({
          hotel_id: selectedHotel || undefined,
          role: selectedRole || undefined,
        }),
        superAdminAPI.getHotels(),
      ])
      setUsers(usersRes.data || [])
      setHotels(hotelsRes.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des utilisateurs'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [selectedHotel, selectedRole])

  const handleToggleStatus = async (user) => {
    try {
      await superAdminAPI.toggleUserStatus(user.id)
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      )
    } catch (err) {
      alert(getApiErrorMessage(err, 'Impossible de modifier le statut de l’utilisateur'))
    }
  }

  const filteredUsers = users.filter((u) => {
    if (!search) return true
    const term = search.toLowerCase()
    const name = `${u.first_name} ${u.last_name}`.toLowerCase()
    const email = (u.email || '').toLowerCase()
    const hotel = (u.hotel_name || '').toLowerCase()
    return name.includes(term) || email.includes(term) || hotel.includes(term)
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
            <Users size={24} />
          </div>
          Utilisateurs & Employés de la Plateforme
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Supervision de tous les comptes administrateurs, réceptionnistes et super admins
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
            placeholder="Rechercher par nom, email ou hôtel..."
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
            <option value="">Tous les hôtels</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city})
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Administrateurs d'hôtel</option>
            <option value="RECEPTIONIST">Réceptionnistes</option>
            <option value="SUPER_ADMIN">Super Admins</option>
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
                  <th className="py-3.5 px-4">Utilisateur</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Établissement</th>
                  <th className="py-3.5 px-4">Rôle</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {u.first_name} {u.last_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {u.hotel_name}
                        </span>
                        {u.hotel_city && <span className="text-[11px] text-slate-400">{u.hotel_city}</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.role === 'SUPER_ADMIN' ? (
                          <span className="px-2.5 py-1 rounded-full bg-primary-600/20 text-primary-700 dark:text-primary-300 font-bold text-[11px] border border-primary-500/30">
                            Super Admin
                          </span>
                        ) : u.role === 'ADMIN' ? (
                          <span className="px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold text-[11px]">
                            Admin Hôtel
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                            Réceptionniste
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle2 size={13} /> Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-bold text-[11px]">
                            <XCircle size={13} /> Désactivé
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {u.role !== 'SUPER_ADMIN' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              u.is_active
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                          >
                            {u.is_active ? 'Désactiver' : 'Activer'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

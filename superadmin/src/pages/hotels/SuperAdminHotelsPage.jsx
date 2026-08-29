import { useState, useEffect } from 'react'
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  BedDouble,
  CalendarCheck,
  DollarSign,
  X,
  CheckCircle2,
} from 'lucide-react'
import { superAdminAPI, getApiErrorMessage } from '../../api/client'

export default function SuperAdminHotelsPage() {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Add Hotel Modal
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_password: '',
  })

  // Edit Hotel Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingHotel, setEditingHotel] = useState(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    address: '',
    phone: '',
    email: '',
  })

  const fetchHotels = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await superAdminAPI.getHotels({ search: search || undefined })
      setHotels(res.data || [])
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des hôtels'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHotels()
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchHotels()
  }

  const handleAddHotel = async (e) => {
    e.preventDefault()
    setAddSubmitting(true)
    setError('')
    try {
      await superAdminAPI.createHotel(addForm)
      setAddModalOpen(false)
      setAddForm({
        name: '',
        city: '',
        address: '',
        phone: '',
        email: '',
        admin_first_name: '',
        admin_last_name: '',
        admin_email: '',
        admin_password: '',
      })
      fetchHotels()
      alert('Établissement hôtelier créé avec succès !')
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la création de l’hôtel'))
    } finally {
      setAddSubmitting(false)
    }
  }

  const openEditModal = (hotel) => {
    setEditingHotel(hotel)
    setEditForm({
      name: hotel.name || '',
      city: hotel.city || '',
      address: hotel.address || '',
      phone: hotel.phone || '',
      email: hotel.email || '',
    })
    setEditModalOpen(true)
  }

  const handleUpdateHotel = async (e) => {
    e.preventDefault()
    if (!editingHotel) return
    setEditSubmitting(true)
    try {
      await superAdminAPI.updateHotel(editingHotel.id, editForm)
      setEditModalOpen(false)
      setEditingHotel(null)
      fetchHotels()
      alert('Informations mises à jour avec succès !')
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la modification de l’hôtel'))
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteHotel = async (hotel) => {
    if (
      !window.confirm(
        `ATTENTION : Êtes-vous sûr de vouloir supprimer définitivement l'hôtel "${hotel.name}" ainsi que toutes ses chambres, réservations et employés associés ?`
      )
    ) {
      return
    }

    try {
      await superAdminAPI.deleteHotel(hotel.id)
      fetchHotels()
      alert(`Hôtel "${hotel.name}" supprimé.`)
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la suppression de l’hôtel'))
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <Building2 size={24} />
            </div>
            Gestion des Établissements Hôteliers
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervision, création et configuration de tous les hôtels de la plateforme
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} className="stroke-[3]" />
          Ajouter un Hôtel
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou ville..."
            className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-primary-500 text-slate-900 dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition"
        >
          Filtrer
        </button>
      </form>

      {/* Table */}
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
                  <th className="py-3.5 px-4">Établissement</th>
                  <th className="py-3.5 px-4">Ville & Adresse</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Chambres</th>
                  <th className="py-3.5 px-4">Réservations</th>
                  <th className="py-3.5 px-4">Chiffre d'Affaires</th>
                  <th className="py-3.5 px-4">Administrateur</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {hotels.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-400">
                      Aucun établissement trouvé.
                    </td>
                  </tr>
                ) : (
                  hotels.map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white text-sm">
                        {h.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-900 dark:text-white block">{h.city || '—'}</span>
                        <span className="text-[11px] text-slate-400">{h.address || 'Non renseignée'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Phone size={11} className="text-slate-400" /> {h.phone || '—'}
                        </div>
                        <div className="flex items-center gap-1 text-[11px]">
                          <Mail size={11} className="text-slate-400" /> {h.email || '—'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-extrabold">
                          {h.rooms_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold">
                          {h.reservations_count}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold font-heading text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
                        {new Intl.NumberFormat('fr-FR').format(Math.round(h.total_revenue))} Ar
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {h.admin ? (
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {h.admin.first_name} {h.admin.last_name}
                            </span>
                            <span className="text-[11px] text-slate-400">{h.admin.email}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Aucun admin</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(h)}
                            title="Modifier"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteHotel(h)}
                            title="Supprimer"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add Hotel & Admin */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-extrabold font-heading text-slate-900 dark:text-white">
                Ajouter un Nouvel Établissement
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddHotel} className="space-y-3">
              <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider block">
                1. Coordonnées de l'hôtel
              </span>
              <input
                type="text"
                required
                placeholder="Nom de l'hôtel *"
                value={addForm.name}
                onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Ville *"
                  value={addForm.city}
                  onChange={(e) => setAddForm((p) => ({ ...p, city: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                />
              </div>
              <input
                type="text"
                placeholder="Adresse complète"
                value={addForm.address}
                onChange={(e) => setAddForm((p) => ({ ...p, address: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
              />

              <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider block pt-2">
                2. Administrateur de l'hôtel
              </span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Prénom admin *"
                  value={addForm.admin_first_name}
                  onChange={(e) => setAddForm((p) => ({ ...p, admin_first_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Nom admin *"
                  value={addForm.admin_last_name}
                  onChange={(e) => setAddForm((p) => ({ ...p, admin_last_name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                />
              </div>
              <input
                type="email"
                required
                placeholder="Email admin *"
                value={addForm.admin_email}
                onChange={(e) => setAddForm((p) => ({ ...p, admin_email: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
              />
              <input
                type="password"
                required
                placeholder="Mot de passe temporaire *"
                value={addForm.admin_password}
                onChange={(e) => setAddForm((p) => ({ ...p, admin_password: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
              />

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {addSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Créer l'Établissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Hotel */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold font-heading text-slate-900 dark:text-white">
                Modifier l'Établissement
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateHotel} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nom de l'hôtel</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ville</label>
                  <input
                    type="text"
                    required
                    value={editForm.city}
                    onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Adresse</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {editSubmitting && <Loader2 size={14} className="animate-spin" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

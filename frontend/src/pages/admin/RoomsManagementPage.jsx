import { useState, useEffect } from 'react'
import { roomsAPI, getApiErrorMessage } from '../../api/client'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { Plus, Search, Edit2, Trash2, BedDouble, AlertCircle } from 'lucide-react'

export default function RoomsManagementPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [formData, setFormData] = useState({
    number: '',
    type: 'STANDARD',
    floor: 1,
    capacity: 2,
    price_per_night: '',
    status: 'AVAILABLE',
    description: '',
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [roomToDelete, setRoomToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const res = await roomsAPI.list()
      let data = res.data || []
      if (statusFilter) data = data.filter((r) => r.status === statusFilter)
      if (typeFilter) data = data.filter((r) => r.type === typeFilter)
      setRooms(data)
    } catch (err) {
      console.error('Error fetching rooms:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [statusFilter, typeFilter])

  const openCreateModal = () => {
    setEditingRoom(null)
    setFormData({
      number: '',
      type: 'STANDARD',
      floor: 1,
      capacity: 2,
      price_per_night: '',
      status: 'AVAILABLE',
      description: '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (room) => {
    setEditingRoom(room)
    setFormData({
      number: room.number,
      type: room.type,
      floor: room.floor ?? 1,
      capacity: room.capacity,
      price_per_night: room.price_per_night,
      status: room.status,
      description: room.description || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      const payload = {
        number: formData.number.trim(),
        type: formData.type,
        floor: Number(formData.floor),
        capacity: Number(formData.capacity),
        price_per_night: Number(formData.price_per_night),
        status: formData.status,
        description: formData.description?.trim() || undefined,
      }

      if (editingRoom) {
        await roomsAPI.update(editingRoom.id, payload)
      } else {
        await roomsAPI.create(payload)
      }

      setModalOpen(false)
      fetchRooms()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Erreur lors de la sauvegarde.'))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (room) => {
    setRoomToDelete(room)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!roomToDelete) return
    setDeleting(true)
    try {
      await roomsAPI.remove(roomToDelete.id)
      setDeleteModalOpen(false)
      fetchRooms()
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la suppression de la chambre.'))
    } finally {
      setDeleting(false)
    }
  }

  const filteredRooms = rooms.filter((r) =>
    r.number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <BedDouble size={22} />
            </div>
            Gestion des Chambres
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Inventaire et tarification des chambres de l'établissement
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2 shadow-sm hover:shadow-md">
          <Plus size={18} /> Ajouter une Chambre
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="shadow-card">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Rechercher par n°..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
            >
              <option value="">Tous les statuts</option>
              <option value="AVAILABLE">Disponible</option>
              <option value="OCCUPIED">Occupée</option>
              <option value="RESERVED">Réservée</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3.5 py-2 bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
            >
              <option value="">Tous les types</option>
              <option value="SINGLE">Single</option>
              <option value="DOUBLE">Double</option>
              <option value="DELUXE">Deluxe</option>
              <option value="SUITE">Suite</option>
              <option value="STANDARD">Standard</option>
            </select>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total : <span className="text-slate-900 dark:text-white font-bold">{filteredRooms.length}</span> chambre(s)
          </div>
        </CardContent>
      </Card>

      {/* Rooms Table */}
      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/40">
                <th className="py-4 px-5">Numéro</th>
                <th className="py-4 px-5">Type</th>
                <th className="py-4 px-5">Étage</th>
                <th className="py-4 px-5">Capacité</th>
                <th className="py-4 px-5">Prix / Nuit</th>
                <th className="py-4 px-5">Statut</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Chargement des chambres...
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Aucune chambre trouvée.
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5 font-bold font-heading text-slate-900 dark:text-white">Chambre {room.number}</td>
                    <td className="py-4 px-5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {room.type}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">Étage {room.floor}</td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">{room.capacity} pers.</td>
                    <td className="py-4 px-5 font-bold font-heading text-primary-700 dark:text-primary-400">
                      {new Intl.NumberFormat('fr-FR').format(Math.round(room.price_per_night))} Ar
                    </td>
                    <td className="py-4 px-5">
                      <Badge variant={room.status}>{room.status}</Badge>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(room)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-300 dark:hover:bg-primary-950/40 transition cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => confirmDelete(room)}
                          className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? 'Modifier la Chambre' : 'Nouvelle Chambre'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Numéro de Chambre"
              placeholder="ex: 101"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              required
            />
            <Select
              label="Type de Chambre"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              options={[
                { value: 'STANDARD', label: 'Standard' },
                { value: 'DELUXE', label: 'Deluxe' },
                { value: 'SUITE', label: 'Suite' },
                { value: 'SINGLE', label: 'Single' },
                { value: 'DOUBLE', label: 'Double' },
              ]}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Étage"
              type="number"
              min="0"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              required
            />
            <Input
              label="Capacité (pers.)"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
            />
            <Input
              label="Prix / Nuit (Ar)"
              type="number"
              min="0"
              step="0.01"
              placeholder="12000"
              value={formData.price_per_night}
              onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
              required
            />
          </div>

          <Select
            label="Statut Opérationnel"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            options={[
              { value: 'AVAILABLE', label: 'Disponible' },
              { value: 'MAINTENANCE', label: 'En Maintenance' },
              { value: 'OCCUPIED', label: 'Occupée' },
              { value: 'RESERVED', label: 'Réservée' },
            ]}
          />

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Description & Équipements</label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 bg-white dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm outline-none focus:border-brand-500"
              placeholder="Climatisation, WiFi haut débit, Vue sur mer..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {editingRoom ? 'Enregistrer les modifications' : 'Créer la chambre'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer la Chambre"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Êtes-vous sûr de vouloir supprimer la <strong className="text-slate-900 dark:text-white">Chambre {roomToDelete?.number}</strong> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


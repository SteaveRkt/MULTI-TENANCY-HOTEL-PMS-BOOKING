import { useState, useEffect } from 'react'
import { customersAPI, getApiErrorMessage } from '../../api/client'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, AlertCircle } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await customersAPI.list()
      setCustomers(res.data || [])
    } catch (err) {
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const openCreateModal = () => {
    setEditingCustomer(null)
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const openEditModal = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
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
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: [formData.city, formData.address].filter(Boolean).join(', ') || undefined,
      }

      if (editingCustomer) {
        await customersAPI.update(editingCustomer.id, payload)
      } else {
        await customersAPI.create(payload)
      }
      setModalOpen(false)
      fetchCustomers()
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Erreur lors de la sauvegarde du client.'))
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (customer) => {
    setCustomerToDelete(customer)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!customerToDelete) return
    setDeleting(true)
    try {
      await customersAPI.remove(customerToDelete.id)
      setDeleteModalOpen(false)
      fetchCustomers()
    } catch (err) {
      alert(getApiErrorMessage(err, 'Impossible de supprimer un client avec des réservations actives.'))
    } finally {
      setDeleting(false)
    }
  }

  const filteredCustomers = customers.filter((c) => {
    const full = `${c.first_name} ${c.last_name} ${c.email || ''} ${c.phone || ''}`.toLowerCase()
    return full.includes(searchTerm.toLowerCase())
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <Users size={22} />
            </div>
            Gestion des Clients (CRM)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fichier clients, coordonnées et historique de séjours
          </p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2 shadow-sm hover:shadow-md">
          <Plus size={18} /> Nouveau Client
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="shadow-card">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom, email, téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-slate-900 dark:text-white font-bold">{filteredCustomers.length}</span> client(s)
          </span>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/40">
                <th className="py-4 px-5">Client</th>
                <th className="py-4 px-5">Coordonnées</th>
                <th className="py-4 px-5">Localisation</th>
                <th className="py-4 px-5">Date d'inscription</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">
                    Chargement des clients...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">
                    Aucun client trouvé.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold font-heading text-slate-900 dark:text-white">
                        {customer.first_name} {customer.last_name}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <Mail size={13} className="text-slate-400" /> {customer.email || 'Sans email'}
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <Phone size={13} className="text-slate-400" /> {customer.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {customer.city || customer.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{customer.city || customer.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {customer.created_at
                        ? new Date(customer.created_at).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition"
                          title="Modifier le client"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => confirmDelete(customer)}
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10 transition"
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
        title={editingCustomer ? 'Modifier le Client' : 'Nouveau Client'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              placeholder="Jean"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Nom"
              placeholder="Dupont"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="jean.dupont@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Téléphone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ville"
              placeholder="Paris"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
            <Input
              label="Adresse"
              placeholder="12 rue des Fleurs"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              {editingCustomer ? 'Enregistrer les modifications' : 'Créer la fiche client'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer la Fiche Client"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Êtes-vous sûr de vouloir supprimer{' '}
            <strong className="text-slate-900 dark:text-white">
              {customerToDelete?.first_name} {customerToDelete?.last_name}
            </strong>{' '}
            ?
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


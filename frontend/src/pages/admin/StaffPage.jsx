import { useState, useEffect } from 'react'
import { usersAPI, getApiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { UserCog, Plus, Shield, User, Trash2, Mail, AlertCircle, Edit2 } from 'lucide-react'

export default function StaffPage() {
  const { user: currentUser, isAdmin } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST',
  })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Edit Role Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editRole, setEditRole] = useState('RECEPTIONIST')
  const [updatingRole, setUpdatingRole] = useState(false)

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await usersAPI.list()
      setUsers(res.data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const openAddModal = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'RECEPTIONIST',
    })
    setFormError('')
    setAddModalOpen(true)
  }

  const handleAddStaff = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)

    try {
      await usersAPI.create(formData)
      setAddModalOpen(false)
      fetchUsers()
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Erreur lors de l'ajout du membre."))
    } finally {
      setSaving(false)
    }
  }

  const openEditRoleModal = (user) => {
    setEditingUser(user)
    setEditRole(user.role)
    setEditModalOpen(true)
  }

  const handleUpdateRole = async (e) => {
    e.preventDefault()
    if (!editingUser) return
    setUpdatingRole(true)

    try {
      await usersAPI.update(editingUser.id, { role: editRole })
      setEditModalOpen(false)
      fetchUsers()
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la modification du rôle.'))
    } finally {
      setUpdatingRole(false)
    }
  }

  const confirmDelete = (user) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setDeleting(true)
    try {
      await usersAPI.remove(userToDelete.id)
      setDeleteModalOpen(false)
      fetchUsers()
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la suppression.'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <UserCog size={22} />
            </div>
            Équipe & Rôles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestion des accès du personnel hôtelier (Administrateurs et Réceptionnistes)
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openAddModal} className="flex items-center gap-2 shadow-sm hover:shadow-md">
            <Plus size={18} /> Ajouter un Membre
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/40">
                <th className="py-4 px-5">Utilisateur</th>
                <th className="py-4 px-5">Email</th>
                <th className="py-4 px-5">Rôle</th>
                <th className="py-4 px-5">Statut</th>
                <th className="py-4 px-5">Date de création</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    Chargement des membres...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold font-heading text-slate-900 dark:text-white flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-950/60 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300 border border-primary-200/80 dark:border-primary-800/60">
                          {u.first_name?.[0]}
                          {u.last_name?.[0]}
                        </div>
                        <div>
                          <span>
                            {u.first_name} {u.last_name}
                          </span>
                          {currentUser?.id === u.id && (
                            <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 font-bold border border-primary-200 dark:border-primary-900">
                              Vous
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail size={13} className="text-slate-400" /> {u.email}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={u.role}>{u.role}</Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Actif
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditRoleModal(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 transition"
                            title="Changer de rôle"
                          >
                            <Edit2 size={16} />
                          </button>
                          {currentUser?.id !== u.id && (
                            <button
                              onClick={() => confirmDelete(u)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/10 transition"
                              title="Supprimer l'accès"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Ajouter un Membre à l'Équipe"
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prénom"
              placeholder="Alice"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
            />
            <Input
              label="Nom"
              placeholder="Martin"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
            />
          </div>

          <Input
            label="Adresse Email"
            type="email"
            placeholder="alice.martin@hotel.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Mot de passe temporaire"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <Select
            label="Rôle et Permissions"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'RECEPTIONIST', label: 'Réceptionniste (Front-desk, Réservations)' },
              { value: 'ADMIN', label: 'Administrateur (Accès complet + Équipe)' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={saving}>
              Créer le compte
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modifier le Rôle"
        size="sm"
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Modifier le rôle de{' '}
            <strong className="text-slate-900 dark:text-white">
              {editingUser?.first_name} {editingUser?.last_name}
            </strong>
          </p>

          <Select
            label="Nouveau Rôle"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            options={[
              { value: 'RECEPTIONIST', label: 'Réceptionniste' },
              { value: 'ADMIN', label: 'Administrateur' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={updatingRole}>
              Mettre à jour
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Supprimer le Membre"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Êtes-vous sûr de vouloir révoquer l'accès de{' '}
            <strong className="text-slate-900 dark:text-white">
              {userToDelete?.first_name} {userToDelete?.last_name}
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


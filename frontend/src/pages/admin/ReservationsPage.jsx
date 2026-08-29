import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { reservationsAPI, roomsAPI, customersAPI, getApiErrorMessage } from '../../api/client'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle,
  LogOut,
  CreditCard,
  XCircle,
  FileText,
  AlertCircle,
  User,
  BedDouble,
  Loader2,
  Building2,
} from 'lucide-react'

export default function ReservationsPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [customersList, setCustomersList] = useState([])
  const [availableRooms, setAvailableRooms] = useState([])
  const [formData, setFormData] = useState({
    customer_id: '',
    room_id: '',
    check_in: '',
    check_out: '',
    number_of_guests: 1,
    special_requests: '',
  })
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [calculatedTotal, setCalculatedTotal] = useState(0)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CARD')
  const [paying, setPaying] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter) params.status = statusFilter
      const res = await reservationsAPI.list(params)
      setReservations(res.data || [])
    } catch (err) {
      console.error('Error fetching reservations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [statusFilter])

  const [loadingRooms, setLoadingRooms] = useState(false)
  const [allRooms, setAllRooms] = useState([])
  const [customerMode, setCustomerMode] = useState('existing') // 'existing' | 'new'
  const [newCustomerForm, setNewCustomerForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
  })

  const nightsCount = useMemo(() => {
    if (!formData.check_in || !formData.check_out) return 1
    const start = new Date(formData.check_in + 'T00:00:00')
    const end = new Date(formData.check_out + 'T00:00:00')
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    return isNaN(diff) || diff < 1 ? 1 : diff
  }, [formData.check_in, formData.check_out])

  const fetchAvailableRoomsForDates = async (checkIn, checkOut) => {
    if (!checkIn || !checkOut || checkIn >= checkOut) {
      return
    }
    try {
      setLoadingRooms(true)
      const res = await roomsAPI.available({ check_in: checkIn, check_out: checkOut })
      const freeRooms = res.data || []
      setAvailableRooms(freeRooms)

      // Auto-select first room or retain selected room if still available
      setFormData((prev) => {
        const stillAvailable = freeRooms.find((r) => r.id === prev.room_id)
        if (stillAvailable) {
          setSelectedRoom(stillAvailable)
          return prev
        }
        const first = freeRooms.length > 0 ? freeRooms[0] : null
        setSelectedRoom(first)
        return { ...prev, room_id: first ? first.id : '' }
      })
    } catch (err) {
      console.error('Error fetching available rooms for dates:', err)
    } finally {
      setLoadingRooms(false)
    }
  }

  const openCreateModal = async () => {
    setCreateError('')
    const today = new Date().toISOString().split('T')[0]
    const dTomorrow = new Date()
    dTomorrow.setDate(dTomorrow.getDate() + 1)
    const tomorrow = dTomorrow.toISOString().split('T')[0]

    setFormData({
      customer_id: '',
      room_id: '',
      check_in: today,
      check_out: tomorrow,
      number_of_guests: 1,
      special_requests: '',
    })
    setNewCustomerForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
    })
    setSelectedRoom(null)
    setCalculatedTotal(0)
    setCreateModalOpen(true)

    try {
      setLoadingRooms(true)
      const [custRes, freeRoomsRes, allRoomsRes] = await Promise.all([
        customersAPI.list(),
        roomsAPI.available({ check_in: today, check_out: tomorrow }),
        roomsAPI.list(),
      ])
      const cList = custRes.data || []
      const rList = freeRoomsRes.data || []
      const allR = (allRoomsRes.data || []).filter((r) => r.status !== 'MAINTENANCE')

      setCustomersList(cList)
      setAllRooms(allR)
      setAvailableRooms(rList)

      if (cList.length > 0) {
        setCustomerMode('existing')
        setFormData((prev) => ({ ...prev, customer_id: cList[0].id }))
      } else {
        setCustomerMode('new')
      }

      if (rList.length > 0) {
        setFormData((prev) => ({ ...prev, room_id: rList[0].id }))
        setSelectedRoom(rList[0])
      }
    } catch (err) {
      console.error('Error loading form data:', err)
    } finally {
      setLoadingRooms(false)
    }
  }

  // Trigger availability refresh when check_in or check_out change in the modal
  const handleCheckInChange = (newCheckIn) => {
    if (!newCheckIn) return
    let currentCheckOut = formData.check_out
    if (!currentCheckOut || newCheckIn >= currentCheckOut) {
      const dIn = new Date(newCheckIn + 'T00:00:00')
      dIn.setDate(dIn.getDate() + 1)
      currentCheckOut = dIn.toISOString().split('T')[0]
    }
    setFormData((prev) => ({ ...prev, check_in: newCheckIn, check_out: currentCheckOut }))
    fetchAvailableRoomsForDates(newCheckIn, currentCheckOut)
  }

  const handleCheckOutChange = (newCheckOut) => {
    if (!newCheckOut) return
    let currentCheckIn = formData.check_in
    if (currentCheckIn && newCheckOut <= currentCheckIn) {
      const dIn = new Date(currentCheckIn + 'T00:00:00')
      dIn.setDate(dIn.getDate() + 1)
      newCheckOut = dIn.toISOString().split('T')[0]
    }
    setFormData((prev) => ({ ...prev, check_out: newCheckOut }))
    fetchAvailableRoomsForDates(currentCheckIn, newCheckOut)
  }

  useEffect(() => {
    if (selectedRoom) {
      setCalculatedTotal(nightsCount * Number(selectedRoom.price_per_night || 0))
    }
  }, [nightsCount, selectedRoom])

  const handleRoomChange = (roomId) => {
    const room = availableRooms.find((r) => r.id === roomId)
    setSelectedRoom(room || null)
    setFormData((prev) => ({ ...prev, room_id: roomId }))
  }

  const handleCreateReservation = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)

    try {
      let finalCustomerId = formData.customer_id

      if (customerMode === 'new') {
        if (!newCustomerForm.first_name?.trim() || !newCustomerForm.last_name?.trim()) {
          setCreateError('Le prénom et le nom du nouveau client sont obligatoires.')
          setCreating(false)
          return
        }
        const custRes = await customersAPI.create({
          first_name: newCustomerForm.first_name.trim(),
          last_name: newCustomerForm.last_name.trim(),
          phone: newCustomerForm.phone.trim() || undefined,
          email: newCustomerForm.email.trim() || undefined,
          address: newCustomerForm.address.trim() || undefined,
        })
        const createdCustomer = custRes.data
        finalCustomerId = createdCustomer.id
        setCustomersList((prev) => [createdCustomer, ...prev])
      } else {
        if (!finalCustomerId) {
          setCreateError('Veuillez sélectionner un client dans la liste.')
          setCreating(false)
          return
        }
      }

      if (!formData.room_id) {
        setCreateError('Veuillez sélectionner une chambre disponible pour ces dates.')
        setCreating(false)
        return
      }

      await reservationsAPI.create({
        customer_id: finalCustomerId,
        room_id: formData.room_id,
        check_in: formData.check_in,
        check_out: formData.check_out,
        number_of_guests: Number(formData.number_of_guests),
        special_requests: formData.special_requests,
      })
      setCreateModalOpen(false)
      fetchReservations()
    } catch (err) {
      setCreateError(getApiErrorMessage(err, 'Erreur lors de la réservation.'))
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await reservationsAPI.updateStatus(id, newStatus)
      fetchReservations()
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors du changement de statut.'))
    }
  }

  const openPaymentModal = (reservation) => {
    setSelectedReservation(reservation)
    setPaymentAmount(reservation.total_price)
    setPaymentMethod('CARD')
    setPaymentError('')
    setPaymentModalOpen(true)
  }

  const handleCollectPayment = async (e) => {
    e.preventDefault()
    if (!selectedReservation) return
    setPaymentError('')
    setPaying(true)

    try {
      await reservationsAPI.addPayment(selectedReservation.id, {
        method: paymentMethod,
      })
      setPaymentModalOpen(false)
      fetchReservations()
    } catch (err) {
      setPaymentError(getApiErrorMessage(err, "Erreur lors de l'enregistrement du paiement."))
    } finally {
      setPaying(false)
    }
  }

  const handleDownloadInvoice = async (id, code) => {
    try {
      const res = await reservationsAPI.getInvoice(id)
      const disposition = res.headers ? res.headers['content-disposition'] : null
      let filename = `Facture_${code}.pdf`
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/)
        if (match && match[1]) filename = match[1]
      }
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      let message = 'Erreur lors du téléchargement de la facture.'
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const json = JSON.parse(text)
          if (json.detail) message = json.detail
        } catch (_) {}
      } else {
        message = getApiErrorMessage(err) || message
      }
      alert(message)
    }
  }

  const filteredReservations = reservations.filter((r) => {
    const code = r.reservation_code || ''
    const cust = r.customer_name || ''
    const staff = r.receptionist_name || ''
    const query = searchTerm.toLowerCase()
    const matchSearch =
      code.toLowerCase().includes(query) ||
      cust.toLowerCase().includes(query) ||
      staff.toLowerCase().includes(query)
    const matchStatus = !statusFilter || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <CalendarDays size={22} />
            </div>
            Planning des Réservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestion du front-desk, arrivées, départs et traçabilité des encaissements
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button onClick={openCreateModal} className="flex items-center gap-2 shadow-sm hover:shadow-md font-bold">
            <Plus size={18} /> Nouvelle Réservation
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200/80 dark:border-slate-700/60 pb-3">
        {[
          { label: 'Toutes', value: '' },
          { label: 'En attente', value: 'PENDING' },
          { label: 'Confirmées', value: 'CONFIRMED' },
          { label: 'En séjour (Checked-in)', value: 'CHECKED_IN' },
          { label: 'Terminées (Checked-out)', value: 'CHECKED_OUT' },
          { label: 'Annulées', value: 'CANCELLED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              statusFilter === tab.value
                ? 'bg-primary-600 text-white shadow-sm font-bold'
                : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <Card className="shadow-card">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher par code, client ou réceptionniste..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="text-slate-900 dark:text-white font-bold">{filteredReservations.length}</span> résultat(s)
          </span>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/40">
                <th className="py-4 px-5">Code</th>
                <th className="py-4 px-5">Séjour</th>
                <th className="py-4 px-5">Dates</th>
                <th className="py-4 px-5">Agent / Réception</th>
                <th className="py-4 px-5">Total</th>
                <th className="py-4 px-5">Statut</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Chargement des réservations...
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Aucune réservation trouvée pour ce filtre.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => {
                  const checkIn = new Date(r.check_in).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })
                  const checkOut = new Date(r.check_out).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                  })
                  const nights = Math.max(
                    1,
                    Math.ceil((new Date(r.check_out) - new Date(r.check_in)) / (1000 * 60 * 60 * 24))
                  )

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold text-primary-700 dark:text-primary-300 text-xs bg-primary-50 dark:bg-primary-950/60 px-2.5 py-1 rounded-lg border border-primary-100 dark:border-primary-900/60">
                          {r.reservation_code}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {r.customer_name ? r.customer_name : `${r.number_of_guests} pers.`}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {r.room_number ? `Chambre ${r.room_number} • ` : ''}{nights} nuit(s)
                        </div>
                      </td>
                      <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                        <span className="text-slate-900 dark:text-white font-medium">{checkIn}</span> → {checkOut}
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 text-xs">
                          <User size={13} className="text-primary-600 dark:text-primary-400 flex-shrink-0" />
                          <span className="truncate max-w-[130px]" title={r.receptionist_name || 'Portail Public'}>
                            {r.receptionist_name || 'Portail Public'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {r.user_id ? 'Au comptoir' : 'En ligne'}
                        </div>
                      </td>
                      <td className="py-4 px-5 font-bold font-heading text-slate-900 dark:text-white">
                        {new Intl.NumberFormat('fr-FR').format(Math.round(r.total_price))} Ar
                      </td>
                      <td className="py-4 px-5 space-y-1">
                        <div>
                          <Badge variant={r.status}>{r.status}</Badge>
                        </div>
                        <div>
                          <Badge variant={r.is_paid ? 'paid' : 'unpaid'}>
                            {r.is_paid ? 'Payé' : 'Non payé'}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* Check-In */}
                          {(r.status === 'CONFIRMED' || r.status === 'PENDING') && (
                            <button
                              onClick={() => handleStatusChange(r.id, 'CHECKED_IN')}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                              title="Arrivée du client"
                            >
                              <CheckCircle size={13} /> Check-in
                            </button>
                          )}

                          {/* Check-Out */}
                          {r.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleStatusChange(r.id, 'CHECKED_OUT')}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 border border-primary-200 dark:border-primary-900/40 hover:bg-primary-100 transition flex items-center gap-1 cursor-pointer"
                              title="Départ du client"
                            >
                              <LogOut size={13} /> Check-out
                            </button>
                          )}

                          {/* Collecter Paiement */}
                          {!r.is_paid && r.status !== 'CANCELLED' && (
                            <button
                              onClick={() => openPaymentModal(r)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer"
                              title="Encaisser un paiement"
                            >
                              <CreditCard size={13} /> Payer
                            </button>
                          )}

                          {/* Facture PDF */}
                          {r.is_paid ? (
                            <button
                              onClick={() => handleDownloadInvoice(r.id, r.reservation_code)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 border border-primary-200 dark:border-primary-900/40 hover:bg-primary-100 transition flex items-center gap-1 cursor-pointer"
                              title="Télécharger la Facture PDF"
                            >
                              <FileText size={13} /> Facture
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 cursor-not-allowed flex items-center gap-1 opacity-60"
                              title="Facture disponible après règlement"
                            >
                              <FileText size={13} /> Facture
                            </button>
                          )}

                          {/* Annuler */}
                          {r.status !== 'CANCELLED' && r.status !== 'CHECKED_OUT' && (
                            <button
                              onClick={() => handleStatusChange(r.id, 'CANCELLED')}
                              className="p-1.5 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/40 transition cursor-pointer"
                              title="Annuler la réservation"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal New Reservation */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Créer une Réservation au Comptoir"
        size="lg"
      >
        <form onSubmit={handleCreateReservation} className="space-y-5">
          {/* Traceability Header: Connected Receptionist & Hotel */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-primary-50/80 border border-primary-100 dark:bg-primary-950/40 dark:border-primary-900/40 text-xs text-primary-900 dark:text-primary-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary-200/70 dark:bg-primary-900 text-primary-800 dark:text-primary-300 font-bold flex items-center justify-center text-[10px]">
                {user?.first_name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span>
                Établi par : <strong>{user?.first_name} {user?.last_name}</strong> <span className="text-primary-600 dark:text-primary-400 font-medium">({user?.role === 'ADMIN' ? 'Admin' : 'Réceptionniste'})</span>
              </span>
            </div>
            <span className="font-bold text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-primary-200 dark:border-primary-800">
              {user?.hotel_name || user?.tenant_name || 'Hôtel'}
            </span>
          </div>

          {createError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle size={16} className="flex-shrink-0" /> {createError}
            </div>
          )}

          {/* Section 1: Client Selection / Creation Mode */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User size={14} className="text-primary-600" /> Informations Client
              </span>
              <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setCustomerMode('existing')}
                  disabled={customersList.length === 0}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    customerMode === 'existing'
                      ? 'bg-white text-primary-700 dark:bg-slate-700 dark:text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                  }`}
                >
                  Client Existant ({customersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode('new')}
                  className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                    customerMode === 'new'
                      ? 'bg-primary-600 text-white shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  + Nouveau Client
                </button>
              </div>
            </div>

            {/* Mode 1: Existing Customer */}
            {customerMode === 'existing' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                  Sélectionner le client *
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customer_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition cursor-pointer"
                  required={customerMode === 'existing'}
                >
                  <option value="">-- Choisir un client --</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : c.email ? `(${c.email})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Mode 2: Inline New Customer Creation */}
            {customerMode === 'new' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      required={customerMode === 'new'}
                      value={newCustomerForm.first_name}
                      onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, first_name: e.target.value }))}
                      placeholder="Ex: Jean"
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required={customerMode === 'new'}
                      value={newCustomerForm.last_name}
                      onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, last_name: e.target.value }))}
                      placeholder="Ex: Dupont"
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={newCustomerForm.phone}
                      onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Ex: +261 34 00 000 00"
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Email (optionnel)
                    </label>
                    <input
                      type="email"
                      value={newCustomerForm.email}
                      onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Ex: client@email.com"
                      className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                    Adresse ou N° CIN / Passeport (optionnel)
                  </label>
                  <input
                    type="text"
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm((prev) => ({ ...prev, address: e.target.value }))}
                    placeholder="Ex: Antananarivo ou CIN 101..."
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Dates de séjour */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date d'Arrivée *
                </label>
              </div>
              <input
                type="date"
                required
                value={formData.check_in}
                onChange={(e) => handleCheckInChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Date de Départ *
                </label>
                <span className="text-[11px] font-bold text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-900">
                  {nightsCount} nuit{nightsCount > 1 ? 's' : ''}
                </span>
              </div>
              <input
                type="date"
                required
                value={formData.check_out}
                onChange={(e) => handleCheckOutChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Section 3: Chambre disponible & Capacité */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Chambre Disponible *
                </label>
                {loadingRooms && (
                  <span className="text-[11px] text-primary-600 flex items-center gap-1 font-medium">
                    <Loader2 size={12} className="animate-spin" /> Vérification...
                  </span>
                )}
              </div>
              <select
                value={formData.room_id}
                onChange={(e) => handleRoomChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition cursor-pointer ${
                  availableRooms.length === 0 ? 'border-rose-300 bg-rose-50/30 dark:border-rose-800 dark:bg-rose-950/20' : 'border-slate-300 dark:border-slate-700'
                }`}
                required
                disabled={availableRooms.length === 0}
              >
                {availableRooms.length === 0 ? (
                  <option value="">Aucune chambre libre pour cette période</option>
                ) : (
                  availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Chambre {r.number} — {r.type} ({r.capacity} pers.) — {new Intl.NumberFormat('fr-FR').format(Math.round(r.price_per_night))} Ar/nuit
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Nombre de personnes *
              </label>
              <input
                type="number"
                min="1"
                max={selectedRoom?.capacity || 6}
                required
                value={formData.number_of_guests}
                onChange={(e) => setFormData((prev) => ({ ...prev, number_of_guests: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition"
              />
            </div>
          </div>

          {/* Price Preview Card */}
          <div className="p-4 bg-primary-50/80 border border-primary-200/80 dark:bg-primary-950/40 dark:border-primary-900/60 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-800 dark:text-primary-300 font-bold uppercase tracking-wider">
                Total Estimé du Séjour ({nightsCount} nuit{nightsCount > 1 ? 's' : ''})
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                {availableRooms.length} chambre{availableRooms.length > 1 ? 's' : ''} libre{availableRooms.length > 1 ? 's' : ''} pour ces dates
              </p>
            </div>
            <div className="text-2xl font-extrabold font-heading text-primary-700 dark:text-primary-300">
              {new Intl.NumberFormat('fr-FR').format(Math.round(calculatedTotal))} Ar
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">
              Demandes particulières (optionnel)
            </label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition"
              placeholder="Lit d'appoint, arrivée tardive, etc."
              value={formData.special_requests}
              onChange={(e) => setFormData((prev) => ({ ...prev, special_requests: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={creating || availableRooms.length === 0}
              className="font-bold shadow-sm"
            >
              {creating ? 'Enregistrement...' : 'Confirmer la Réservation'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Payment */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Encaisser un Paiement"
        size="md"
      >
        <form onSubmit={handleCollectPayment} className="space-y-4">
          {paymentError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {paymentError}
            </div>
          )}

          <div className="p-4 bg-primary-50/70 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/60 rounded-2xl">
            <p className="text-xs text-slate-500 dark:text-slate-400">Réservation N°</p>
            <p className="font-mono font-bold text-primary-700 dark:text-primary-300 text-base">
              {selectedReservation?.reservation_code}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
              Montant à encaisser :{' '}
              <strong className="text-slate-900 dark:text-white font-extrabold font-heading text-sm">
                {new Intl.NumberFormat('fr-FR').format(Math.round(selectedReservation?.total_price || 0))} Ar
              </strong>
            </p>
          </div>

          <Select
            label="Mode de Règlement"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'CASH', label: 'Espèces / Comptant' },
              { value: 'MOBILE_MONEY', label: 'Mobile Money (MVola, Orange Money, Airtel Money)' },
              { value: 'CARD', label: 'Carte Bancaire / Terminal TPE' },
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
            <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={paying} className="font-bold shadow-sm">
              Valider l'Encaissement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}


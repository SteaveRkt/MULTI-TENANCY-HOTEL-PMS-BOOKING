import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw,
  BedDouble,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Plus,
  Sparkles,
  Users,
  CheckCircle,
  Layers,
  AlertCircle,
} from 'lucide-react'
import { dashboardAPI, roomsAPI, customersAPI, reservationsAPI, getApiErrorMessage } from '../../api/client'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'

const STATUS_FILTERS = ['Tous', 'AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE']

const STATUS_LABELS = {
  AVAILABLE: 'Disponible',
  RESERVED: 'Réservé',
  OCCUPIED: 'Occupé',
  MAINTENANCE: 'Maintenance',
}

const STATUS_CARD_STYLES = {
  AVAILABLE:
    'border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50/80 dark:bg-emerald-950/20 dark:border-emerald-800/40 hover:border-emerald-400',
  RESERVED:
    'border-amber-200/80 bg-amber-50/40 hover:bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-800/40 hover:border-amber-400',
  OCCUPIED:
    'border-rose-200/80 bg-rose-50/40 hover:bg-rose-50/80 dark:bg-rose-950/20 dark:border-rose-800/40 hover:border-rose-400',
  MAINTENANCE:
    'border-slate-200/80 bg-slate-100/60 hover:bg-slate-100 dark:bg-slate-800/60 dark:border-slate-700 hover:border-slate-400',
}

const STATUS_DOT = {
  AVAILABLE: 'bg-emerald-500 ring-2 ring-emerald-500/20',
  RESERVED: 'bg-amber-500 ring-2 ring-amber-500/20',
  OCCUPIED: 'bg-rose-500 ring-2 ring-rose-500/20',
  MAINTENANCE: 'bg-slate-400 ring-2 ring-slate-400/20',
}

const COUNT_COLORS = {
  AVAILABLE:
    'text-emerald-700 bg-emerald-50/80 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800/60',
  RESERVED:
    'text-amber-700 bg-amber-50/80 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800/60',
  OCCUPIED:
    'text-rose-700 bg-rose-50/80 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40 dark:border-rose-800/60',
  MAINTENANCE:
    'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800/60 dark:border-slate-700',
}

const fmt = (n) => {
  const val = Math.round(n ?? 0)
  return `${new Intl.NumberFormat('fr-FR').format(val)} Ar`
}

export default function RoomsStatusGridPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('rack') // 'rack' | 'search'

  // --- RACK PAR DATE STATE ---
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [rooms, setRooms] = useState([])
  const [rackCounts, setRackCounts] = useState({ total: 0, available: 0, reserved: 0, occupied: 0, maintenance: 0 })
  const [loadingRack, setLoadingRack] = useState(true)
  const [filter, setFilter] = useState('Tous')
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedRoomDetail, setSelectedRoomDetail] = useState(null)

  // --- RECHERCHE DISPONIBILITÉ STATE ---
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const [searchParams, setSearchParams] = useState({
    check_in: todayStr,
    check_out: tomorrowStr,
    type: '',
    capacity: '',
  })
  const [availableResults, setAvailableResults] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchedNights, setSearchedNights] = useState(1)
  const [searchExecuted, setSearchExecuted] = useState(false)

  // --- DIRECT BOOKING MODAL STATE ---
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [bookingRoom, setBookingRoom] = useState(null)
  const [customersList, setCustomersList] = useState([])
  const [bookingCustomerMode, setBookingCustomerMode] = useState('existing') // 'existing' | 'new'
  const [bookingNewCustomer, setBookingNewCustomer] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
  })
  const [bookingForm, setBookingForm] = useState({
    customer_id: '',
    check_in: todayStr,
    check_out: tomorrowStr,
    number_of_guests: 1,
    special_requests: '',
  })
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')

  // 1. Fetch Room Rack for Selected Date
  const fetchRoomsRack = useCallback(async (targetDate) => {
    try {
      setLoadingRack(true)
      const res = await dashboardAPI.getRoomsStatus({ date: targetDate })
      const data = res.data ?? {}
      const roomList = data.rooms ?? []
      setRooms(roomList)
      setRackCounts({
        total: data.total_rooms ?? roomList.length,
        available: data.available ?? roomList.filter((r) => r.status === 'AVAILABLE').length,
        reserved: data.reserved ?? roomList.filter((r) => r.status === 'RESERVED').length,
        occupied: data.occupied ?? roomList.filter((r) => r.status === 'OCCUPIED').length,
        maintenance: data.maintenance ?? roomList.filter((r) => r.status === 'MAINTENANCE').length,
      })
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Error fetching room status:', err)
    } finally {
      setLoadingRack(false)
    }
  }, [])

  useEffect(() => {
    fetchRoomsRack(selectedDate)
  }, [selectedDate, fetchRoomsRack])

  // Date Navigation Helpers
  const handlePrevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleToday = () => {
    setSelectedDate(todayStr)
  }

  // 2. Search Available Rooms by Date Range
  const handleSearchAvailableRooms = async (e) => {
    if (e) e.preventDefault()
    if (!searchParams.check_in || !searchParams.check_out) return
    if (searchParams.check_in >= searchParams.check_out) {
      alert('La date de départ doit être postérieure à la date d’arrivée.')
      return
    }

    try {
      setLoadingSearch(true)
      const params = {
        check_in: searchParams.check_in,
        check_out: searchParams.check_out,
      }
      if (searchParams.type) params.type = searchParams.type
      if (searchParams.capacity) params.capacity = Number(searchParams.capacity)

      const res = await roomsAPI.available(params)
      const results = res.data || []
      setAvailableResults(results)

      const start = new Date(searchParams.check_in + 'T00:00:00')
      const end = new Date(searchParams.check_out + 'T00:00:00')
      const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
      setSearchedNights(nights)
      setSearchExecuted(true)
    } catch (err) {
      alert(getApiErrorMessage(err, 'Erreur lors de la recherche de disponibilité.'))
    } finally {
      setLoadingSearch(false)
    }
  }

  // Quick Book Action from Rack or Search Result
  const handleOpenBooking = async (room, customCheckIn, customCheckOut) => {
    const checkIn = customCheckIn || (activeTab === 'search' ? searchParams.check_in : selectedDate)
    const dEnd = new Date(checkIn + 'T00:00:00')
    dEnd.setDate(dEnd.getDate() + (activeTab === 'search' ? searchedNights : 1))
    const checkOut = customCheckOut || (activeTab === 'search' ? searchParams.check_out : dEnd.toISOString().split('T')[0])

    setBookingRoom(room)
    setBookingForm({
      customer_id: '',
      check_in: checkIn,
      check_out: checkOut,
      number_of_guests: Math.min(2, room.capacity || 2),
      special_requests: '',
    })
    setBookingNewCustomer({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      address: '',
    })
    setBookingError('')
    setBookingModalOpen(true)

    try {
      const custRes = await customersAPI.list()
      const list = custRes.data || []
      setCustomersList(list)
      if (list.length > 0) {
        setBookingCustomerMode('existing')
        setBookingForm((prev) => ({ ...prev, customer_id: list[0].id }))
      } else {
        setBookingCustomerMode('new')
      }
    } catch (err) {
      console.error('Error fetching customers list:', err)
    }
  }

  const handleConfirmBooking = async (e) => {
    e.preventDefault()
    setBookingSubmitting(true)
    setBookingError('')

    try {
      let finalCustomerId = bookingForm.customer_id

      if (bookingCustomerMode === 'new') {
        if (!bookingNewCustomer.first_name?.trim() || !bookingNewCustomer.last_name?.trim()) {
          setBookingError('Le prénom et le nom du nouveau client sont obligatoires.')
          setBookingSubmitting(false)
          return
        }
        const custRes = await customersAPI.create({
          first_name: bookingNewCustomer.first_name.trim(),
          last_name: bookingNewCustomer.last_name.trim(),
          phone: bookingNewCustomer.phone.trim() || undefined,
          email: bookingNewCustomer.email.trim() || undefined,
          address: bookingNewCustomer.address.trim() || undefined,
        })
        const createdCustomer = custRes.data
        finalCustomerId = createdCustomer.id
        setCustomersList((prev) => [createdCustomer, ...prev])
      } else {
        if (!finalCustomerId) {
          setBookingError('Veuillez sélectionner un client.')
          setBookingSubmitting(false)
          return
        }
      }

      await reservationsAPI.create({
        customer_id: finalCustomerId,
        room_id: bookingRoom.room_id || bookingRoom.id,
        check_in: bookingForm.check_in,
        check_out: bookingForm.check_out,
        number_of_guests: Number(bookingForm.number_of_guests),
        special_requests: bookingForm.special_requests,
      })
      setBookingModalOpen(false)
      setSelectedRoomDetail(null)
      fetchRoomsRack(selectedDate)
      if (activeTab === 'search') {
        handleSearchAvailableRooms()
      }
      alert('Réservation enregistrée avec succès !')
    } catch (err) {
      setBookingError(getApiErrorMessage(err, 'Erreur lors de la création de la réservation.'))
    } finally {
      setBookingSubmitting(false)
    }
  }

  const filteredRackRooms = filter === 'Tous' ? rooms : rooms.filter((r) => r.status === filter)

  const formattedSelectedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <BedDouble size={24} />
            </div>
            Rack des Chambres & Disponibilités
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Supervision du parc hôtelier par date et moteur de recherche de séjours
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-1.5 gap-1.5 shadow-subtle">
          <button
            onClick={() => setActiveTab('rack')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'rack'
                ? 'bg-white text-primary-700 shadow-sm border border-slate-200/80 dark:bg-primary-600 dark:text-white dark:border-transparent font-bold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers size={16} /> Rack par Date
          </button>
          <button
            onClick={() => {
              setActiveTab('search')
              if (!searchExecuted) handleSearchAvailableRooms()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-white text-primary-700 shadow-sm border border-slate-200/80 dark:bg-primary-600 dark:text-white dark:border-transparent font-bold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Search size={16} /> Recherche Séjour
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: VUE RACK PAR DATE */}
      {/* ========================================================================= */}
      {activeTab === 'rack' && (
        <div className="space-y-6">
          {/* Date Selector Bar */}
          <Card className="shadow-card border-slate-200/80">
            <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Day navigation controls */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                <button
                  onClick={handlePrevDay}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer shadow-subtle"
                  title="Jour précédent"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 text-primary-600 pointer-events-none" size={18} />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/70 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition cursor-pointer"
                  />
                </div>

                <button
                  onClick={handleNextDay}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition cursor-pointer shadow-subtle"
                  title="Jour suivant"
                >
                  <ChevronRight size={18} />
                </button>

                <button
                  onClick={handleToday}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    selectedDate === todayStr
                      ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-950/60 dark:text-primary-300 dark:border-primary-900'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  }`}
                >
                  Aujourd'hui
                </button>
              </div>

              {/* Date display banner */}
              <div className="text-center md:text-right">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                  État du parc au
                </span>
                <span className="text-base sm:text-lg font-extrabold font-heading text-slate-900 dark:text-white capitalize">
                  {formattedSelectedDate}
                </span>
              </div>

              {/* Refresh button */}
              <button
                onClick={() => fetchRoomsRack(selectedDate)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300/80 text-slate-700 hover:bg-slate-50 shadow-subtle text-xs font-semibold transition dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <RefreshCw size={14} className={loadingRack ? 'animate-spin text-primary-600' : ''} />
                Actualiser
              </button>
            </CardContent>
          </Card>

          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="bg-white border border-slate-200/80 shadow-card rounded-2xl p-4 text-center dark:bg-slate-800 dark:border-slate-700">
              <p className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
                {rackCounts.total}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Total Chambres</p>
            </div>
            {['AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE'].map((s) => (
              <div key={s} className={`border rounded-2xl p-4 text-center shadow-subtle ${COUNT_COLORS[s]}`}>
                <p className="text-2xl sm:text-3xl font-extrabold font-heading">
                  {rackCounts[s.toLowerCase()] ?? 0}
                </p>
                <p className="text-xs mt-0.5 font-semibold">{STATUS_LABELS[s]}</p>
              </div>
            ))}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
                    filter === f
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm font-bold'
                      : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:text-white'
                  }`}
                >
                  {f === 'Tous' ? 'Toutes les chambres' : STATUS_LABELS[f]}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Affichage de <span className="font-bold text-slate-900 dark:text-white">{filteredRackRooms.length}</span> chambre(s)
            </span>
          </div>

          {/* Rooms Grid */}
          {loadingRack ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-3">
              <Loader2 size={36} className="text-primary-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Chargement de l'état des chambres...</p>
            </div>
          ) : filteredRackRooms.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200/80 rounded-3xl dark:bg-slate-800 dark:border-slate-700 p-8 shadow-card">
              <BedDouble size={48} className="text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                Aucune chambre ne correspond à ce filtre pour la date sélectionnée.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredRackRooms.map((room) => {
                const isOccupied = room.status === 'OCCUPIED'
                const isReserved = room.status === 'RESERVED'
                const isAvailable = room.status === 'AVAILABLE'
                const curRes = room.current_reservation
                const nextRes = room.next_reservation

                return (
                  <div
                    key={room.room_id || room.id}
                    onClick={() => setSelectedRoomDetail(room)}
                    className={`border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-card cursor-pointer flex flex-col justify-between group ${
                      STATUS_CARD_STYLES[room.status] ?? 'border-slate-200 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div>
                      {/* Header: Room Number & Status Dot */}
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-2xl font-extrabold font-heading text-slate-900 dark:text-white leading-none">
                            {room.room_number || room.number}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                            Étage {room.floor || 1} · {room.capacity || 2} pers.
                          </span>
                        </div>
                        <span
                          className={`w-3.5 h-3.5 rounded-full mt-0.5 ${
                            STATUS_DOT[room.status] ?? 'bg-slate-400'
                          }`}
                        />
                      </div>

                      {/* Type & Price */}
                      <div className="flex items-center justify-between gap-1 mt-2">
                        <Badge variant={room.status}>{room.room_type || room.type}</Badge>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {fmt(room.price_per_night)}
                        </span>
                      </div>

                      {/* Active Guest Info on this date */}
                      {(isOccupied || isReserved) && curRes && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-slate-700/60 space-y-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            <User size={13} className="text-primary-600 flex-shrink-0" />
                            {curRes.customer_name || 'Client au comptoir'}
                          </p>
                          <p className="text-[11px] font-mono font-bold text-primary-700 dark:text-primary-300">
                            {curRes.reservation_code}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            Départ :{' '}
                            {new Date(curRes.check_out).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </p>
                        </div>
                      )}

                      {/* Available with Next Arrival */}
                      {isAvailable && (
                        <div className="mt-3 pt-2.5 border-t border-emerald-200/60 dark:border-emerald-800/40">
                          {nextRes ? (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                                Prochaine arrivée :
                              </span>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {new Date(nextRes.check_in).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                })}{' '}
                                ({nextRes.customer_name || 'Réservé'})
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle size={13} /> Prête pour réservation
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Status label & action */}
                    <div className="mt-3 pt-2 flex items-center justify-between">
                      <p
                        className={`text-[11px] font-bold uppercase tracking-wider ${
                          isAvailable
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : isReserved
                            ? 'text-amber-700 dark:text-amber-400'
                            : isOccupied
                            ? 'text-rose-700 dark:text-rose-400'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {STATUS_LABELS[room.status]}
                      </p>
                      <span className="text-xs text-primary-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        Détails →
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: RECHERCHE DE DISPONIBILITÉS PAR PÉRIODE */}
      {/* ========================================================================= */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Form Card */}
          <Card className="shadow-card border-slate-200/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search size={20} className="text-primary-600" />
                Rechercher les Chambres Disponibles par Date
              </CardTitle>
              <CardDescription>
                Indiquez les dates de séjour pour filtrer en direct les chambres libres et sans conflit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearchAvailableRooms} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Date d'arrivée *
                  </label>
                  <input
                    type="date"
                    required
                    value={searchParams.check_in}
                    onChange={(e) => setSearchParams({ ...searchParams, check_in: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Date de départ *
                  </label>
                  <input
                    type="date"
                    required
                    value={searchParams.check_out}
                    onChange={(e) => setSearchParams({ ...searchParams, check_out: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Type de chambre
                  </label>
                  <select
                    value={searchParams.type}
                    onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition"
                  >
                    <option value="">Tous les types</option>
                    <option value="STANDARD">Standard</option>
                    <option value="DELUXE">Deluxe</option>
                    <option value="SUITE">Suite</option>
                    <option value="SINGLE">Single</option>
                    <option value="DOUBLE">Double</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Capacité min.
                  </label>
                  <select
                    value={searchParams.capacity}
                    onChange={(e) => setSearchParams({ ...searchParams, capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition"
                  >
                    <option value="">Toute capacité</option>
                    <option value="1">1 personne</option>
                    <option value="2">2 personnes</option>
                    <option value="3">3 personnes</option>
                    <option value="4">4+ personnes</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={loadingSearch}
                  className="w-full py-2.5 flex items-center justify-center gap-2 shadow-sm font-bold"
                >
                  {loadingSearch ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Rechercher
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Search Results Summary */}
          {searchExecuted && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-primary-50/80 border border-primary-200/80 dark:bg-primary-950/40 dark:border-primary-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary-600 text-white shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div>
                  <p className="text-sm font-extrabold font-heading text-slate-900 dark:text-white">
                    {availableResults.length} chambre(s) libre(s) trouvée(s)
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Séjour du{' '}
                    <span className="font-semibold text-primary-700 dark:text-primary-300">
                      {new Date(searchParams.check_in).toLocaleDateString('fr-FR')}
                    </span>{' '}
                    au{' '}
                    <span className="font-semibold text-primary-700 dark:text-primary-300">
                      {new Date(searchParams.check_out).toLocaleDateString('fr-FR')}
                    </span>{' '}
                    ({searchedNights} nuit{searchedNights > 1 ? 's' : ''})
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-primary-800 dark:text-primary-300 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-primary-200 dark:border-primary-800">
                Zéro conflit garanti
              </span>
            </div>
          )}

          {/* Available Rooms Grid */}
          {loadingSearch ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 size={36} className="text-primary-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-500">Recherche des disponibilités en temps réel...</p>
            </div>
          ) : searchExecuted && availableResults.length === 0 ? (
            <div className="text-center py-20 bg-white border border-slate-200/80 rounded-3xl dark:bg-slate-800 dark:border-slate-700 p-8 shadow-card">
              <AlertCircle size={48} className="text-amber-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Aucune chambre disponible
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
                Toutes les chambres correspondant à vos critères sont complètes ou réservées pour cette période. Essayez d'autres dates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableResults.map((room) => {
                const pricePerNight = Number(room.price_per_night || 0)
                const totalPrice = pricePerNight * searchedNights

                return (
                  <Card key={room.id} className="shadow-card hover:shadow-float transition-all overflow-hidden border-slate-200/80">
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="text-xl font-extrabold font-heading text-slate-900 dark:text-white">
                              Chambre {room.number}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Étage {room.floor || 1}
                            </p>
                          </div>
                          <Badge variant="AVAILABLE">{room.type}</Badge>
                        </div>

                        {/* Capacity & Specs */}
                        <div className="flex items-center gap-4 py-2 border-y border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Users size={14} className="text-slate-400" />
                            {room.capacity} personne{room.capacity > 1 ? 's' : ''} max
                          </span>
                          <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                            <CheckCircle size={14} /> Disponible
                          </span>
                        </div>

                        {room.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                            {room.description}
                          </p>
                        )}
                      </div>

                      {/* Price & Book Button */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-extrabold font-heading text-primary-700 dark:text-primary-400 leading-tight">
                            {fmt(totalPrice)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {fmt(pricePerNight)} / nuit ({searchedNights} nuit{searchedNights > 1 ? 's' : ''})
                          </p>
                        </div>

                        <Button
                          onClick={() => handleOpenBooking(room, searchParams.check_in, searchParams.check_out)}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 font-bold shadow-sm cursor-pointer"
                        >
                          <Plus size={15} /> Réserver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ROOM DETAIL MODAL (Click on room in Rack) */}
      {/* ========================================================================= */}
      {selectedRoomDetail && (
        <Modal
          isOpen={Boolean(selectedRoomDetail)}
          onClose={() => setSelectedRoomDetail(null)}
          title={`Chambre ${selectedRoomDetail.room_number || selectedRoomDetail.number}`}
          size="md"
        >
          <div className="space-y-4">
            {/* Status chip banner */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3.5 h-3.5 rounded-full ${
                    STATUS_DOT[selectedRoomDetail.status] ?? 'bg-slate-400'
                  }`}
                />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {STATUS_LABELS[selectedRoomDetail.status]} au {formattedSelectedDate}
                </span>
              </div>
              <Badge variant={selectedRoomDetail.status}>{selectedRoomDetail.room_type || selectedRoomDetail.type}</Badge>
            </div>

            {/* Room specs */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-semibold block">Prix par nuit</span>
                <span className="font-extrabold font-heading text-primary-700 dark:text-primary-400 text-base">
                  {fmt(selectedRoomDetail.price_per_night)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs text-slate-400 font-semibold block">Capacité & Étage</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  Étage {selectedRoomDetail.floor || 1} ({selectedRoomDetail.capacity || 2} pers.)
                </span>
              </div>
            </div>

            {/* Current Active Stay Details if any */}
            {selectedRoomDetail.current_reservation && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-900/40 space-y-2">
                <p className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                  Séjour en cours
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Client :</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedRoomDetail.current_reservation.customer_name || 'Client direct'}
                    </span>
                  </div>
                  {selectedRoomDetail.current_reservation.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Téléphone :</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {selectedRoomDetail.current_reservation.customer_phone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Code réservation :</span>
                    <span className="font-mono font-bold text-primary-700 dark:text-primary-300">
                      {selectedRoomDetail.current_reservation.reservation_code}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Période :</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {new Date(selectedRoomDetail.current_reservation.check_in).toLocaleDateString('fr-FR')} →{' '}
                      {new Date(selectedRoomDetail.current_reservation.check_out).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Montant total :</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {fmt(selectedRoomDetail.current_reservation.total_price)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Reservation Details if any */}
            {selectedRoomDetail.next_reservation && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 dark:bg-slate-800/60 dark:border-slate-700 space-y-1.5 text-xs">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Prochaine réservation prévue
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client :</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedRoomDetail.next_reservation.customer_name || 'Réservé'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Arrivée :</span>
                  <span className="font-semibold text-primary-700 dark:text-primary-300">
                    {new Date(selectedRoomDetail.next_reservation.check_in).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              <Button
                variant="outline"
                onClick={() => setSelectedRoomDetail(null)}
              >
                Fermer
              </Button>

              {selectedRoomDetail.status === 'AVAILABLE' && (
                <Button
                  onClick={() => {
                    const room = selectedRoomDetail
                    setSelectedRoomDetail(null)
                    handleOpenBooking(room)
                  }}
                  className="flex items-center gap-2 font-bold"
                >
                  <Plus size={16} /> Réserver cette chambre
                </Button>
              )}

              {selectedRoomDetail.current_reservation && (
                <Button
                  onClick={() => {
                    setSelectedRoomDetail(null)
                    navigate('/admin/reservations')
                  }}
                  className="flex items-center gap-2 font-bold"
                >
                  Gérer les réservations
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* DIRECT BOOKING MODAL */}
      {/* ========================================================================= */}
      {bookingModalOpen && (
        <Modal
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          title={`Réserver la Chambre ${bookingRoom?.room_number || bookingRoom?.number}`}
          size="md"
        >
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2 font-medium">
                <AlertCircle size={16} /> {bookingError}
              </div>
            )}

            {/* Room mini recap */}
            <div className="p-3.5 rounded-xl bg-primary-50/70 border border-primary-100 dark:bg-primary-950/40 dark:border-primary-900/60 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block text-sm">
                  Chambre {bookingRoom?.room_number || bookingRoom?.number} ({bookingRoom?.room_type || bookingRoom?.type})
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Tarif : {fmt(bookingRoom?.price_per_night)} / nuit
                </span>
              </div>
              <Badge variant="AVAILABLE">Libre</Badge>
            </div>

            {/* Client Section */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <User size={13} className="text-primary-600" /> Client
                </span>
                <div className="flex bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setBookingCustomerMode('existing')}
                    disabled={customersList.length === 0}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      bookingCustomerMode === 'existing'
                        ? 'bg-white text-primary-700 dark:bg-slate-700 dark:text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400 disabled:opacity-40'
                    }`}
                  >
                    Existant ({customersList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingCustomerMode('new')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                      bookingCustomerMode === 'new'
                        ? 'bg-primary-600 text-white shadow-sm font-bold'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    + Nouveau
                  </button>
                </div>
              </div>

              {bookingCustomerMode === 'existing' ? (
                <div>
                  <select
                    required={bookingCustomerMode === 'existing'}
                    value={bookingForm.customer_id}
                    onChange={(e) => setBookingForm({ ...bookingForm, customer_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition cursor-pointer"
                  >
                    <option value="">Sélectionner un client...</option>
                    {customersList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} ({c.phone || c.email || 'Sans contact'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required={bookingCustomerMode === 'new'}
                      placeholder="Prénom *"
                      value={bookingNewCustomer.first_name}
                      onChange={(e) => setBookingNewCustomer({ ...bookingNewCustomer, first_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-primary-500"
                    />
                    <input
                      type="text"
                      required={bookingCustomerMode === 'new'}
                      placeholder="Nom *"
                      value={bookingNewCustomer.last_name}
                      onChange={(e) => setBookingNewCustomer({ ...bookingNewCustomer, last_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      value={bookingNewCustomer.phone}
                      onChange={(e) => setBookingNewCustomer({ ...bookingNewCustomer, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-primary-500"
                    />
                    <input
                      type="email"
                      placeholder="Email (optionnel)"
                      value={bookingNewCustomer.email}
                      onChange={(e) => setBookingNewCustomer({ ...bookingNewCustomer, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Date d'arrivée
                </label>
                <input
                  type="date"
                  required
                  value={bookingForm.check_in}
                  onChange={(e) => setBookingForm({ ...bookingForm, check_in: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Date de départ
                </label>
                <input
                  type="date"
                  required
                  value={bookingForm.check_out}
                  onChange={(e) => setBookingForm({ ...bookingForm, check_out: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Nombre de personnes
              </label>
              <input
                type="number"
                min="1"
                max={bookingRoom?.capacity || 4}
                value={bookingForm.number_of_guests}
                onChange={(e) => setBookingForm({ ...bookingForm, number_of_guests: e.target.value })}
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Demandes particulières (optionnel)
              </label>
              <textarea
                rows={2}
                value={bookingForm.special_requests}
                onChange={(e) => setBookingForm({ ...bookingForm, special_requests: e.target.value })}
                placeholder="Lit bébé, arrivée tardive..."
                className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBookingModalOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={bookingSubmitting}
                className="flex items-center gap-2 font-bold shadow-sm"
              >
                {bookingSubmitting && <Loader2 size={16} className="animate-spin" />}
                Valider la réservation
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

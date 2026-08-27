import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, BedDouble, Users, Star, ChevronRight, Loader2, AlertCircle, MapPin } from 'lucide-react'
import { publicAPI, getApiErrorMessage } from '../../api/client'

const ROOM_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'SINGLE', label: 'Single' },
  { value: 'DOUBLE', label: 'Double' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DELUXE', label: 'Deluxe' },
  { value: 'SUITE', label: 'Suite' },
]

const typeColors = {
  SINGLE: 'from-sky-600 to-sky-800',
  DOUBLE: 'from-indigo-600 to-indigo-800',
  STANDARD: 'from-slate-600 to-slate-800',
  DELUXE: 'from-amber-600 to-amber-800',
  SUITE: 'from-violet-600 to-violet-800',
}

function RoomSkeleton() {
  return (
    <div className="bg-white border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700/50 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-48 bg-slate-200 dark:bg-slate-700/50" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [hotels, setHotels] = useState([])
  const [form, setForm] = useState({
    city: '',
    check_in: today,
    check_out: tomorrow,
    number_of_guests: 1,
    max_price: 300000,
    room_type: '',
  })
  const [rooms, setRooms] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch available hotels/cities on load
  useEffect(() => {
    publicAPI
      .getHotels()
      .then((res) => {
        const hotelList = res.data || []
        setHotels(hotelList)
        // If hotels exist and form.city is empty, preset first city
        if (hotelList.length > 0 && hotelList[0].city) {
          setForm((prev) => (prev.city ? prev : { ...prev, city: hotelList[0].city }))
        }
      })
      .catch(() => {
        // Non-blocking fallback
      })
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const params = {
        city: form.city.trim() || '',
        check_in: form.check_in,
        check_out: form.check_out,
        guests: Number(form.number_of_guests),
        max_price: Number(form.max_price),
      }
      if (form.room_type) {
        params.room_type = form.room_type
      }
      const res = await publicAPI.getAvailableRooms(params)
      setRooms(res.data?.rooms ?? res.data ?? [])
      setSearched(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la recherche. Veuillez réessayer.'))
    } finally {
      setLoading(false)
    }
  }

  const handleBook = (room) => {
    const normalizedRoom = {
      ...room,
      id: room.room_id || room.id,
      number: room.room_number || room.number,
      type: room.room_type || room.type,
      price_per_night: room.price_per_night,
      hotel_name: room.hotel_name,
    }
    navigate('/checkout', {
      state: {
        room: normalizedRoom,
        check_in: form.check_in,
        check_out: form.check_out,
        guests: form.number_of_guests,
      },
    })
  }

  // Unique list of cities from hotels
  const availableCities = Array.from(
    new Set(hotels.map((h) => h.city).filter(Boolean))
  )

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative pt-14 pb-20 sm:pt-20 sm:pb-28 px-4 text-center overflow-hidden">
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700 dark:bg-primary-950/60 dark:border-primary-900/60 dark:text-primary-300 text-xs font-semibold mb-6 shadow-subtle">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            Plateforme Hôtelière & Réservations Directes
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-heading text-slate-900 dark:text-white mb-5 leading-[1.15] tracking-tight">
            Trouvez votre chambre <br />
            <span className="text-primary-600 dark:text-primary-400">au meilleur tarif garanti</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg mb-8 max-w-xl mx-auto font-normal">
            Consultez les disponibilités en temps réel, réservez instantanément et profitez d'un séjour sur mesure.
          </p>
        </div>
      </div>

      {/* Search Widget Card */}
      <div className="max-w-5xl mx-auto px-4 -mt-10 sm:-mt-16 mb-14">
        <form
          onSubmit={handleSearch}
          className="bg-white border border-slate-200/90 shadow-float rounded-3xl p-5 sm:p-7 dark:bg-slate-800 dark:border-slate-700/80 transition-colors"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
            {/* Ville / Destination */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1">
                <MapPin size={13} className="text-primary-600" /> Destination
              </label>
              <input
                type="text"
                required
                list="city-options"
                placeholder="ex: Nosy Be, Tamatave.."
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white transition-all text-sm"
              />
              <datalist id="city-options">
                {availableCities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {/* Date d'Arrivée */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Date d'Arrivée
              </label>
              <input
                type="date"
                required
                value={form.check_in}
                min={today}
                onChange={(e) => setForm((p) => ({ ...p, check_in: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white transition-all text-sm"
              />
            </div>

            {/* Date de Départ */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Date de Départ
              </label>
              <input
                type="date"
                required
                value={form.check_out}
                min={form.check_in}
                onChange={(e) => setForm((p) => ({ ...p, check_out: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white transition-all text-sm"
              />
            </div>

            {/* Voyageurs */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Voyageurs
              </label>
              <select
                value={form.number_of_guests}
                onChange={(e) =>
                  setForm((p) => ({ ...p, number_of_guests: Number(e.target.value) }))
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white transition-all text-sm"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} voyageur{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Type de Chambre */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                Type de Chambre
              </label>
              <select
                value={form.room_type}
                onChange={(e) => setForm((p) => ({ ...p, room_type: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white transition-all text-sm"
              >
                {ROOM_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price range slider */}
          <div className="mb-6 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Budget maximum / nuit
              </label>
              <span className="text-sm font-extrabold font-heading text-primary-600 dark:text-primary-400">
                {new Intl.NumberFormat('fr-FR').format(form.max_price)} Ar
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={300000}
              step={5000}
              value={form.max_price}
              onChange={(e) => setForm((p) => ({ ...p, max_price: Number(e.target.value) }))}
              className="w-full accent-primary-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 mt-1">
              <span>5 000 Ar</span>
              <span>300 000 Ar</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:shadow-primary-600/20 transition-all disabled:opacity-50 active:scale-[0.99] cursor-pointer"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            Trouver les chambres disponibles
          </button>
        </form>
      </div>

      {/* Error alert */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 mb-6">
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-sm font-medium">
            <AlertCircle size={16} />
            {error}
          </div>
        </div>
      )}

      {/* Results grid */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RoomSkeleton key={i} />
            ))}
          </div>
        ) : searched && rooms.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-200/80 rounded-3xl dark:bg-slate-800 dark:border-slate-700 p-8 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <BedDouble size={28} />
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
              Aucune chambre disponible
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
              Essayez d'élargir vos dates, de changer de ville ou d'augmenter votre budget.
            </p>
          </div>
        ) : rooms.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 dark:text-white">
                {rooms.length} chambre{rooms.length > 1 ? 's' : ''} disponible
                {rooms.length > 1 ? 's' : ''}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => {
                const roomType = room.room_type || room.type || 'STANDARD'
                const roomNumber = room.room_number || room.number
                const roomId = room.room_id || room.id

                return (
                  <div
                    key={roomId}
                    className="bg-white border border-slate-200/80 shadow-card hover:shadow-card-hover dark:bg-slate-800 dark:border-slate-700/80 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col justify-between group"
                  >
                    {/* Header banner */}
                    <div className="h-44 bg-gradient-to-br from-slate-850 to-slate-950 text-white relative p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between z-10">
                        {room.hotel_name && (
                          <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                            {room.hotel_name}
                          </span>
                        )}
                        <span className="px-3 py-1 rounded-full bg-primary-500/80 backdrop-blur-md text-white text-xs font-bold border border-primary-400/20">
                          {roomType}
                        </span>
                      </div>

                      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                        <BedDouble size={80} className="text-white" />
                      </div>

                      <div className="z-10">
                        <span className="text-xl sm:text-2xl font-black font-heading text-white">
                          Chambre {roomNumber}
                        </span>
                      </div>
                    </div>

                    {/* Room details */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                          <span className="flex items-center gap-1 font-medium">
                            <Users size={14} className="text-slate-400" /> {room.capacity} personnes
                          </span>
                          {room.city && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-medium">
                                <MapPin size={13} className="text-slate-400" /> {room.city}
                              </span>
                            </>
                          )}
                        </div>

                        {room.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                            {room.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60">
                        <div>
                          <span className="text-xl sm:text-2xl font-extrabold font-heading text-primary-600 dark:text-primary-400">
                            {new Intl.NumberFormat('fr-FR').format(Math.round(room.price_per_night))} Ar
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium"> / nuit</span>
                        </div>
                        <button
                          onClick={() => handleBook(room)}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md hover:shadow-primary-600/20 active:scale-95 cursor-pointer"
                        >
                          Réserver <ChevronRight size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

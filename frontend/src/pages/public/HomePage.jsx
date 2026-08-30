import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search,
  BedDouble,
  Users,
  Star,
  ChevronRight,
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  SlidersHorizontal,
  ArrowUpDown,
  RotateCcw,
  Building2,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  CreditCard,
  Headphones,
  CheckCircle2,
  Award,
  Clock,
  Compass,
} from 'lucide-react'
import { publicAPI, getApiErrorMessage } from '../../api/client'
import RoomImageSlider from '../../components/public/RoomImageSlider'
import Modal from '../../components/ui/Modal'
import Reveal, { RevealGroup } from '../../components/ui/Reveal'

const ROOM_TYPES = [
  { value: '', label: 'Tous les types' },
  { value: 'SINGLE', label: 'Single' },
  { value: 'DOUBLE', label: 'Double' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DELUXE', label: 'Deluxe' },
  { value: 'SUITE', label: 'Suite' },
]

const QUICK_BUDGET_RANGES = [
  { label: 'Tous les prix', min: 0, max: 1000000 },
  { label: '< 50 000 Ar', min: 0, max: 50000 },
  { label: '50k - 100k Ar', min: 50000, max: 100000 },
  { label: '100k - 200k Ar', min: 100000, max: 200000 },
  { label: '> 200 000 Ar', min: 200000, max: 1000000 },
]

const FEATURED_DESTINATIONS = [
  {
    city: 'Antananarivo',
    tag: 'Capitale & Affaires',
    desc: 'Hôtels de standing et séjours d’affaires au cœur de la ville',
    image: 'https://images.unsplash.com/photo-1719850520902-16ec4568ae0b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8QW50YW5hbmFyaXZvfGVufDB8fDB8fHww',
  },
  {
    city: 'Nosy Be',
    tag: 'Plages & Détente',
    desc: 'Bungalows de charme et resorts pieds dans l’eau',
    image: 'https://images.unsplash.com/photo-1613409466099-04ebd4d69d7a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Tm9zeSUyMEJlfGVufDB8fDB8fHww',
  },
  {
    city: 'Fianarantsoa',
    tag: 'Culture & Nature',
    desc: 'Établissements conviviaux et étapes incontournables',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRaixyJ4g2hkP2AkgNTD6oVAoMx2xxGY-nMU2u_fOLVA&s=10',
  },
  {
    city: 'Toliara',
    tag: 'Partie Sud ',
    desc: 'Séjours en bord de mer et détente tropicale',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRt_SwLkt5dTn5vfo39EXSwOzuRZWJAjuz7HmH-aohLg&s=10',
  },
]
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
  })

  // Raw fetched rooms
  const [rawRooms, setRawRooms] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Post-Search Interactive Filters (Hotels.com style)
  const [filterMinPrice, setFilterMinPrice] = useState(0)
  const [filterMaxPrice, setFilterMaxPrice] = useState(500000)
  const [filterRoomType, setFilterRoomType] = useState('')
  const [filterHotel, setFilterHotel] = useState('')
  const [filterCapacity, setFilterCapacity] = useState(1)
  const [sortBy, setSortBy] = useState('rating_desc')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [reviewDrafts, setReviewDrafts] = useState({})
  const [reviewSubmitting, setReviewSubmitting] = useState({})
  const [expandedReviews, setExpandedReviews] = useState({})
  const [reviewModalRoomId, setReviewModalRoomId] = useState(null)
  const [reviewModalDraft, setReviewModalDraft] = useState({ rating: 0, reviewer_name: '', comment: '' })

  // Fetch available hotels/cities on load
  useEffect(() => {
    publicAPI
      .getHotels()
      .then((res) => {
        const hotelList = res.data || []
        setHotels(hotelList)
        if (hotelList.length > 0 && hotelList[0].city) {
          setForm((prev) => (prev.city ? prev : { ...prev, city: hotelList[0].city }))
        }
      })
      .catch(() => {})
  }, [])

  // Calculate number of nights
  const nightsCount = useMemo(() => {
    if (!form.check_in || !form.check_out) return 1
    const d1 = new Date(form.check_in + 'T00:00:00')
    const d2 = new Date(form.check_out + 'T00:00:00')
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24))
    return isNaN(diff) || diff < 1 ? 1 : diff
  }, [form.check_in, form.check_out])

  const handleSearch = async (e, forcedCity = null) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError('')
    const targetCity = forcedCity !== null ? forcedCity : form.city
    try {
      const params = {
        city: targetCity.trim() || '',
        check_in: form.check_in,
        check_out: form.check_out,
        guests: Number(form.number_of_guests),
      }
      const res = await publicAPI.getAvailableRooms(params)
      const fetched = res.data?.rooms ?? res.data ?? []
      setRawRooms(fetched)
      setSearched(true)

      if (forcedCity !== null) {
        setForm((p) => ({ ...p, city: forcedCity }))
      }

      // Calculate dynamic max price from results if available
      if (fetched.length > 0) {
        const maxFound = Math.max(...fetched.map((r) => Number(r.price_per_night || 0)))
        setFilterMinPrice(0)
        setFilterMaxPrice(Math.max(maxFound, 200000))
      }

      // Scroll to results
      setTimeout(() => {
        const el = document.getElementById('search-results')
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la recherche. Veuillez réessayer.'))
    } finally {
      setLoading(false)
    }
  }

  // Filtered & Sorted Rooms (Client-side real-time responsiveness)
  const filteredAndSortedRooms = useMemo(() => {
    let list = [...rawRooms]

    // Filter by Price range
    list = list.filter((r) => {
      const price = Number(r.price_per_night || 0)
      return price >= filterMinPrice && price <= filterMaxPrice
    })

    // Filter by Room Type
    if (filterRoomType) {
      list = list.filter((r) => {
        const type = (r.room_type || r.type || '').toUpperCase()
        return type === filterRoomType.toUpperCase()
      })
    }

    // Filter by Hotel
    if (filterHotel) {
      list = list.filter((r) => (r.hotel_name || '').toLowerCase() === filterHotel.toLowerCase())
    }

    // Filter by Capacity
    if (filterCapacity > 1) {
      list = list.filter((r) => Number(r.capacity || 1) >= filterCapacity)
    }

    // Sorting
    list.sort((a, b) => {
      const priceA = Number(a.price_per_night || 0)
      const priceB = Number(b.price_per_night || 0)
      const ratingA = Number(a.rating || 0)
      const ratingB = Number(b.rating || 0)

      if (sortBy === 'rating_desc') return ratingB - ratingA || priceA - priceB
      if (sortBy === 'rating_asc') return ratingA - ratingB || priceA - priceB
      if (sortBy === 'price_asc') return priceA - priceB
      if (sortBy === 'price_desc') return priceB - priceA
      if (sortBy === 'capacity_desc') return (b.capacity || 1) - (a.capacity || 1)
      if (sortBy === 'name_asc') {
        const nameA = a.hotel_name || a.room_number || ''
        const nameB = b.hotel_name || b.room_number || ''
        return nameA.localeCompare(nameB)
      }
      return 0
    })

    return list
  }, [rawRooms, filterMinPrice, filterMaxPrice, filterRoomType, filterHotel, filterCapacity, sortBy])

  const handleReviewSubmit = async (roomId, draftOverride = null) => {
    const draft = draftOverride || reviewDrafts[roomId] || { rating: 0, reviewer_name: '', comment: '' }
    const rating = Number(draft.rating || 0)
    const reviewerName = String(draft.reviewer_name || '').trim()
    const comment = String(draft.comment || '').trim()

    if (!rating || rating < 1 || rating > 5) return
    if (!reviewerName) {
      setError('Merci de renseigner votre nom avant de publier votre avis.')
      return
    }
    if (!comment) {
      setError('Merci d’ajouter un commentaire avant de publier votre avis.')
      return
    }

    setReviewSubmitting((prev) => ({ ...prev, [roomId]: true }))
    try {
      const res = await publicAPI.submitRoomReview(roomId, {
        rating,
        reviewer_name: reviewerName,
        comment,
      })
      const updatedRating = Number(res?.data?.rating ?? rating)
      const updatedReviewsCount = Number(res?.data?.reviews_count ?? 0)

      setRawRooms((prev) =>
        prev.map((room) => {
          const currentRoomId = room.room_id || room.id
          if (currentRoomId !== roomId) return room
          const existingReviews = Array.isArray(room.reviews) ? room.reviews : []
          const newReview = {
            reviewer_name: reviewerName,
            rating,
            comment,
          }
          return {
            ...room,
            rating: updatedRating,
            reviews_count: updatedReviewsCount,
            reviews: [...existingReviews, newReview],
          }
        })
      )

      setReviewDrafts((prev) => ({
        ...prev,
        [roomId]: { rating: 0, reviewer_name: '', comment: '' },
      }))
      setReviewModalDraft({ rating: 0, reviewer_name: '', comment: '' })
      setReviewModalRoomId(null)
      setError('')
    } catch (err) {
      setError(getApiErrorMessage(err, 'La note n’a pas pu être enregistrée.'))
    } finally {
      setReviewSubmitting((prev) => ({ ...prev, [roomId]: false }))
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
  const availableCities = useMemo(() => {
    return Array.from(new Set(hotels.map((h) => h.city).filter(Boolean)))
  }, [hotels])

  // Unique hotels present in current search results
  const resultHotels = useMemo(() => {
    return Array.from(new Set(rawRooms.map((r) => r.hotel_name).filter(Boolean)))
  }, [rawRooms])

  const resetFilters = () => {
    setFilterMinPrice(0)
    setFilterMaxPrice(500000)
    setFilterRoomType('')
    setFilterHotel('')
    setFilterCapacity(1)
    setSortBy('rating_desc')
  }

  const hasActiveFilters =
    filterMinPrice > 0 ||
    filterMaxPrice < 500000 ||
    filterRoomType !== '' ||
    filterHotel !== '' ||
    filterCapacity > 1

  const reviewModalRoom = reviewModalRoomId
    ? rawRooms.find((room) => (room.room_id || room.id) === reviewModalRoomId) || null
    : null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* 1. HERO SECTION & FAST SEARCH BAR */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary-500/10 dark:bg-primary-600/15 blur-[120px] rounded-full pointer-events-none" />

        <Reveal y={24} duration={0.6} amount={0.4} className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/70 border border-primary-100 dark:border-primary-900 text-primary-700 dark:text-primary-300 text-xs font-bold mb-5 shadow-subtle">
            <Sparkles size={13} className="text-amber-500 fill-amber-500" />
            Réservations Directes d'Hôtels & Séjours Garantis
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-heading text-slate-900 dark:text-white mb-4 leading-[1.12] tracking-tight">
            Trouvez et réservez votre séjour <br />
            <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 bg-clip-text text-transparent">
              au meilleur tarif en direct
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base mb-8 max-w-xl mx-auto font-normal leading-relaxed">
            Consultez les disponibilités en temps réel, sans intermédiaire et avec confirmation immédiate.
          </p>
        </Reveal>

        {/* Fast Search Card (No budget slider here, as requested) */}
        <Reveal y={24} duration={0.6} delay={0.12} amount={0.4} className="max-w-5xl mx-auto">
          <form
            onSubmit={(e) => handleSearch(e)}
            className="bg-white border border-slate-200/90 shadow-float rounded-3xl p-4 sm:p-6 dark:bg-slate-900 dark:border-slate-800 transition-colors"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
              {/* 1. Destination */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary-600 dark:text-primary-400" /> Destination
                </label>
                <input
                  type="text"
                  required
                  list="city-options"
                  placeholder="Ville (ex: Nosy Be, Tamatave..)"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-950 dark:border-slate-700 dark:text-white transition-all text-sm font-medium"
                />
                <datalist id="city-options">
                  {availableCities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* 2. Date d'Arrivée */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary-600 dark:text-primary-400" /> Arrivée
                </label>
                <input
                  type="date"
                  required
                  value={form.check_in}
                  min={today}
                  onChange={(e) => {
                    const newIn = e.target.value
                    let newOut = form.check_out
                    if (newIn >= newOut) {
                      const dIn = new Date(newIn + 'T00:00:00')
                      dIn.setDate(dIn.getDate() + 1)
                      newOut = dIn.toISOString().split('T')[0]
                    }
                    setForm((p) => ({ ...p, check_in: newIn, check_out: newOut }))
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-950 dark:border-slate-700 dark:text-white transition-all text-sm font-medium"
                />
              </div>

              {/* 3. Date de Départ */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary-600 dark:text-primary-400" /> Départ
                </label>
                <input
                  type="date"
                  required
                  value={form.check_out}
                  min={form.check_in}
                  onChange={(e) => setForm((p) => ({ ...p, check_out: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-950 dark:border-slate-700 dark:text-white transition-all text-sm font-medium"
                />
              </div>

              {/* 4. Voyageurs */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Users size={14} className="text-primary-600 dark:text-primary-400" /> Voyageurs
                </label>
                <select
                  value={form.number_of_guests}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, number_of_guests: Number(e.target.value) }))
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-950 dark:border-slate-700 dark:text-white transition-all text-sm font-medium cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} voyageur{n > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:shadow-primary-600/20 transition-all disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              Rechercher & Réserver mon séjour
            </button>
          </form>
        </Reveal>
      </section>

      {/* 2. RESULTS SECTION WITH HOTELS.COM STYLE FILTERS */}
      <div id="search-results" className="max-w-7xl mx-auto px-4 pb-16">
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <RoomSkeleton key={i} />
            ))}
          </div>
        ) : searched && rawRooms.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-3xl dark:bg-slate-900 dark:border-slate-800 p-8 shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <BedDouble size={28} />
            </div>
            <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">
              Aucun hébergement disponible à ces dates
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
              Toutes les chambres sont réservées pour cette période. Essayez d'autres dates ou une autre destination.
            </p>
          </div>
        ) : searched && rawRooms.length > 0 ? (
          <div className="space-y-6">
            {/* Summary Bar & Quick Sort */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold font-heading text-slate-900 dark:text-white">
                  {filteredAndSortedRooms.length} hébergement{filteredAndSortedRooms.length > 1 ? 's' : ''} disponible{filteredAndSortedRooms.length > 1 ? 's' : ''} à {form.city || 'votre destination'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Du {new Date(form.check_in).toLocaleDateString('fr-FR')} au {new Date(form.check_out).toLocaleDateString('fr-FR')} • <strong>{nightsCount} nuit(s)</strong> • {form.number_of_guests} pers.
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <SlidersHorizontal size={14} />
                  Filtres {hasActiveFilters && '(actifs)'}
                </button>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-500 font-semibold hidden sm:inline">Trier par :</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-primary-500 transition-all cursor-pointer"
                  >
                    <option value="rating_desc">Note la plus élevée</option>
                    <option value="rating_asc">Note la plus faible</option>
                    <option value="price_asc">Prix le plus bas (croissant)</option>
                    <option value="price_desc">Prix le plus élevé (décroissant)</option>
                    <option value="capacity_desc">Capacité maximale</option>
                    <option value="name_asc">Nom de l'hôtel</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Layout: Filters Sidebar (Left) + Rooms Grid (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Filter Sidebar */}
              <div
                className={`lg:block ${
                  showMobileFilters ? 'block' : 'hidden'
                } bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-card space-y-6 lg:sticky lg:top-20`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-sm font-extrabold font-heading text-slate-900 dark:text-white flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-primary-600 dark:text-primary-400" />
                    Filtrer par
                  </span>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={12} />
                      Effacer
                    </button>
                  )}
                </div>

                {/* 1. Price Range */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Budget par nuit (Ariary)
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_BUDGET_RANGES.map((b, i) => {
                      const isSelected = filterMinPrice === b.min && filterMaxPrice === b.max
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setFilterMinPrice(b.min)
                            setFilterMaxPrice(b.max)
                          }}
                          className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            isSelected
                              ? 'bg-primary-600 text-white shadow-xs font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {b.label}
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">Min (Ar)</span>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={filterMinPrice}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value))
                          setFilterMinPrice(Math.min(val, filterMaxPrice))
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">Max (Ar)</span>
                      <input
                        type="number"
                        min={0}
                        step={5000}
                        value={filterMaxPrice}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value))
                          setFilterMaxPrice(Math.max(val, filterMinPrice))
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-bold outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>

                  {/* Dual range sliders */}
                  <div className="pt-3 space-y-3">
                    {/* Min slider */}
                    <div>
                      <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-1">
                        <span>Prix min</span>
                        <span className="text-primary-600 dark:text-primary-400 font-bold">
                          {new Intl.NumberFormat('fr-FR').format(filterMinPrice)} Ar
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={500000}
                        step={5000}
                        value={filterMinPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setFilterMinPrice(Math.min(val, filterMaxPrice - 5000))
                        }}
                        className="w-full accent-primary-600 cursor-pointer"
                      />
                    </div>
                    {/* Max slider */}
                    <div>
                      <div className="flex justify-between text-[10px] font-medium text-slate-400 mb-1">
                        <span>Prix max</span>
                        <span className="text-primary-600 dark:text-primary-400 font-bold">
                          {new Intl.NumberFormat('fr-FR').format(filterMaxPrice)} Ar
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={500000}
                        step={5000}
                        value={filterMaxPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setFilterMaxPrice(Math.max(val, filterMinPrice + 5000))
                        }}
                        className="w-full accent-primary-600 cursor-pointer"
                      />
                    </div>
                    {/* Range summary */}
                    <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5">
                      <span>🏷️ {new Intl.NumberFormat('fr-FR').format(filterMinPrice)} Ar</span>
                      <span>→</span>
                      <span>{new Intl.NumberFormat('fr-FR').format(filterMaxPrice)} Ar 🏷️</span>
                    </div>
                  </div>
                </div>


                {/* 2. Room Type */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Catégorie de chambre
                  </label>
                  <div className="space-y-1.5">
                    {ROOM_TYPES.map((t) => (
                      <label
                        key={t.value}
                        className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer select-none"
                      >
                        <input
                          type="radio"
                          name="room_type_filter"
                          checked={filterRoomType === t.value}
                          onChange={() => setFilterRoomType(t.value)}
                          className="accent-primary-600 cursor-pointer"
                        />
                        <span>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 3. Hotel Filter */}
                {resultHotels.length > 1 && (
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block flex items-center gap-1">
                      <Building2 size={13} className="text-primary-600" /> Établissement
                    </label>
                    <select
                      value={filterHotel}
                      onChange={(e) => setFilterHotel(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold outline-none focus:border-primary-500 cursor-pointer"
                    >
                      <option value="">Tous les établissements ({resultHotels.length})</option>
                      {resultHotels.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 4. Capacity */}
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Capacité minimale
                  </label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((cap) => (
                      <button
                        key={cap}
                        type="button"
                        onClick={() => setFilterCapacity(cap)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          filterCapacity === cap
                            ? 'bg-primary-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {cap}+ pers.
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="lg:col-span-3 space-y-4">
                {filteredAndSortedRooms.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl dark:bg-slate-900 dark:border-slate-800 p-6">
                    <AlertCircle size={36} className="text-amber-500 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                      Aucune chambre ne correspond à vos filtres
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                      Ajustez votre fourchette de prix ou désactivez certains filtres.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800 text-xs font-bold hover:bg-primary-100 transition cursor-pointer"
                    >
                      Réinitialiser tous les filtres
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {filteredAndSortedRooms.map((room) => {
                      const roomType = room.room_type || room.type || 'STANDARD'
                      const roomNumber = room.room_number || room.number
                      const roomId = room.room_id || room.id
                      const pricePerNight = Number(room.price_per_night || 0)
                      const totalPrice = pricePerNight * nightsCount
                      const rating = Number(room.rating || 0)
                      const reviewsCount = Number(room.reviews_count || 0)
                      const roomReviews = Array.isArray(room.reviews) ? room.reviews : []
                      const visibleReviews = expandedReviews[roomId] ? roomReviews : roomReviews.slice(0, 2)

                      return (
                        <Reveal
                          as="div"
                          key={roomId}
                          y={20}
                          duration={0.45}
                          amount={0.1}
                          className="bg-white border border-slate-200/80 shadow-card hover:shadow-card-hover dark:bg-slate-900 dark:border-slate-800 rounded-3xl overflow-hidden transition-all duration-200 group"
                        >
                          <div className="flex flex-col md:flex-row md:min-h-[250px]">
                            <div className="md:w-[320px] xl:w-[360px] flex-shrink-0">
                              <RoomImageSlider room={room} className="h-64 md:h-full md:min-h-[250px] w-full" />
                            </div>

                            <div className="flex-1 p-5 lg:p-6 flex flex-col justify-between gap-4">
                              <div className="space-y-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300 text-[10px] font-bold uppercase tracking-wide border border-primary-100 dark:border-primary-900">
                                        {roomType}
                                      </span>
                                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        Chambre {roomNumber}
                                      </span>
                                    </div>

                                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white leading-tight mb-1.5">
                                      {room.hotel_name || 'Hôtel'}
                                    </h3>

                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                      <span className="flex items-center gap-1 font-medium">
                                        <Users size={14} className="text-slate-400" /> {room.capacity} personnes
                                      </span>
                                    </div>

                                    {room.address && (
                                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                                        <MapPin size={12} className="mt-0.5 text-slate-400 flex-shrink-0" />
                                        <span>{room.address}{room.city ? `, ${room.city}` : ''}</span>
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 text-amber-500 md:justify-end">
                                    {rating > 0 ? (
                                      <>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            size={14}
                                            className={star <= Math.round(rating) ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}
                                          />
                                        ))}
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 ml-0.5">
                                          {rating.toFixed(1)}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                        Non noté
                                      </span>
                                    )}
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400">({reviewsCount} avis)</span>
                                  </div>
                                </div>

                                {room.description && (
                                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {room.description}
                                  </p>
                                )}

                                {roomReviews.length > 0 && (
                                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        Avis clients
                                      </span>
                                      {roomReviews.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedReviews((prev) => ({
                                              ...prev,
                                              [roomId]: !prev[roomId],
                                            }))
                                          }
                                          className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 cursor-pointer"
                                        >
                                          {expandedReviews[roomId] ? 'Voir moins' : 'Voir tous'}
                                        </button>
                                      )}
                                    </div>

                                    <div className="space-y-2">
                                      {visibleReviews.map((review, index) => (
                                        <div
                                          key={`${roomId}-${review.reviewer_name}-${index}`}
                                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-950/60"
                                        >
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                            <span className="text-[11px] font-bold text-slate-800 dark:text-white">
                                              {review.reviewer_name}
                                            </span>
                                            <span className="flex items-center gap-1 text-amber-500">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                  key={star}
                                                  size={10}
                                                  className={star <= Number(review.rating || 0) ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}
                                                />
                                              ))}
                                            </span>
                                          </div>
                                          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                                            {review.comment}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReviewModalRoomId(roomId)
                                      setReviewModalDraft({
                                        rating: 0,
                                        reviewer_name: '',
                                        comment: '',
                                      })
                                    }}
                                    className="w-full md:w-auto px-3 py-2 rounded-xl bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600 transition cursor-pointer"
                                  >
                                    Publier mon avis
                                  </button>
                                </div>
                              </div>

                              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                  <div className="text-2xl font-black font-heading text-primary-700 dark:text-primary-400 leading-tight">
                                    {new Intl.NumberFormat('fr-FR').format(Math.round(pricePerNight))} Ar
                                    <span className="text-[11px] font-medium text-slate-400 align-middle"> / nuit</span>
                                  </div>
                                  {nightsCount > 1 && (
                                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                      Total {nightsCount} nuits : {new Intl.NumberFormat('fr-FR').format(Math.round(totalPrice))} Ar
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleBook(room)}
                                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md hover:shadow-primary-600/20 active:scale-95 cursor-pointer"
                                >
                                  Réserver <ChevronRight size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </Reveal>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        isOpen={Boolean(reviewModalRoomId)}
        onClose={() => {
          setReviewModalRoomId(null)
          setReviewModalDraft({ rating: 0, reviewer_name: '', comment: '' })
        }}
        title={reviewModalRoom ? `Avis pour ${reviewModalRoom.hotel_name || 'cette chambre'}` : 'Publier un avis'}
        size="lg"
      >
        {reviewModalRoom && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Chambre</p>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {reviewModalRoom.room_number || reviewModalRoom.number} · {reviewModalRoom.room_type || reviewModalRoom.type}
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={star <= Number(reviewModalDraft.rating || 0) ? 'fill-current' : 'text-slate-300 dark:text-slate-600'}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                Votre note
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewModalDraft((prev) => ({ ...prev, rating: star }))}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                    aria-label={`Noter ${star} étoiles`}
                  >
                    <Star
                      size={22}
                      className={star <= Number(reviewModalDraft.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                Votre nom
              </label>
              <input
                type="text"
                value={reviewModalDraft.reviewer_name}
                onChange={(e) => setReviewModalDraft((prev) => ({ ...prev, reviewer_name: e.target.value }))}
                placeholder="Saisissez votre nom"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-950 dark:border-slate-700 dark:text-white transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300 block">
                Commentaire
              </label>
              <textarea
                rows={4}
                value={reviewModalDraft.comment}
                onChange={(e) => setReviewModalDraft((prev) => ({ ...prev, comment: e.target.value }))}
                placeholder="Décrivez votre expérience"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-950 dark:border-slate-700 dark:text-white transition-all text-sm font-medium resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setReviewModalRoomId(null)
                  setReviewModalDraft({ rating: 0, reviewer_name: '', comment: '' })
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={reviewSubmitting[reviewModalRoomId]}
                onClick={() => handleReviewSubmit(reviewModalRoomId, reviewModalDraft)}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {reviewSubmitting[reviewModalRoomId] ? 'Envoi...' : 'Publier mon avis'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* 3. TRAVELER SERVICES PRESENTATION SECTION */}
      <section id="services" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal amount={0.4} className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest block mb-2">
              Vos Avantages Voyageurs
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
              Pourquoi réserver votre hôtel en direct ?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-2">
              Bénéficiez de garanties exclusives et d'un contact direct avec la réception des établissements.
            </p>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1} amount={0.2} y={22}>
            {/* Advantage 1 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Disponibilité 100% Garantie
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Connecté directement au planning de l'hôtel : zéro risque de surréservation ou d'annulation imprévue.
              </p>
            </div>

            {/* Advantage 2 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                <Award size={24} />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Meilleur Tarif Garanti
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Réservation sans intermédiaire ni frais cachés. Le tarif affiché en Ariary est le prix final acquitté.
              </p>
            </div>

            {/* Advantage 3 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <CreditCard size={24} />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Paiement Sécurisé & Facture PDF
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Règlement sécurisé (Carte, Mobile Money) avec délivrance immédiate de votre facture officielle acquittée.
              </p>
            </div>

            {/* Advantage 4 */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Headphones size={24} />
              </div>
              <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                Suivi de Dossier & Support 24/7
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Suivez votre réservation à tout moment avec votre code dossier et contactez directement la conciergerie.
              </p>
            </div>
          </RevealGroup>
        </div>
      </section>

      {/* 4. FEATURED DESTINATIONS SECTION */}
      <section id="destinations" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal amount={0.4} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest block mb-2">
                Destinations Phares
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
                Explorez les meilleurs hôtels à Madagascar
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Sélectionnez une destination pour découvrir instantanément les chambres disponibles.
            </p>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1} amount={0.15} y={26}>
            {FEATURED_DESTINATIONS.map((dest, i) => (
              <div
                key={dest.city}
                onClick={() => handleSearch(null, dest.city)}
                className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col justify-end p-6 border border-slate-200/80 dark:border-slate-800"
              >
                {/* Real photo background */}
                <img
                  src={dest.image}
                  alt={dest.city}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  style={{ aspectRatio: '4 / 5' }}
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&auto=format&fit=crop&q=60'
                  }}
                />
                {/* Dark gradient overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-transparent group-hover:from-slate-950/80 transition-colors duration-300" />

                <div className="relative z-10 text-white space-y-2">
                  <span className="inline-block px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold tracking-wide uppercase border border-white/10">
                    {dest.tag}
                  </span>
                  <h3 className="text-2xl font-black font-heading tracking-tight">{dest.city}</h3>
                  <p className="text-xs text-slate-200/90 line-clamp-2 leading-relaxed">
                    {dest.desc}
                  </p>
                  <div className="pt-2 flex items-center gap-1 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                    Voir les hébergements <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </RevealGroup>

        </div>
      </section>

      {/* 5. HOTELIER BANNER (Transition to Hotelier SaaS) */}
      <section className="py-14 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800">
        <Reveal amount={0.4} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
              Vous êtes gérant ou propriétaire d'un hôtel ?
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold font-heading">
              Gérez votre établissement avec notre logiciel PMS tout-en-un
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
              Planning interactif des chambres, traçabilité de caisse, facturation PDF et statistiques d'occupation en temps réel.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/hotelier"
              className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs sm:text-sm font-extrabold shadow-md hover:shadow-primary-600/30 transition-all cursor-pointer"
            >
              Découvrir l'Espace Hôtelier
            </Link>
            <Link
              to="/register"
              className="px-4 py-3 rounded-xl bg-white text-slate-900 hover:bg-slate-100 border border-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 dark:border-white/20 text-xs sm:text-sm font-extrabold shadow-md transition-all cursor-pointer"
            >
              Inscrire mon hôtel
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-950 text-slate-400 text-xs border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary-600 text-white">
              <BedDouble size={16} />
            </div>
            <span className="font-bold text-white text-sm">HotelBooking</span>
            <span>• Portail Voyageurs & Réservations Directes</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#destinations" className="hover:text-white transition">Destinations</a>
            <a href="#services" className="hover:text-white transition">Services</a>
            <Link to="/track" className="hover:text-white transition">Suivi Réservation</Link>
            <Link to="/hotelier" className="text-primary-400 hover:text-primary-300 font-bold transition">
              Espace Hôtelier
            </Link>
          </div>

          <span>© {new Date().getFullYear()} HotelBooking. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  )
}

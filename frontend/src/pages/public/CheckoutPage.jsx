import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BedDouble, Calendar, Users, AlertCircle, Loader2, ChevronLeft } from 'lucide-react'
import { publicAPI, getApiErrorMessage } from '../../api/client'
import { Card, CardContent } from '../../components/ui/Card'
import RoomImageSlider from '../../components/public/RoomImageSlider'
import Reveal from '../../components/ui/Reveal'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { state } = useLocation()

  if (!state?.room) {
    navigate('/')
    return null
  }

  const { room, check_in, check_out, guests } = state

  const nights = useMemo(() => {
    const d1 = new Date(check_in)
    const d2 = new Date(check_out)
    return Math.max(1, Math.round((d2 - d1) / 86400000))
  }, [check_in, check_out])

  const subtotal = Math.round(Number(room.price_per_night || 0) * nights)
  const taxes = 0
  const total = subtotal

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    special_requests: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        room_id: room.id || room.room_id,
        check_in,
        check_out,
        number_of_guests: Number(guests || 1),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        special_requests: form.special_requests.trim() || undefined,
      }
      const res = await publicAPI.createReservation(payload)
      const reservation = res.data
      const reservationCode = reservation.reservation_code ?? reservation.code
      navigate(`/payment/${reservationCode}`, {
        state: { reservation, total },
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la réservation. Veuillez réessayer.'))
    } finally {
      setLoading(false)
    }
  }

  const fmt = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium mb-6 transition-colors"
      >
        <ChevronLeft size={18} /> Retour à la recherche
      </button>

      <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mb-8 tracking-tight">
        Finaliser votre réservation
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <Reveal as="div" direction="left" y={24} duration={0.5} amount={0.2} className="lg:col-span-2">
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-white mb-6">
              Coordonnées du voyageur
            </h2>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-sm font-medium mb-6">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Prénom *
                  </label>
                  <input
                    name="first_name"
                    required
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Jean"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm transition-all shadow-subtle"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Nom *
                  </label>
                  <input
                    name="last_name"
                    required
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm transition-all shadow-subtle"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Adresse Email *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jean.dupont@email.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm transition-all shadow-subtle"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Numéro de Téléphone
                </label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+261 34 00 000 00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm transition-all shadow-subtle"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Demandes particulières
                </label>
                <textarea
                  name="special_requests"
                  value={form.special_requests}
                  onChange={handleChange}
                  placeholder="Arrivée tardive, étage élevé, lit d'appoint..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm transition-all resize-none shadow-subtle"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:shadow-primary-600/20 transition-all disabled:opacity-50 mt-6 active:scale-[0.99] cursor-pointer"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                Confirmer et procéder au règlement
              </button>
            </form>
          </Card>
        </Reveal>

        {/* Stay Summary Card */}
        <Reveal as="div" direction="right" y={24} duration={0.5} delay={0.1} amount={0.2} className="lg:col-span-1">
          <Card className="p-6 sticky top-24">
            <h2 className="text-base font-bold font-heading text-slate-900 dark:text-white mb-4">
              Récapitulatif du séjour
            </h2>

            <RoomImageSlider room={room} className="h-36 rounded-2xl mb-4" />

            <div className="space-y-1 text-sm mb-4">
              <p className="text-slate-900 dark:text-white font-bold font-heading text-base">
                Chambre {room.room_number || room.number}
              </p>
              {room.hotel_name && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {room.hotel_name}
                </p>
              )}
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm py-4 border-t border-b border-slate-100 dark:border-slate-700/60 mb-4">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Calendar size={14} className="text-primary-600 flex-shrink-0" />
                <span className="truncate">
                  {fmt(check_in)} → {fmt(check_out)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Users size={14} className="text-primary-600 flex-shrink-0" />
                <span>
                  {guests} voyageur{guests > 1 ? 's' : ''} • {nights} nuit{nights > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>
                  {new Intl.NumberFormat('fr-FR').format(Math.round(room.price_per_night))} Ar × {nights} nuit{nights > 1 ? 's' : ''}
                </span>
                <span>{new Intl.NumberFormat('fr-FR').format(Math.round(subtotal))} Ar</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>TVA & Taxes de séjour</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Incluses (0%)</span>
              </div>
              <div className="flex justify-between text-slate-900 dark:text-white font-extrabold text-base pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <span>Total à régler</span>
                <span className="text-primary-600 dark:text-primary-400 font-heading text-lg">
                  {new Intl.NumberFormat('fr-FR').format(Math.round(total))} Ar
                </span>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </div>
  )
}

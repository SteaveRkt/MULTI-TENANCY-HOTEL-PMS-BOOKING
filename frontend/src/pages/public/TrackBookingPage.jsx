import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Download,
  XCircle,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BedDouble,
  CreditCard,
} from 'lucide-react'
import { publicAPI, getApiErrorMessage } from '../../api/client'
import Badge from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { motion, AnimatePresence } from 'framer-motion'

export default function TrackBookingPage() {
  const [code, setCode] = useState('')
  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState('')
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setReservation(null)
    setCancelSuccess(false)
    try {
      const res = await publicAPI.getReservation(code.trim().toUpperCase())
      setReservation(res.data)
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Aucune réservation trouvée avec le code "${code}".`)
      } else {
        setError(getApiErrorMessage(err, 'Erreur lors de la recherche. Veuillez vérifier votre code.'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    setInvoiceLoading(true)
    try {
      const targetCode = reservation.reservation_code ?? reservation.code
      const res = await publicAPI.getInvoice(targetCode)
      const disposition = res.headers ? res.headers['content-disposition'] : null
      let filename = `Facture_${targetCode}.pdf`
      if (disposition) {
        const match = disposition.match(/filename="?([^";]+)"?/)
        if (match && match[1]) filename = match[1]
      }
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
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
      setError(message)
    } finally {
      setInvoiceLoading(false)
    }
  }

  const handleCancel = async () => {
    setCancelLoading(true)
    setError('')
    try {
      await publicAPI.cancelReservation(reservation.reservation_code ?? reservation.code)
      setCancelSuccess(true)
      setCancelConfirm(false)
      setReservation((prev) => ({ ...prev, status: 'CANCELLED' }))
    } catch (err) {
      setError(getApiErrorMessage(err, "Erreur lors de l'annulation."))
    } finally {
      setCancelLoading(false)
    }
  }

  const fmt = (d) =>
    new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-8 sm:mb-10"
      >
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white mb-2 tracking-tight">
          Suivre ma réservation
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
          Saisissez votre code unique pour consulter les détails ou gérer votre séjour.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex gap-2 sm:gap-3 mb-8"
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ex: HTL-A4B89C"
          className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-mono text-sm uppercase shadow-subtle transition-all"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold shadow-sm hover:shadow-md hover:shadow-primary-600/20 transition-all disabled:opacity-50 active:scale-[0.99] text-sm cursor-pointer"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          Rechercher
        </button>
      </motion.form>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-sm font-medium mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Cancel success alert */}
      {cancelSuccess && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900/40 dark:text-emerald-300 text-sm font-medium mb-6">
          <CheckCircle2 size={16} />
          Votre réservation a été annulée avec succès.
        </div>
      )}

      {/* Reservation Result Card */}
      <AnimatePresence mode="wait">
        {reservation && (
          <motion.div
            key={reservation.reservation_code ?? reservation.code}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
          <Card className="overflow-hidden shadow-card">
          {/* Header Banner */}
          <div className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-700/60 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider mb-1">
                  Code de réservation
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-primary-700 dark:text-primary-300">
                  {reservation.reservation_code ?? reservation.code}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={reservation.status}>{reservation.status}</Badge>
                <Badge variant={reservation.is_paid ? 'paid' : 'unpaid'}>
                  {reservation.is_paid ? 'PAYÉ' : 'EN ATTENTE DE PAIEMENT'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Nom du client</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {reservation.guest_name ||
                    [reservation.first_name, reservation.last_name].filter(Boolean).join(' ') ||
                    'Client'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Établissement</p>
                <p className="font-bold text-slate-900 dark:text-white">
                  {reservation.hotel_name ?? 'Hotel Partner'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Chambre réservée</p>
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BedDouble size={15} className="text-primary-600" />
                  Chambre {reservation.room_number ?? reservation.room?.number} —{' '}
                  {reservation.room_type ?? reservation.room?.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Montant total</p>
                <p className="text-xl font-extrabold font-heading text-primary-600 dark:text-primary-400">
                  {new Intl.NumberFormat('fr-FR').format(Math.round(reservation.total_price ?? 0))} Ar
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Date d'arrivée</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {fmt(reservation.check_in)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5 font-medium">Date de départ</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {fmt(reservation.check_out)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-slate-100 dark:border-slate-700/60">
              {reservation.is_paid ? (
                <button
                  onClick={handleDownloadInvoice}
                  disabled={invoiceLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-bold shadow-sm hover:shadow-md hover:shadow-primary-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {invoiceLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Télécharger la facture PDF acquittée
                </button>
              ) : (
                <Link
                  to={`/payment/${reservation.reservation_code ?? reservation.code}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-bold shadow-sm hover:shadow-md hover:shadow-primary-600/20 transition-all text-center cursor-pointer"
                >
                  <CreditCard size={16} />
                  Régler la réservation pour obtenir la facture
                </Link>
              )}

              {reservation.status !== 'CANCELLED' && reservation.status !== 'CHECKED_OUT' && (
                <>
                  {!cancelConfirm ? (
                    <button
                      onClick={() => setCancelConfirm(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-semibold transition-colors dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:border-rose-900/50 dark:text-rose-300 cursor-pointer"
                    >
                      <XCircle size={16} />
                      Annuler la réservation
                    </button>
                  ) : (
                    <div className="flex-1 flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={cancelLoading}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors disabled:opacity-50 active:scale-95 cursor-pointer"
                      >
                        {cancelLoading && <Loader2 size={14} className="animate-spin" />}
                        Confirmer l'annulation
                      </button>
                      <button
                        onClick={() => setCancelConfirm(false)}
                        className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Non
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {!reservation && !loading && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto mb-4 dark:bg-slate-800 dark:border-slate-700">
            <Search size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Entrez votre numéro de dossier pour accéder au statut de votre réservation.
          </p>
        </div>
      )}
    </div>
  )
}

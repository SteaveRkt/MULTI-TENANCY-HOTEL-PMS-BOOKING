import { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  Download,
  Loader2,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react'
import { publicAPI, getApiErrorMessage } from '../../api/client'
import { Card } from '../../components/ui/Card'

const MOBILE_PROVIDERS = [
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'M_PESA', label: 'M-Pesa' },
  { value: 'MTN', label: 'MTN Mobile Money' },
]

export default function PaymentPage() {
  const { code } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [reservation, setReservation] = useState(state?.reservation ?? null)
  const [total, setTotal] = useState(state?.total ?? 0)
  const [tab, setTab] = useState('card')
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(!state?.reservation)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)

  const [cardForm, setCardForm] = useState({
    card_holder: '',
    card_number: '',
    expiry: '',
    cvc: '',
  })
  const [mobileForm, setMobileForm] = useState({ provider: 'ORANGE_MONEY', phone_number: '' })

  useEffect(() => {
    if (!state?.reservation && code) {
      setFetchLoading(true)
      publicAPI
        .getReservation(code)
        .then((res) => {
          setReservation(res.data)
          setTotal(res.data.total_price ?? 0)
        })
        .catch((err) => setError(getApiErrorMessage(err, 'Réservation introuvable.')))
        .finally(() => setFetchLoading(false))
    }
  }, [code, state])

  const handlePay = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload =
        tab === 'card'
          ? { method: 'CARD', ...cardForm }
          : { method: 'MOBILE_MONEY', ...mobileForm }
      await publicAPI.payReservation(code, payload)
      setSuccess(true)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur de paiement. Veuillez réessayer.'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async () => {
    setInvoiceLoading(true)
    try {
      const res = await publicAPI.getInvoice(code)
      const disposition = res.headers ? res.headers['content-disposition'] : null
      let filename = `Facture_${code}.pdf`
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

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="text-brand-500 animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center bg-white border border-slate-200 shadow-xl rounded-3xl p-8 dark:bg-slate-800/80 dark:border-slate-700">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2">
            Paiement confirmé !
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            Votre séjour est validé et garanti auprès de l'établissement.
          </p>

          <div className="inline-block px-6 py-3 bg-primary-50 border border-primary-100 dark:bg-primary-950/60 dark:border-primary-900/60 rounded-2xl mb-8">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Code de réservation</p>
            <p className="text-2xl font-extrabold font-heading text-primary-700 dark:text-primary-300 font-mono mt-0.5">
              {code}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadInvoice}
              disabled={invoiceLoading}
              className="flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold transition-all shadow-sm hover:shadow-md hover:shadow-primary-600/20 disabled:opacity-50 active:scale-[0.99] cursor-pointer"
            >
              {invoiceLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Télécharger la facture PDF
            </button>
            <button
              onClick={() => navigate('/')}
              className="py-2.5 px-6 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white text-sm font-medium mb-6 transition-colors cursor-pointer"
      >
        <ChevronLeft size={18} /> Retour
      </button>

      <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-white mb-1 tracking-tight">
        Règlement du séjour
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Réservation N°{' '}
        <span className="text-primary-600 dark:text-primary-400 font-mono font-bold">{code}</span>
      </p>

      {/* Reservation summary card */}
      {reservation && (
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <p className="text-slate-500 dark:text-slate-400">Chambre</p>
              <p className="font-bold text-slate-900 dark:text-white font-heading">
                Chambre {reservation.room_number ?? reservation.room?.number} —{' '}
                {reservation.room_type ?? reservation.room?.type}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Dates</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {new Date(reservation.check_in).toLocaleDateString('fr-FR')} →{' '}
                {new Date(reservation.check_out).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Client</p>
              <p className="font-bold text-slate-900 dark:text-white">
                {reservation.guest_name ??
                  `${reservation.first_name ?? ''} ${reservation.last_name ?? ''}`}
              </p>
            </div>
            <div>
              <p className="text-slate-500 dark:text-slate-400">Montant total dû</p>
              <p className="text-2xl font-extrabold font-heading text-primary-600 dark:text-primary-400">
                {new Intl.NumberFormat('fr-FR').format(Math.round(total || reservation.total_price || 0))} Ar
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Payment tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1.5 mb-6 border border-slate-200/80 dark:border-slate-700/60">
        {[
          ['card', <CreditCard size={16} />, 'Carte bancaire'],
          ['mobile', <Smartphone size={16} />, 'Mobile Money'],
        ].map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              tab === key
                ? 'bg-white text-primary-700 shadow-sm border border-slate-200/70 dark:bg-primary-600 dark:text-white dark:border-transparent font-bold'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/40 dark:text-rose-300 text-sm font-medium mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Payment Form */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handlePay} className="space-y-4">
          {tab === 'card' ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Titulaire de la carte *
                </label>
                <input
                  required
                  value={cardForm.card_holder}
                  onChange={(e) =>
                    setCardForm((p) => ({ ...p, card_holder: e.target.value }))
                  }
                  placeholder="JEAN DUPONT"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm transition-all uppercase shadow-subtle"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Numéro de carte *
                </label>
                <input
                  required
                  value={cardForm.card_number}
                  onChange={(e) =>
                    setCardForm((p) => ({
                      ...p,
                      card_number: e.target.value.replace(/\D/g, '').slice(0, 16),
                    }))
                  }
                  placeholder="4242 4242 4242 4242"
                  maxLength={16}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm font-mono transition-all shadow-subtle"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Date d'expiration *
                  </label>
                  <input
                    required
                    value={cardForm.expiry}
                    onChange={(e) => setCardForm((p) => ({ ...p, expiry: e.target.value }))}
                    placeholder="MM/AA"
                    maxLength={5}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm font-mono transition-all shadow-subtle"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Cryptogramme (CVC) *
                  </label>
                  <input
                    required
                    value={cardForm.cvc}
                    type="password"
                    onChange={(e) =>
                      setCardForm((p) => ({
                        ...p,
                        cvc: e.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    placeholder="•••"
                    maxLength={4}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm font-mono transition-all shadow-subtle"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Opérateur Mobile Money *
                </label>
                <select
                  required
                  value={mobileForm.provider}
                  onChange={(e) => setMobileForm((p) => ({ ...p, provider: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm transition-all shadow-subtle"
                >
                  {MOBILE_PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Numéro de téléphone *
                </label>
                <input
                  required
                  type="tel"
                  value={mobileForm.phone_number}
                  onChange={(e) =>
                    setMobileForm((p) => ({ ...p, phone_number: e.target.value }))
                  }
                  placeholder="+261 34 00 000 00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:bg-slate-900 dark:border-slate-700 dark:text-white text-sm transition-all shadow-subtle"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-base flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:shadow-primary-600/20 transition-all disabled:opacity-50 mt-6 active:scale-[0.99] cursor-pointer"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            Payer {new Intl.NumberFormat('fr-FR').format(Math.round(total || reservation?.total_price || 0))} Ar
          </button>
        </form>
      </Card>
    </div>
  )
}

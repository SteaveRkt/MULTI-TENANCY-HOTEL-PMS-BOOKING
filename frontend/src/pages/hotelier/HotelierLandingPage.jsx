import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Building2,
  CalendarCheck2,
  Receipt,
  BarChart3,
  Users2,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react'
import ThemeToggle from '../../components/ui/ThemeToggle'

export default function HotelierLandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Top Navigation for Hoteliers */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/hotelier" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-primary-600 text-white shadow-sm group-hover:bg-primary-700 transition-colors">
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-lg font-black font-heading tracking-tight text-slate-900 dark:text-white block leading-none">
                HotelPMS
              </span>
              <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 tracking-wider uppercase">
                Solution Hôtelière
              </span>
            </div>
          </Link>

          {/* Natural Desktop Nav Links (Simple words without icons) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition">
              Fonctionnalités
            </a>
            <a href="#services" className="hover:text-primary-600 dark:hover:text-primary-400 transition">
              Services
            </a>
            <a href="#how-it-works" className="hover:text-primary-600 dark:hover:text-primary-400 transition">
              Comment ça marche
            </a>
            <Link
              to="/"
              className="text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition"
            >
              Portail Voyageurs
            </Link>
          </nav>

          {/* Action CTAs (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-bold shadow-xs hover:shadow-md hover:shadow-primary-600/20 transition-all cursor-pointer"
            >
              S'inscrire
            </Link>
          </div>

          {/* Mobile Actions: ThemeToggle + Hamburger Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Menu de navigation"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Simple Mobile Hamburger Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 transition-all shadow-xl">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Fonctionnalités
            </a>
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Services
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Comment ça marche
            </a>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/50 transition"
            >
              ← Retour au Portail Voyageurs
            </Link>
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition text-center shadow-xs"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary-500/10 dark:bg-primary-600/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/70 border border-primary-100 dark:border-primary-900 text-primary-700 dark:text-primary-300 text-xs font-bold mb-6 shadow-subtle">
            <Sparkles size={13} className="text-primary-600 dark:text-primary-400" />
            Logiciel de Gestion Hôtelière & PMS Nouvelle Génération
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black font-heading text-slate-900 dark:text-white mb-6 leading-[1.12] tracking-tight">
            Pilotez votre hôtel avec précision, <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 bg-clip-text text-transparent">
              automatisez vos réservations & encaissements
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Planning interactif des chambres, facturation officielle en Ariary avec traçabilité par réceptionniste, tableau de bord financier en temps réel et zéro surréservation.
          </p>

          {/* Hero Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              to="/register"
              className="w-full sm:w-auto flex items-center justify-center px-7 py-3.5 rounded-2xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-extrabold text-base shadow-md hover:shadow-xl hover:shadow-primary-600/25 transition-all cursor-pointer"
            >
              S'inscrire (Créer mon hôtel)
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white font-bold text-base border border-slate-200 dark:border-slate-700 shadow-sm transition"
            >
              Se connecter au PMS
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> Inscription en 2 minutes</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> Isolation stricte des données</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-emerald-500" /> Facturation conforme en Ariary</span>
          </div>
        </div>
      </section>

      {/* Services & Modules Presentation Section */}
      <section id="services" className="py-20 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest block mb-2">
              Présentation des Services
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight">
              Tout ce dont votre établissement a besoin au quotidien
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mt-3">
              Une suite complète d'outils interconnectés pour fluidifier le travail de la réception et de la direction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service 1 : Rack des chambres */}
            <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-card-hover transition-all space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Layers size={26} />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Rack & Planning Interactif
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Visualisez l'état de tout votre parc de chambres par date (Disponible, Réservée, Occupée, Maintenance) et réalisez des réservations au comptoir en 3 clics.
              </p>
              <div className="pt-2 text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1">
                Enregistrement instantané <ChevronRight size={14} />
              </div>
            </div>

            {/* Service 2 : Facturation & Traçabilité */}
            <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-card-hover transition-all space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Receipt size={26} />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Facturation & Traçabilité Réception
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Génération de factures PDF professionnelles acquittées avec le nom de l'agent encaisseur, historique des transactions et pièces justificatives conformes.
              </p>
              <div className="pt-2 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                Conformité comptable assurée <ChevronRight size={14} />
              </div>
            </div>

            {/* Service 3 : KPIs & Tableau de bord */}
            <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-card-hover transition-all space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 size={26} />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Analytics & Métriques Financières
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Suivez en temps réel votre Chiffre d'Affaires encaissé, votre Taux d'occupation, l'ADR (Prix moyen par chambre) et le RevPAR mensuel.
              </p>
              <div className="pt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                Pilotage par les données <ChevronRight size={14} />
              </div>
            </div>

            {/* Service 4 : Multi-utilisateurs */}
            <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-card-hover transition-all space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users2 size={26} />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Gestion d'Équipe & Rôles
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Créez des accès différenciés pour la direction (Admin) et vos équipes d'accueil (Réceptionnistes), avec un suivi précis des opérations par employé.
              </p>
              <div className="pt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                Contrôle des accès sécurisé <ChevronRight size={14} />
              </div>
            </div>

            {/* Service 5 : Réservations Directes & Portails */}
            <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-card-hover transition-all space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CalendarCheck2 size={26} />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Canal de Réservation Direct
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Vos chambres disponibles sont instantanément visibles par les voyageurs sur le portail public sans frais de commission intermédiaire exorbitants.
              </p>
              <div className="pt-2 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                Gain direct de marge <ChevronRight size={14} />
              </div>
            </div>

            {/* Service 6 : Multi-Tenancy & Sécurité */}
            <div className="p-7 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-card-hover transition-all space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={26} />
              </div>
              <h3 className="text-xl font-bold font-heading text-slate-900 dark:text-white">
                Isolation Totale des Données
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Chaque hôtel possède son propre espace étanche. Vos données financières, clients et réservations sont strictement confidentielles et protégées.
              </p>
              <div className="pt-2 text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                Sécurité certifiée <ChevronRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works section */}
      <section id="how-it-works" className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest block mb-2">
            Mise en route rapide
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white tracking-tight mb-12">
            Opérationnel en 3 étapes simples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative">
              <span className="text-3xl font-black font-heading text-primary-600/30 dark:text-primary-400/30">01</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Inscrivez votre hôtel</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Créez le profil de votre établissement et votre compte administrateur en quelques secondes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative">
              <span className="text-3xl font-black font-heading text-primary-600/30 dark:text-primary-400/30">02</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Configurez vos chambres</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ajoutez vos numéros de chambres, types (Standard, Deluxe, Suite), capacités et prix par nuitée.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 relative">
              <span className="text-3xl font-black font-heading text-primary-600/30 dark:text-primary-400/30">03</span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Pilotez & Encaissez</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Gérez vos arrivées/départs, enregistrez les paiements au comptoir et téléchargez les factures PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary-700 via-primary-800 to-indigo-900 text-white text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-black font-heading tracking-tight">
            Prêt à transformer la gestion de votre hôtel ?
          </h2>
          <p className="text-primary-100 text-sm sm:text-base max-w-xl mx-auto">
            Rejoignez dès aujourd'hui les professionnels qui ont choisi la simplicité, la rigueur et la modernité.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-primary-800 font-extrabold text-sm shadow-lg hover:bg-slate-100 transition cursor-pointer"
            >
              Créer mon compte hôtel (Gratuit)
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary-900/60 hover:bg-primary-900 text-white font-bold text-sm border border-white/20 transition cursor-pointer"
            >
              Se connecter à mon espace
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-primary-400" />
            <span className="font-bold text-white">HotelPMS</span>
            <span>• Logiciel de Gestion Hôtelière</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-white transition">Portail Voyageurs</Link>
            <Link to="/login" className="hover:text-white transition">Connexion Hôtelier</Link>
            <Link to="/register" className="hover:text-white transition">Inscription Hôtel</Link>
          </div>
          <span>© {new Date().getFullYear()} HotelPMS. Tous droits réservés.</span>
        </div>
      </footer>
    </div>
  )
}

# 🏨 Multi-Tenancy Hotel Management SaaS

Plateforme SaaS moderne et complète de gestion hôtelière multi-établissements (**Multi-Tenancy**), combinant un back-office pour les équipes hôtelières et un portail de réservation en ligne pour les clients.

---

## ✨ Fonctionnalités Principales

### 🏢 Architecture Multi-Tenancy & Sécurité
- **Isolation des données par hôtel** : chaque établissement accède uniquement à ses propres chambres, réservations, clients et données financières.
- **Authentification & Rôles** : tokens JWT sécurisés avec contrôle d'accès basé sur les rôles (`ADMIN`, `RECEPTIONIST`).

### 📊 Back-Office Administratif
- **Tableau de Bord & KPIs** : suivi du chiffre d'affaires (en Ariary / Ar), du taux d'occupation, des arrivées/départs du jour et graphiques mensuels.
- **Rack des Chambres par Date** : vue interactive de l'état du parc (Libre, Réservé, Occupé, Maintenance) avec navigation jour par jour.
- **Recherche de Séjour sans conflit** : moteur de recherche de disponibilités par période de séjour.
- **Gestion des Réservations** :
  - Création rapide au comptoir avec ajout instantané d'un nouveau client dans le même formulaire.
  - Cycle de vie complet : *En attente*, *Confirmée*, *Check-in*, *Check-out*, *Annulée*.
- **Paiements & Facturation** :
  - Encaissements multi-modes : Espèces, Mobile Money (MVola, Orange Money, Airtel Money) et Carte Bancaire.
  - Génération automatique et téléchargement de **factures PDF professionnelles**.
- **Gestion des Chambres, Clients et Équipe (Staff)**.

### 🌐 Portail Public de Réservation
- Découverte des hôtels partenaires et de leurs chambres.
- Recherche de chambres avec filtres de dates, capacité, type et budget en Ariary (de 5 000 Ar à 300 000 Ar).
- Réservation en ligne en direct avec code unique de suivi.

---

## 🛠️ Stack Technique

### Backend
- **Framework** : [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **ORM & Migrations** : [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/)
- **Base de données** : [PostgreSQL](https://www.postgresql.org/) (avec fallback SQLite local)
- **Génération PDF** : [ReportLab](https://www.reportlab.com/)
- **Validation** : [Pydantic v2](https://docs.pydantic.dev/)

### Frontend
- **Framework** : [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/)
- **Icônes & Graphiques** : [Lucide React](https://lucide.dev/) & [Recharts](https://recharts.org/)
- **Routage & HTTP** : [React Router v6](https://reactrouter.com/) & [Axios](https://axios-http.com/)

---

## 📁 Structure du Projet

```text
MULTI TENANCY HOTEL/
├── backend/
│   ├── app/
│   │   ├── api/          # Routes API (auth, rooms, reservations, dashboard, public, etc.)
│   │   ├── core/         # Configuration, base de données et sécurité JWT
│   │   ├── models/       # Modèles SQLAlchemy (Tenant, User, Room, Customer, Reservation, Payment)
│   │   ├── schemas/      # Schémas Pydantic de validation
│   │   └── main.py       # Point d'entrée FastAPI & configuration CORS
│   ├── alembic/          # Scripts de migration BDD
│   ├── render.yaml       # Configuration de déploiement Render
│   ├── Procfile          # Commande de démarrage Render
│   ├── requirements.txt  # Dépendances Python
│   └── .env.example      # Modèle des variables d'environnement backend
│
├── frontend/
│   ├── src/
│   │   ├── api/          # Client API Axios centralisé
│   │   ├── components/   # Composants UI réutilisables (Button, Modal, Card, Badge, etc.)
│   │   ├── context/      # Contexte d'authentification React
│   │   ├── pages/        # Vues Admin (Dashboard, Rack, Réservations, etc.) et Publiques
│   │   ├── App.jsx       # Configuration des routes
│   │   └── main.jsx      # Point d'entrée React
│   ├── vercel.json       # Configuration de réécriture SPA pour Vercel
│   ├── package.json      # Scripts et dépendances NPM
│   └── .env.example      # Modèle des variables d'environnement frontend
│
├── .gitignore            # Règles d'exclusion Git globales
└── README.md
```

---

## 🚀 Installation & Démarrage Local

### 1. Cloner le projet
```bash
git clone <url-du-repo>
cd "MULTI TENANCY HOTEL"
```

### 2. Démarrer le Backend
```bash
cd backend

# Créer et activer l'environnement virtuel
python3 -m venv .venv
source .venv/bin/activate  # Sur Windows: .venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer l'environnement
cp .env.example .env

# Lancer le serveur FastAPI
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> L'API sera accessible sur `http://localhost:8000` et la documentation Swagger sur `http://localhost:8000/docs`.

### 3. Démarrer le Frontend
```bash
cd ../frontend

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env

# Lancer le serveur de développement Vite
npm run dev
```
> L'application sera accessible sur `http://localhost:5173`.

---

## ☁️ Déploiement en Production

| Service | Composant | Fichiers de configuration |
|---|---|---|
| **Render** | Backend FastAPI + Base PostgreSQL | [`backend/render.yaml`](backend/render.yaml), [`backend/Procfile`](backend/Procfile) |
| **Vercel** | Frontend React SPA | [`frontend/vercel.json`](frontend/vercel.json) |

### Variables d'environnement de Production

#### Backend (Render)
- `DATABASE_URL` : URL de connexion PostgreSQL fournie par Render.
- `JWT_SECRET` : Clé secrète robuste pour signer les tokens.
- `JWT_ALGORITHM` : `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES` : `60`
- `FRONTEND_URL` : URL Vercel du client (`https://votre-app.vercel.app`).

#### Frontend (Vercel)
- `VITE_API_URL` : URL de votre backend Render (`https://votre-api.onrender.com`).

---

## 📄 Licence
Ce projet est sous licence MIT - voir le fichier LICENSE pour plus d'informations.
# Multi-Tenancy Hotel Management SaaS

A modern, comprehensive multi-property (**Multi-Tenancy**) hotel management SaaS platform, combining a powerful back-office for hotel staff and an online booking portal for guests.

---

## Key Features

### Multi-Tenancy Architecture & Security
- **Data Isolation per Hotel**: Each property can only access its own rooms, reservations, customers, and financial data.
- **Authentication & Roles**: Secure JWT tokens with role-based access control (`ADMIN`, `RECEPTIONIST`).

### Administrative Back-Office
- **Dashboard & KPIs**: Track revenue (in Ariary / Ar), occupancy rate, today's check-ins/check-outs, and view monthly analytics charts.
- **Room Status Rack by Date**: Interactive visual grid showing room status (Available, Reserved, Occupied, Maintenance) with day-by-day navigation.
- **Conflict-Free Search**: Search engine to look up availability for any given stay period without overbooking risk.
- **Reservation Management**:
  - Quick front-desk booking creation with instant new customer registration within the same form.
  - Full lifecycle management: *Pending*, *Confirmed*, *Check-in*, *Check-out*, *Cancelled*.
- **Payments & Invoicing**:
  - Multi-mode payment tracking: Cash, Mobile Money (MVola, Orange Money, Airtel Money), and Credit/Debit Card.
  - Automatic generation and download of **professional PDF invoices**.
- **Management Modules**: Dedicated interfaces for Rooms, Customers, and Staff members.

### Public Booking Portal
- Discover partner hotels and explore their available rooms.
- Advanced room search with filters for dates, capacity, type, and budget in Ariary (ranging from 5,000 Ar to 300 000 Ar).
- Real-time direct online booking with a unique tracking code.

---

## Tech Stack

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **ORM & Migrations**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (with local SQLite fallback)
- **PDF Generation**: [ReportLab](https://www.reportlab.com/)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/)

### Frontend
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons & Charts**: [Lucide React](https://lucide.dev/) & [Recharts](https://recharts.org/)
- **Routing & HTTP**: [React Router v6](https://reactrouter.com/) & [Axios](https://axios-http.com/)

---

## Project Structure

```text
MULTI TENANCY HOTEL/
├── backend/
│   ├── app/
│   │   ├── api/          # API Routes (auth, rooms, reservations, dashboard, public, etc.)
│   │   ├── core/         # Configuration, database connection, and JWT security
│   │   ├── models/       # SQLAlchemy Models (Tenant, User, Room, Customer, Reservation, Payment)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   └── main.py       # FastAPI entry point & CORS configuration
│   ├── alembic/          # DB migration scripts
│   ├── render.yaml       # Render deployment configuration
│   ├── Procfile          # Render startup command
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Backend environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── api/          # Centralized Axios API client
│   │   ├── components/   # Reusable UI components (Button, Modal, Card, Badge, etc.)
│   │   ├── context/      # React authentication context
│   │   ├── pages/        # Admin Views (Dashboard, Rack, Reservations, etc.) and Public Views
│   │   ├── App.jsx       # Route configuration
│   │   └── main.jsx      # React entry point
│   ├── vercel.json       # Vercel SPA rewrite configuration
│   ├── package.json      # NPM scripts and dependencies
│   └── .env.example      # Frontend environment variables template
│
├── .gitignore            # Global Git exclusion rules
└── README.md
```

---

## Installation & Local Setup

### 1. Clone the project
```bash
git clone https://github.com/SteaveRkt/MULTI-TENANCY-HOTEL-PMS-BOOKING.git
cd "MULTI TENANCY HOTEL"
```

### 2. Start the Backend
```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up the environment variables
cp .env.example .env

# Run the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> The API will be accessible at `http://localhost:8000` and the Swagger documentation at `http://localhost:8000/docs`.

### 3. Start the Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Set up the environment variables
cp .env.example .env

# Run the Vite development server
npm run dev
```
> The application will be accessible at `http://localhost:5173`.

---

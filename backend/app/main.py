from contextlib import asynccontextmanager
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import auth, rooms, customers, reservation, dashboard, users, public, super_admin
from app.core.database import Base, engine
# Import all models so metadata is populated
from app.models import tenant, user, room, customer, reservation as res_model, payment


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Hotel Management API",
    version="1.0.0",
    lifespan=lifespan,
)

# Origins autorisées — locales + domaine Vercel configuré via variable d'environnement
_frontend_url = os.getenv("FRONTEND_URL", "")
_allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if _frontend_url:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    # Accepte tous les sous-domaines *.vercel.app et le domaine personnalisé
    allow_origin_regex=r"https://(.*\.vercel\.app|.*\.onrender\.com)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(customers.router)
app.include_router(reservation.router)
app.include_router(dashboard.router)
app.include_router(users.router)
app.include_router(public.router)
app.include_router(super_admin.router)


@app.get("/")
def root():
    return {
        "message": "Hotel Management API is running",
        "status": "online",
    }
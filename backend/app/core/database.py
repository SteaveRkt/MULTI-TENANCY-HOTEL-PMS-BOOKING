import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to connect to configured DATABASE_URL (e.g. PostgreSQL), with SQLite fallback if unavailable
database_url = settings.DATABASE_URL
engine_kwargs = {}

if "sqlite" in database_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

try:
    temp_engine = create_engine(database_url, **engine_kwargs)
    with temp_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    engine = temp_engine
    logger.info(f"Connected to database: {database_url}")
except Exception as exc:
    # If Postgres is not running or connection refused, fallback to local SQLite database
    sqlite_url = "sqlite:///./hotel.db"
    print(f"\n[WARNING] Could not connect to {database_url} ({exc}).")
    print(f"[INFO] Falling back to local SQLite database: {sqlite_url}\n")
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
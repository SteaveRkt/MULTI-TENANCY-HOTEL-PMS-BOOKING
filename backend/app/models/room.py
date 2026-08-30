from datetime import datetime,UTC

from sqlalchemy import String, DateTime, ForeignKey, Numeric,UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from app.core.database import Base


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[uuid.UUID] = mapped_column(
    UUID(as_uuid=True),
    primary_key=True,
    default=uuid.uuid4,
)

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id"),
        nullable=False,
        index=True,
    )

    number: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    floor: Mapped[int | None] = mapped_column(
        nullable=True,
    )

    capacity: Mapped[int] = mapped_column(
        nullable=False,
        default=2,
    )

    price_per_night: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    rating: Mapped[float] = mapped_column(
        Numeric(3, 2),
        nullable=False,
        default=0.0,
    )

    reviews_count: Mapped[int] = mapped_column(
        nullable=False,
        default=0,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="AVAILABLE",
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda:datetime.now(UTC),
    )

    tenant = relationship("Tenant")
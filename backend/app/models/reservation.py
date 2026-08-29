from datetime import date, datetime ,UTC
import uuid
from sqlalchemy import String,Date,DateTime,ForeignKey,Numeric,UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[uuid.UUID] = mapped_column(
    UUID(as_uuid=True),
    primary_key=True,
    default=uuid.uuid4,
)
    reservation_code: Mapped[str] = mapped_column(
    String(20),
    unique=True,
    nullable=False,
    index=True,
)
    tenant_id: Mapped[uuid.UUID] = mapped_column(
    UUID(as_uuid=True),
    ForeignKey("tenants.id"),
    nullable=False,
    index=True,
)

    room_id: Mapped[uuid.UUID] = mapped_column(
    UUID(as_uuid=True),
    ForeignKey("rooms.id"),
    nullable=False,
)

    customer_id: Mapped[uuid.UUID] = mapped_column(
    UUID(as_uuid=True),
    ForeignKey("customers.id"),
    nullable=False,
)
    check_in: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    check_out: Mapped[date] = mapped_column(
        Date,
        nullable=False,
    )

    number_of_guests: Mapped[int] = mapped_column(
        nullable=False,
        default=1,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING",
    )

    total_price: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    special_requests: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda:datetime.now(UTC),
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    tenant = relationship("Tenant")
    room = relationship("Room")
    customer = relationship("Customer")
    user = relationship("User", foreign_keys=[user_id])
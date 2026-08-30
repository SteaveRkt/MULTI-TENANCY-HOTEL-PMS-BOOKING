from datetime import date
from pydantic import BaseModel, ConfigDict
from typing import Literal
import uuid

class ReservationCreate(BaseModel):
    room_id: uuid.UUID
    customer_id: uuid.UUID
    check_in: date
    check_out: date
    number_of_guests: int = 1
    special_requests: str | None = None


class ReservationResponse(BaseModel):
    id: uuid.UUID
    reservation_code: str | None = None
    tenant_id: uuid.UUID
    room_id: uuid.UUID
    customer_id: uuid.UUID
    user_id: uuid.UUID | None = None
    check_in: date
    check_out: date
    number_of_guests: int
    status: str
    total_price: float
    special_requests: str | None = None
    is_paid: bool = False
    # Computed traceability fields (populated manually in routes)
    receptionist_name: str | None = None
    customer_name: str | None = None
    room_number: str | None = None

    model_config = ConfigDict(from_attributes=True)

class ReservationStatusUpdate(BaseModel):
    status: Literal[
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "CHECKED_IN",
        "CHECKED_OUT",
    ]
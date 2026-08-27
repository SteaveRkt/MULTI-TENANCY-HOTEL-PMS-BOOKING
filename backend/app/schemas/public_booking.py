from datetime import date
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr


class PublicHotelResponse(BaseModel):
    id: uuid.UUID
    name: str
    address: str | None
    phone: str | None
    email: str | None

    model_config = ConfigDict(from_attributes=True)


class PublicRoomResponse(BaseModel):
    hotel_name: str

    room_id: uuid.UUID
    room_number: str
    room_type: str
    capacity: int
    price_per_night: float
    description: str | None

    model_config = ConfigDict(from_attributes=True)


class PublicReservationCreate(BaseModel):
    room_id: uuid.UUID

    first_name: str
    last_name: str
    email: EmailStr
    phone: str | None = None

    check_in: date
    check_out: date

    number_of_guests: int = 1
    special_requests: str | None = None


class PublicReservationResponse(BaseModel):
    reservation_id: uuid.UUID
    reservation_code: str
    hotel_id: uuid.UUID
    hotel_name: str

    room_id: uuid.UUID
    room_number: str

    customer_id: uuid.UUID

    check_in: date
    check_out: date

    number_of_guests: int

    status: str
    total_price: float
    is_paid: bool = False

    model_config = ConfigDict(from_attributes=True)
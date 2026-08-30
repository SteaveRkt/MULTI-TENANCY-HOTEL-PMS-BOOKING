from datetime import date
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class PublicHotelResponse(BaseModel):
    id: uuid.UUID
    name: str
    address: str | None
    phone: str | None
    email: str | None

    model_config = ConfigDict(from_attributes=True)


class PublicRoomReviewEntry(BaseModel):
    reviewer_name: str
    rating: int
    comment: str

    model_config = ConfigDict(from_attributes=True)


class PublicRoomResponse(BaseModel):
    hotel_id: uuid.UUID | None = None
    hotel_name: str
    city: str | None = None
    address: str | None = None

    room_id: uuid.UUID
    room_number: str
    room_type: str
    capacity: int
    price_per_night: float
    rating: float = 0
    reviews_count: int = 0
    description: str | None
    image_url: str | None = None
    image_urls: list[str] = Field(default_factory=list)
    reviews: list[PublicRoomReviewEntry] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class PublicRoomReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    reviewer_name: str = Field(min_length=2)
    comment: str = Field(min_length=2)

    @field_validator('reviewer_name', 'comment')
    @classmethod
    def clean_review_text(cls, value):
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise ValueError('Le texte doit contenir au moins 2 caractères.')
        return cleaned


class PublicRoomReviewResponse(BaseModel):
    room_id: uuid.UUID
    rating: float
    reviews_count: int
    message: str

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
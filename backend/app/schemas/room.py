from pydantic import BaseModel, ConfigDict, Field
import uuid

class RoomCreate(BaseModel):
    number: str
    type: str
    floor: int | None = None
    capacity: int = 2
    price_per_night: float
    rating: float = 0.0
    reviews_count: int = 0
    status: str = "AVAILABLE"
    description: str | None = None
    image_url: str | None = None
    image_urls: list[str] = Field(default_factory=list)


class RoomResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    number: str
    type: str
    floor: int | None
    capacity: int
    price_per_night: float
    rating: float = 0.0
    reviews_count: int = 0
    status: str
    description: str | None
    image_url: str | None = None
    image_urls: list[str] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
class RoomUpdate(BaseModel):
    number: str | None = None
    type: str | None = None
    floor: int | None = None
    capacity: int | None = None
    price_per_night: float | None = None
    rating: float | None = None
    reviews_count: int | None = None
    status: str | None = None
    description: str | None = None
    image_url: str | None = None
    image_urls: list[str] | None = None
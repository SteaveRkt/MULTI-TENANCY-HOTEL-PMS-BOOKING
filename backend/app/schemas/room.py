from pydantic import BaseModel, ConfigDict
import uuid

class RoomCreate(BaseModel):
    number: str
    type: str
    floor: int | None = None
    capacity: int = 2
    price_per_night: float
    status: str = "AVAILABLE"
    description: str | None = None


class RoomResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    number: str
    type: str
    floor: int | None
    capacity: int
    price_per_night: float
    status: str
    description: str | None

    model_config = ConfigDict(from_attributes=True)
class RoomUpdate(BaseModel):
    number: str | None = None
    type: str | None = None
    floor: int | None = None
    capacity: int | None = None
    price_per_night: float | None = None
    status: str | None = None
    description: str | None = None
from typing import Literal
import uuid
from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: Literal["ADMIN", "RECEPTIONIST", "SUPER_ADMIN"] = "RECEPTIONIST"


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    password: str | None = None
    role: Literal["ADMIN", "RECEPTIONIST", "SUPER_ADMIN"] | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID | None = None
    hotel_name: str | None = None
    tenant_name: str | None = None
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
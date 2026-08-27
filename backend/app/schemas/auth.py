import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class RegisterRequest(BaseModel):
    hotel_name: str
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    address: str = ""
    city: str = ""
    phone: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
from pydantic import BaseModel, ConfigDict, EmailStr
import uuid

class CustomerCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None


class CustomerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None


class CustomerResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr | None
    phone: str | None
    address: str | None

    model_config = ConfigDict(from_attributes=True)
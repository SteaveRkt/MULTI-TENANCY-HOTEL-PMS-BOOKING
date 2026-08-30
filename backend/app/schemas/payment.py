from pydantic import BaseModel, ConfigDict
from typing import Literal
import uuid


class PaymentCreate(BaseModel):
    method: Literal[
        "CARD",
        "MOBILE_MONEY",
    ]


class PaymentResponse(BaseModel):
    id: uuid.UUID
    reservation_id: uuid.UUID

    amount: float
    method: str
    status: str

    transaction_id: str | None

    model_config = ConfigDict(from_attributes=True)
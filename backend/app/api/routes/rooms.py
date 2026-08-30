from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from app.api.deps import get_current_user,require_role
from app.core.database import get_db
from app.models.room import Room
from app.models.user import User
from app.schemas.room import RoomCreate, RoomResponse,RoomUpdate
from app.models.reservation import Reservation
from app.api.routes.public import normalize_image_urls
import uuid


router = APIRouter(
    prefix="/api/rooms",
    tags=["Rooms"],
)


@router.post(
    "",
    response_model=RoomResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_room(
    data: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    image_urls = normalize_image_urls(
        data.image_urls,
        data.image_url,
    )
    combined_image_url = ", ".join(image_urls) if image_urls else None

    room = Room(
        tenant_id=current_user.tenant_id,
        number=data.number,
        type=data.type,
        floor=data.floor,
        capacity=data.capacity,
        price_per_night=data.price_per_night,
        rating=data.rating,
        reviews_count=data.reviews_count,
        status=data.status,
        description=data.description,
        image_url=combined_image_url,
    )

    db.add(room)
    db.commit()
    db.refresh(room)

    return room


@router.get(
    "",
    response_model=list[RoomResponse],
)
def get_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rooms = (
        db.query(Room)
        .filter(
            Room.tenant_id == current_user.tenant_id
        )
        .all()
    )

    return rooms

@router.get(
    "/available",
    response_model=list[RoomResponse],
)
def get_available_rooms(
    check_in: date,
    check_out: date,
    type: str | None = None,
    capacity: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN", "RECEPTIONIST")
    ),
):
    if check_in >= check_out:
        raise HTTPException(
            status_code=400,
            detail="Check-out must be after check-in",
        )

    tenant_id = current_user.tenant_id

    # Toutes les réservations qui occupent la chambre
    overlapping_reservations = (
        db.query(Reservation.room_id)
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.status.in_([
                "PENDING",
                "CONFIRMED",
                "CHECKED_IN",
            ]),
            Reservation.check_in < check_out,
            Reservation.check_out > check_in,
        )
        .subquery()
    )

    query = (
        db.query(Room)
        .filter(
            Room.tenant_id == tenant_id,
            Room.status != "MAINTENANCE",
            ~Room.id.in_(
                db.query(
                    overlapping_reservations.c.room_id
                )
            ),
        )
    )

    if type:
        query = query.filter(Room.type == type)
    if capacity:
        query = query.filter(Room.capacity >= capacity)
    if min_price is not None:
        query = query.filter(Room.price_per_night >= min_price)
    if max_price is not None:
        query = query.filter(Room.price_per_night <= max_price)

    rooms = query.order_by(Room.floor.asc(), Room.number.asc()).all()
    return rooms


@router.get(
    "/{room_id}",
    response_model=RoomResponse,
)
def get_room(
    room_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    return room

@router.put(
    "/{room_id}",
    response_model=RoomResponse,
)
def update_room(
    room_id: uuid.UUID,
    data: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")
),
):
    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    update_data = data.model_dump(exclude_unset=True)

    if "image_urls" in update_data or "image_url" in update_data:
        image_urls = normalize_image_urls(
            update_data.get("image_urls"),
            update_data.get("image_url"),
        )
        room.image_url = ", ".join(image_urls) if image_urls else None
        update_data.pop("image_urls", None)
        update_data.pop("image_url", None)

    for field, value in update_data.items():
        setattr(room, field, value)

    db.commit()
    db.refresh(room)

    return room

@router.delete(
    "/{room_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_room(
    room_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN")),
):
    room = (
        db.query(Room)
        .filter(
            Room.id == room_id,
            Room.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    reservation_exists = (
        db.query(Reservation)
        .filter(
            Reservation.room_id == room.id,
            Reservation.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if reservation_exists:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete a room with reservations",
        )

    db.delete(room)
    db.commit()
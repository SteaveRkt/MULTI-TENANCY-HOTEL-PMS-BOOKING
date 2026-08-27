from datetime import date
import uuid
import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db

from app.models.payment import Payment

from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
)
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.customer import Customer
from app.models.reservation import Reservation

from app.schemas.public_booking import (
    PublicHotelResponse,
    PublicRoomResponse,
    PublicReservationCreate,
    PublicReservationResponse,
)
from fastapi.responses import StreamingResponse

from app.services.invoice import generate_invoice_pdf, get_invoice_filename

def generate_reservation_code(db: Session) -> str:
    while True:
        code = "HTL-" + secrets.token_hex(4).upper()

        existing = (
            db.query(Reservation)
            .filter(
                Reservation.reservation_code == code
            )
            .first()
        )

        if not existing:
            return code


router = APIRouter(
    prefix="/api/public",
    tags=["Public Booking"],
)


@router.get(
    "/hotels",
    response_model=list[PublicHotelResponse],
)
def get_public_hotels(
    db: Session = Depends(get_db),
):
    hotels = (
        db.query(Tenant)
        .order_by(Tenant.name)
        .all()
    )

    return hotels


@router.get(
    "/rooms/available",
    response_model=list[PublicRoomResponse],
)
def get_public_available_rooms(
    city: str,
    check_in: date,
    check_out: date,
    guests: int = 1,
    max_price: float | None = None,
    room_type: str | None = None,
    db: Session = Depends(get_db),
):


    if check_in >= check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out must be after check-in",
        )

    if guests < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of guests must be at least 1",
        )

    if max_price is not None and max_price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum price cannot be negative",
        )



    query = (
        db.query(Room)
        .join(
            Tenant,
            Room.tenant_id == Tenant.id,
        )
        .filter(
            Tenant.city.ilike(f"%{city}%"),
            Room.status != "MAINTENANCE",
            Room.capacity >= guests,
        )
    )

 
    if max_price is not None:
        query = query.filter(
            Room.price_per_night <= max_price
        )


    if room_type:
        query = query.filter(
            Room.type.ilike(
                f"%{room_type}%"
            )
        )

    rooms = query.all()

    available_rooms = []


    for room in rooms:

        overlapping_reservation = (
            db.query(Reservation)
            .filter(
                Reservation.room_id == room.id,

                Reservation.status.in_([
                    "PENDING",
                    "CONFIRMED",
                    "CHECKED_IN",
                ]),

                Reservation.check_in < check_out,
                Reservation.check_out > check_in,
            )
            .first()
        )

        if overlapping_reservation:
            continue


        available_rooms.append(
            PublicRoomResponse(
                hotel_id=room.tenant.id,
                hotel_name=room.tenant.name,
                city=room.tenant.city,

                room_id=room.id,
                room_number=room.number,
                room_type=room.type,

                capacity=room.capacity,

                price_per_night=float(
                    room.price_per_night
                ),

                description=room.description,
            )
        )

    return available_rooms



@router.post(
    "/reservations",
    response_model=PublicReservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_public_reservation(
    data: PublicReservationCreate,
    db: Session = Depends(get_db),
):

    if data.check_in >= data.check_out:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Check-out must be after check-in",
        )


    if data.number_of_guests < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of guests must be at least 1",
        )


    room = (
        db.query(Room)
        .filter(
            Room.id == data.room_id,
        )
        .with_for_update()
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found",
        )

    if room.status == "MAINTENANCE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Room is currently under maintenance",
        )


    if data.number_of_guests > room.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Number of guests exceeds room capacity",
        )


    overlapping = (
        db.query(Reservation)
        .filter(
            Reservation.room_id == room.id,

            Reservation.status.in_([
                "PENDING",
                "CONFIRMED",
                "CHECKED_IN",
            ]),

            Reservation.check_in < data.check_out,
            Reservation.check_out > data.check_in,
        )
        .first()
    )

    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Room is no longer available",
        )

    hotel = (
        db.query(Tenant)
        .filter(
            Tenant.id == room.tenant_id
        )
        .first()
    )

    if not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hotel not found",
        )


    customer = (
        db.query(Customer)
        .filter(
            Customer.tenant_id == room.tenant_id,
            Customer.email == data.email,
        )
        .first()
    )

    if not customer:

        customer = Customer(
            tenant_id=room.tenant_id,
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            phone=data.phone,
        )

        db.add(customer)
        db.flush()

    number_of_nights = (
        data.check_out - data.check_in
    ).days


    total_price = (
        number_of_nights
        * float(room.price_per_night)
    )


    reservation = Reservation(
        reservation_code=generate_reservation_code(db),

        tenant_id=room.tenant_id,

        room_id=room.id,

        customer_id=customer.id,

        check_in=data.check_in,

        check_out=data.check_out,

        number_of_guests=data.number_of_guests,

        status="PENDING",

        total_price=total_price,

        special_requests=data.special_requests,
    )

    db.add(reservation)

    try:
        db.commit()
        db.refresh(reservation)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create reservation",
        )


    return PublicReservationResponse(
        reservation_id=reservation.id,
        reservation_code=reservation.reservation_code,
        hotel_id=hotel.id,
        hotel_name=hotel.name,

        room_id=room.id,
        room_number=room.number,

        customer_id=customer.id,

        check_in=reservation.check_in,
        check_out=reservation.check_out,

        number_of_guests=reservation.number_of_guests,

        status=reservation.status,

        total_price=float(
            reservation.total_price
        ),
    )
@router.get(
    "/reservations/{reservation_code}",
    response_model=PublicReservationResponse,
)
def get_public_reservation(
    reservation_code: str,
    db: Session = Depends(get_db),
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.reservation_code
            == reservation_code
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    room = (
        db.query(Room)
        .filter(
            Room.id == reservation.room_id
        )
        .first()
    )

    hotel = (
        db.query(Tenant)
        .filter(
            Tenant.id == reservation.tenant_id
        )
        .first()
    )

    if not room or not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation data not found",
        )

    return PublicReservationResponse(
        reservation_id=reservation.id,

        reservation_code=reservation.reservation_code,

        hotel_id=hotel.id,
        hotel_name=hotel.name,

        room_id=room.id,
        room_number=room.number,

        customer_id=reservation.customer_id,

        check_in=reservation.check_in,
        check_out=reservation.check_out,

        number_of_guests=reservation.number_of_guests,

        status=reservation.status,

        total_price=float(
            reservation.total_price
        ),
    )
@router.post(
    "/reservations/{reservation_code}/cancel",
    response_model=PublicReservationResponse,
)
def cancel_public_reservation(
    reservation_code: str,
    db: Session = Depends(get_db),
):
    

    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.reservation_code == reservation_code
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )


    if reservation.status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation is already cancelled",
        )

    if reservation.status == "CHECKED_IN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A checked-in reservation cannot be cancelled",
        )

    if reservation.status == "CHECKED_OUT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A checked-out reservation cannot be cancelled",
        )



    reservation.status = "CANCELLED"

    db.commit()
    db.refresh(reservation)



    room = (
        db.query(Room)
        .filter(
            Room.id == reservation.room_id
        )
        .first()
    )

    hotel = (
        db.query(Tenant)
        .filter(
            Tenant.id == reservation.tenant_id
        )
        .first()
    )

    if not room or not hotel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation data not found",
        )


    return PublicReservationResponse(
        reservation_id=reservation.id,

        reservation_code=reservation.reservation_code,

        hotel_id=hotel.id,
        hotel_name=hotel.name,

        room_id=room.id,
        room_number=room.number,

        customer_id=reservation.customer_id,

        check_in=reservation.check_in,
        check_out=reservation.check_out,

        number_of_guests=reservation.number_of_guests,

        status=reservation.status,

        total_price=float(
            reservation.total_price
        ),
    )
@router.post(
    "/reservations/{reservation_code}/payment",
    response_model=PaymentResponse,
)
def pay_public_reservation(
    reservation_code: str,
    data: PaymentCreate,
    db: Session = Depends(get_db),
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.reservation_code
            == reservation_code
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    if reservation.status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cancelled reservation cannot be paid",
        )

    if reservation.status == "CONFIRMED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation is already confirmed",
        )

    if reservation.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reservation cannot be paid",
        )

    existing_payment = (
        db.query(Payment)
        .filter(
            Payment.reservation_id
            == reservation.id
        )
        .first()
    )

    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment already exists",
        )

    transaction_id = (
        "TXN-"
        + secrets.token_hex(6).upper()
    )

    payment = Payment(
        reservation_id=reservation.id,
        amount=reservation.total_price,
        method=data.method,
        status="SUCCESS",
        transaction_id=transaction_id,
    )

    db.add(payment)

    reservation.status = "CONFIRMED"

    try:
        db.commit()
        db.refresh(payment)

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Payment processing failed",
        )

    return payment
@router.get(
    "/reservations/{reservation_code}/invoice",
)
def get_reservation_invoice(
    reservation_code: str,
    db: Session = Depends(get_db),
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.reservation_code
            == reservation_code
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Réservation introuvable",
        )

    if reservation.status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Impossible d'émettre une facture pour une réservation annulée",
        )

    payment = (
        db.query(Payment)
        .filter(
            Payment.reservation_id == reservation.id,
            Payment.status == "SUCCESS",
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=400,
            detail="La facture n'est disponible que pour les réservations payées.",
        )

    room = (
        db.query(Room)
        .filter(
            Room.id == reservation.room_id
        )
        .first()
    )

    hotel = (
        db.query(Tenant)
        .filter(
            Tenant.id == reservation.tenant_id
        )
        .first()
    )

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == reservation.customer_id
        )
        .first()
    )

    if not room or not hotel or not customer:
        raise HTTPException(
            status_code=404,
            detail="Données de la réservation incomplètes",
        )

    pdf = generate_invoice_pdf(
        reservation=reservation,
        room=room,
        hotel=hotel,
        customer=customer,
        payment=payment,
    )

    filename = get_invoice_filename(hotel, reservation)
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )
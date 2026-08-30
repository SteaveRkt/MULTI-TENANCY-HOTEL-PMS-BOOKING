# app/api/routes/reservation.py
from datetime import date
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import secrets
from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.core.utils import generate_reservation_code
from app.models.customer import Customer
from app.models.reservation import Reservation
from app.models.room import Room
from app.models.tenant import Tenant
from app.models.user import User
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate, PaymentResponse
from app.schemas.reservation import (
    ReservationCreate,
    ReservationResponse,
    ReservationStatusUpdate
)
from app.services.invoice import generate_invoice_pdf, get_invoice_filename


router = APIRouter(
    prefix="/api/reservations",
    tags=["Reservations"],
)


@router.post(
    "",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_reservation(
    data: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tenant_id = current_user.tenant_id

    if data.check_in >= data.check_out:
        raise HTTPException(
            status_code=400,
            detail="Check-out must be after check-in",
        )

    room = (
        db.query(Room)
        .filter(
            Room.id == data.room_id,
            Room.tenant_id == tenant_id,
        )
        .with_for_update()
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    if room.status == "MAINTENANCE":
        raise HTTPException(
            status_code=400,
            detail="Room is currently under maintenance",
        )

    if data.number_of_guests > room.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Room capacity is {room.capacity}, but {data.number_of_guests} guests requested",
        )

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == data.customer_id,
            Customer.tenant_id == tenant_id,
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    overlapping_reservation = (
        db.query(Reservation)
        .filter(
            Reservation.room_id == room.id,
            Reservation.tenant_id == tenant_id,
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

    if overlapping_reservation:
        raise HTTPException(
            status_code=409,
            detail="Room is not available for these dates",
        )

    number_of_nights = (
        data.check_out - data.check_in
    ).days

    total_price = (
        number_of_nights * float(room.price_per_night)
    )

    reservation_code = generate_reservation_code(db)

    reservation = Reservation(
        tenant_id=tenant_id,
        room_id=room.id,
        customer_id=customer.id,
        check_in=data.check_in,
        check_out=data.check_out,
        number_of_guests=data.number_of_guests,
        status="CONFIRMED",
        total_price=total_price,
        special_requests=data.special_requests,
        reservation_code=reservation_code,
        user_id=current_user.id,  # Traçabilité : réceptionniste/admin ayant enregistré
    )

    if data.check_in <= date.today() and data.check_out > date.today():
        room.status = "OCCUPIED"

    db.add(reservation)
    db.commit()
    db.refresh(reservation)

    # Charger les relations pour la réponse
    db.refresh(customer)
    db.refresh(room)
    receptionist_name = f"{current_user.first_name} {current_user.last_name}"

    return ReservationResponse(
        id=reservation.id,
        reservation_code=reservation.reservation_code,
        tenant_id=reservation.tenant_id,
        room_id=reservation.room_id,
        customer_id=reservation.customer_id,
        user_id=reservation.user_id,
        check_in=reservation.check_in,
        check_out=reservation.check_out,
        number_of_guests=reservation.number_of_guests,
        status=reservation.status,
        total_price=float(reservation.total_price),
        special_requests=reservation.special_requests,
        is_paid=False,
        receptionist_name=receptionist_name,
        customer_name=f"{customer.first_name} {customer.last_name}",
        room_number=room.number,
    )


@router.post(
    "/{reservation_id}/payment",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_internal_payment(
    reservation_id: uuid.UUID,
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "RECEPTIONIST")), # type: ignore
):
   
    tenant_id = current_user.tenant_id

    # 1. Récupérer la réservation
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == reservation_id,
            Reservation.tenant_id == tenant_id,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reservation not found",
        )

    # 2. Vérifier si un paiement existe déjà
    existing_payment = (
        db.query(Payment)
        .filter(
            Payment.reservation_id == reservation.id,
            Payment.status == "SUCCESS"
        )
        .first()
    )

    if existing_payment:
        raise HTTPException(
            status_code=409,
            detail="Payment already exists for this reservation",
        )

    # 3. Vérifier le statut de la réservation
    if reservation.status in ["CANCELLED", "CHECKED_OUT"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot make payment for a {reservation.status} reservation",
        )

    # 4. Générer un ID de transaction
    transaction_id = f"TXN-{secrets.token_hex(6).upper()}"

    # 5. Créer le paiement
    payment = Payment(
        reservation_id=reservation.id,
        amount=reservation.total_price,
        method=data.method,
        status="SUCCESS",
        transaction_id=transaction_id,
    )

    db.add(payment)

    # 6. Mettre à jour le statut de la réservation si elle est en PENDING
    if reservation.status == "PENDING":
        reservation.status = "CONFIRMED"
        
        # Mettre à jour le statut de la chambre
        room = (
            db.query(Room)
            .filter(Room.id == reservation.room_id)
            .first()
        )
        if room:
            if reservation.check_in <= date.today() and reservation.check_out > date.today():
                room.status = "OCCUPIED"

    try:
        db.commit()
        db.refresh(payment)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Payment failed: {str(e)}",
        )

    return payment


@router.get(
    "/{reservation_id}/payments",
    response_model=list[PaymentResponse],
)
def get_reservation_payments(
    reservation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "RECEPTIONIST")),
):
    """
    Récupérer tous les paiements d'une réservation
    """
    tenant_id = current_user.tenant_id

    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == reservation_id,
            Reservation.tenant_id == tenant_id,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reservation not found",
        )

    payments = (
        db.query(Payment)
        .filter(Payment.reservation_id == reservation.id)
        .order_by(Payment.created_at.desc())
        .all()
    )

    return payments


@router.get(
    "",
    response_model=list[ReservationResponse],
)
def get_reservations(
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload
    query = (
        db.query(Reservation)
        .options(
            joinedload(Reservation.customer),
            joinedload(Reservation.room),
            joinedload(Reservation.user),
        )
        .filter(Reservation.tenant_id == current_user.tenant_id)
    )
    if status:
        query = query.filter(Reservation.status == status)
    reservations = query.order_by(Reservation.check_in.desc()).all()

    res_ids = [r.id for r in reservations]
    paid_ids = set()
    if res_ids:
        paid_records = (
            db.query(Payment.reservation_id)
            .filter(
                Payment.reservation_id.in_(res_ids),
                Payment.status == "SUCCESS",
            )
            .all()
        )
        paid_ids = {p[0] for p in paid_records}

    result = []
    for r in reservations:
        # Traçabilité réceptionniste
        if r.user_id and r.user:
            receptionist_name = f"{r.user.first_name} {r.user.last_name}"
        else:
            receptionist_name = "Portail Public (En ligne)"

        customer_name = None
        if r.customer:
            customer_name = f"{r.customer.first_name} {r.customer.last_name}"

        room_number = r.room.number if r.room else None

        result.append(
            ReservationResponse(
                id=r.id,
                reservation_code=r.reservation_code,
                tenant_id=r.tenant_id,
                room_id=r.room_id,
                customer_id=r.customer_id,
                user_id=r.user_id,
                check_in=r.check_in,
                check_out=r.check_out,
                number_of_guests=r.number_of_guests,
                status=r.status,
                total_price=float(r.total_price),
                special_requests=r.special_requests,
                is_paid=r.id in paid_ids,
                receptionist_name=receptionist_name,
                customer_name=customer_name,
                room_number=room_number,
            )
        )
    return result


@router.get(
    "/{reservation_id}",
    response_model=ReservationResponse,
)
def get_reservation(
    reservation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from sqlalchemy.orm import joinedload
    reservation = (
        db.query(Reservation)
        .options(
            joinedload(Reservation.customer),
            joinedload(Reservation.room),
            joinedload(Reservation.user),
        )
        .filter(
            Reservation.id == reservation_id,
            Reservation.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reservation not found",
        )

    is_paid = (
        db.query(Payment)
        .filter(
            Payment.reservation_id == reservation.id,
            Payment.status == "SUCCESS",
        )
        .first()
        is not None
    )

    if reservation.user_id and reservation.user:
        receptionist_name = f"{reservation.user.first_name} {reservation.user.last_name}"
    else:
        receptionist_name = "Portail Public (En ligne)"

    customer_name = None
    if reservation.customer:
        customer_name = f"{reservation.customer.first_name} {reservation.customer.last_name}"

    room_number = reservation.room.number if reservation.room else None

    return ReservationResponse(
        id=reservation.id,
        reservation_code=reservation.reservation_code,
        tenant_id=reservation.tenant_id,
        room_id=reservation.room_id,
        customer_id=reservation.customer_id,
        user_id=reservation.user_id,
        check_in=reservation.check_in,
        check_out=reservation.check_out,
        number_of_guests=reservation.number_of_guests,
        status=reservation.status,
        total_price=float(reservation.total_price),
        special_requests=reservation.special_requests,
        is_paid=is_paid,
        receptionist_name=receptionist_name,
        customer_name=customer_name,
        room_number=room_number,
    )


@router.patch(
    "/{reservation_id}/status",
    response_model=ReservationResponse,
)
def update_reservation_status(
    reservation_id: uuid.UUID,
    data: ReservationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN", "RECEPTIONIST")
    ),
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == reservation_id,
            Reservation.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reservation not found",
        )

    room = (
        db.query(Room)
        .filter(
            Room.id == reservation.room_id,
            Room.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    current_status = reservation.status
    new_status = data.status

    allowed_transitions = {
        "PENDING": ["CONFIRMED", "CANCELLED"],
        "CONFIRMED": ["CHECKED_IN", "CANCELLED"],
        "CHECKED_IN": ["CHECKED_OUT"],
        "CHECKED_OUT": [],
        "CANCELLED": [],
    }

    if new_status not in allowed_transitions.get(current_status, []):
        raise HTTPException(
            status_code=400,
            detail=(
                f"Cannot change reservation status "
                f"from {current_status} to {new_status}"
            ),
        )

    reservation.status = new_status

    if new_status == "CHECKED_IN":
        room.status = "OCCUPIED"

    elif new_status == "CHECKED_OUT":
        room.status = "AVAILABLE"

    elif new_status == "CANCELLED":
        has_other_reservation = (
            db.query(Reservation)
            .filter(
                Reservation.room_id == room.id,
                Reservation.tenant_id == current_user.tenant_id,
                Reservation.status == "CHECKED_IN",
                Reservation.check_in <= date.today(),
                Reservation.check_out > date.today(),
                Reservation.id != reservation.id,
            )
            .first()
        )

        if not has_other_reservation:
            room.status = "AVAILABLE"

    elif new_status == "CONFIRMED":
        if reservation.check_in <= date.today() and reservation.check_out > date.today():
            room.status = "OCCUPIED"

    db.commit()
    db.refresh(reservation)

    return reservation


@router.put(
    "/{reservation_id}",
    response_model=ReservationResponse,
)
def update_reservation(
    reservation_id: uuid.UUID,
    data: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN", "RECEPTIONIST")
    ),
):
    tenant_id = current_user.tenant_id

    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == reservation_id,
            Reservation.tenant_id == tenant_id,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reservation not found",
        )

    if reservation.status in [
        "CHECKED_IN",
        "CHECKED_OUT",
        "CANCELLED",
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "This reservation cannot be modified "
                "in its current status"
            ),
        )

    if data.check_in >= data.check_out:
        raise HTTPException(
            status_code=400,
            detail="Check-out must be after check-in",
        )

    room = (
        db.query(Room)
        .filter(
            Room.id == data.room_id,
            Room.tenant_id == tenant_id,
        )
        .with_for_update()
        .first()
    )

    if not room:
        raise HTTPException(
            status_code=404,
            detail="Room not found",
        )

    if room.status == "MAINTENANCE":
        raise HTTPException(
            status_code=400,
            detail="Room is currently under maintenance",
        )

    if data.number_of_guests > room.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Room capacity is {room.capacity}, but {data.number_of_guests} guests requested",
        )

    customer = (
        db.query(Customer)
        .filter(
            Customer.id == data.customer_id,
            Customer.tenant_id == tenant_id,
        )
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    overlapping = (
        db.query(Reservation)
        .filter(
            Reservation.id != reservation.id,
            Reservation.room_id == room.id,
            Reservation.tenant_id == tenant_id,
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
            status_code=409,
            detail="Room is not available for these dates",
        )

    number_of_nights = (
        data.check_out - data.check_in
    ).days

    total_price = (
        number_of_nights
        * float(room.price_per_night)
    )

    reservation.room_id = room.id
    reservation.customer_id = customer.id
    reservation.check_in = data.check_in
    reservation.check_out = data.check_out
    reservation.number_of_guests = data.number_of_guests
    reservation.total_price = total_price
    reservation.special_requests = data.special_requests

    if reservation.check_in <= date.today() and reservation.check_out > date.today():
        room.status = "OCCUPIED"

    db.commit()
    db.refresh(reservation)

    return reservation


@router.delete(
    "/{reservation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_reservation(
    reservation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("ADMIN", "RECEPTIONIST")
    ),
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == reservation_id,
            Reservation.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(
            status_code=404,
            detail="Reservation not found",
        )

    if reservation.status in [
        "CHECKED_IN",
        "CHECKED_OUT",
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                "Cannot delete a reservation "
                "after check-in"
            ),
        )

    room = (
        db.query(Room)
        .filter(
            Room.id == reservation.room_id,
            Room.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if room:
        has_other_reservation = (
            db.query(Reservation)
            .filter(
                Reservation.room_id == room.id,
                Reservation.tenant_id == current_user.tenant_id,
                Reservation.status.in_(["CONFIRMED", "CHECKED_IN"]),
                Reservation.id != reservation.id,
            )
            .first()
        )

        if not has_other_reservation:
            room.status = "AVAILABLE"

    reservation.status = "CANCELLED"

    db.commit()


@router.get("/{reservation_id}/invoice")
def get_reservation_invoice_admin(
    reservation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "RECEPTIONIST")),
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == reservation_id,
            Reservation.tenant_id == current_user.tenant_id,
        )
        .first()
    )

    if not reservation:
        raise HTTPException(status_code=404, detail="Réservation introuvable")

    if reservation.status == "CANCELLED":
        raise HTTPException(
            status_code=400,
            detail="Impossible de générer une facture pour une réservation annulée",
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
            detail="La facture est uniquement disponible pour les réservations payées.",
        )

    room = db.query(Room).filter(Room.id == reservation.room_id).first()
    hotel = db.query(Tenant).filter(Tenant.id == reservation.tenant_id).first()
    customer = db.query(Customer).filter(Customer.id == reservation.customer_id).first()

    if not room or not hotel or not customer:
        raise HTTPException(
            status_code=404,
            detail="Données de la réservation incomplètes",
        )

    # Charger le réceptionniste ayant créé la réservation
    staff = None
    if reservation.user_id:
        staff = db.query(User).filter(User.id == reservation.user_id).first()
    if not staff:
        staff = current_user  # fallback: celui qui télécharge

    pdf = generate_invoice_pdf(
        reservation=reservation,
        room=room,
        hotel=hotel,
        customer=customer,
        payment=payment,
        staff=staff,
    )

    filename = get_invoice_filename(hotel, reservation)
    return StreamingResponse(
        pdf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )

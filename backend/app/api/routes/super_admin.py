import uuid
from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.api.deps import require_role
from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User
from app.models.tenant import Tenant
from app.models.room import Room
from app.models.customer import Customer
from app.models.reservation import Reservation
from app.models.payment import Payment


router = APIRouter(
    prefix="/api/super-admin",
    tags=["Super Admin"],
)


# =========================================================================
# SCHEMAS
# =========================================================================

class HotelCreateRequest(BaseModel):
    name: str
    city: str
    address: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    admin_first_name: str
    admin_last_name: str
    admin_email: EmailStr
    admin_password: str


class HotelUpdateRequest(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


# =========================================================================
# 1. GLOBAL PLATFORM STATS
# =========================================================================

@router.get("/stats")
def get_global_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN")),
):
    total_hotels = db.query(Tenant).count()
    total_rooms = db.query(Room).count()
    total_reservations = db.query(Reservation).count()
    total_customers = db.query(Customer).count()
    total_users = db.query(User).filter(User.role != "SUPER_ADMIN").count()

    total_revenue = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == "SUCCESS")
        .scalar()
    )
    total_revenue = float(total_revenue or 0)

    # Répartition des réservations par statut
    statuses = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "PENDING", "CANCELLED"]
    status_counts = {}
    for s in statuses:
        status_counts[s] = db.query(Reservation).filter(Reservation.status == s).count()

    # 5 Hôtels les plus récents
    recent_hotels_raw = (
        db.query(Tenant)
        .order_by(Tenant.created_at.desc())
        .limit(5)
        .all()
    )
    recent_hotels = []
    for h in recent_hotels_raw:
        r_count = db.query(Room).filter(Room.tenant_id == h.id).count()
        b_count = db.query(Reservation).filter(Reservation.tenant_id == h.id).count()
        rev = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .join(Reservation, Payment.reservation_id == Reservation.id)
            .filter(Reservation.tenant_id == h.id, Payment.status == "SUCCESS")
            .scalar()
        )
        recent_hotels.append({
            "id": str(h.id),
            "name": h.name,
            "city": h.city,
            "rooms_count": r_count,
            "reservations_count": b_count,
            "revenue": float(rev or 0),
            "created_at": h.created_at.isoformat() if h.created_at else None,
        })

    return {
        "total_hotels": total_hotels,
        "total_rooms": total_rooms,
        "total_reservations": total_reservations,
        "total_customers": total_customers,
        "total_users": total_users,
        "total_revenue": total_revenue,
        "status_breakdown": status_counts,
        "recent_hotels": recent_hotels,
    }


# =========================================================================
# 2. ALL HOTELS LIST & MANAGEMENT
# =========================================================================

@router.get("/hotels")
def get_all_hotels(
    search: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN")),
):
    query = db.query(Tenant)
    if search:
        query = query.filter(Tenant.name.ilike(f"%{search}%"))
    if city:
        query = query.filter(Tenant.city.ilike(f"%{city}%"))

    hotels_raw = query.order_by(Tenant.name.asc()).all()
    results = []

    for h in hotels_raw:
        rooms_count = db.query(Room).filter(Room.tenant_id == h.id).count()
        res_count = db.query(Reservation).filter(Reservation.tenant_id == h.id).count()
        staff_count = db.query(User).filter(User.tenant_id == h.id).count()

        admin_user = (
            db.query(User)
            .filter(User.tenant_id == h.id, User.role == "ADMIN")
            .first()
        )

        rev = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .join(Reservation, Payment.reservation_id == Reservation.id)
            .filter(Reservation.tenant_id == h.id, Payment.status == "SUCCESS")
            .scalar()
        )

        results.append({
            "id": str(h.id),
            "name": h.name,
            "city": h.city,
            "address": h.address,
            "phone": h.phone,
            "email": h.email,
            "created_at": h.created_at.isoformat() if h.created_at else None,
            "rooms_count": rooms_count,
            "reservations_count": res_count,
            "staff_count": staff_count,
            "total_revenue": float(rev or 0),
            "admin": {
                "id": str(admin_user.id) if admin_user else None,
                "first_name": admin_user.first_name if admin_user else None,
                "last_name": admin_user.last_name if admin_user else None,
                "email": admin_user.email if admin_user else None,
                "is_active": admin_user.is_active if admin_user else None,
            } if admin_user else None,
        })

    return results


@router.post("/hotels", status_code=status.HTTP_201_CREATED)
def create_hotel_and_admin(
    data: HotelCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN")),
):
    existing_user = db.query(User).filter(User.email == data.admin_email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=f"L'adresse email '{data.admin_email}' est déjà utilisée par un autre compte.",
        )

    # 1. Créer le Tenant (Hôtel)
    tenant = Tenant(
        name=data.name.strip(),
        city=data.city.strip() if data.city else None,
        address=data.address.strip() if data.address else None,
        phone=data.phone.strip() if data.phone else None,
        email=data.email.strip() if data.email else None,
    )
    db.add(tenant)
    db.flush()

    # 2. Créer l'administrateur initial de l'hôtel
    admin_user = User(
        tenant_id=tenant.id,
        first_name=data.admin_first_name.strip(),
        last_name=data.admin_last_name.strip(),
        email=data.admin_email.strip(),
        password_hash=hash_password(data.admin_password),
        role="ADMIN",
        is_active=True,
    )
    db.add(admin_user)
    db.commit()
    db.refresh(tenant)
    db.refresh(admin_user)

    return {
        "message": "Établissement hôtelier et compte administrateur créés avec succès.",
        "hotel": {
            "id": str(tenant.id),
            "name": tenant.name,
            "city": tenant.city,
            "phone": tenant.phone,
            "email": tenant.email,
        },
        "admin": {
            "id": str(admin_user.id),
            "name": f"{admin_user.first_name} {admin_user.last_name}",
            "email": admin_user.email,
        }
    }


@router.put("/hotels/{hotel_id}")
def update_hotel(
    hotel_id: uuid.UUID,
    data: HotelUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN")),
):
    hotel = db.query(Tenant).filter(Tenant.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Établissement introuvable")

    if data.name is not None:
        hotel.name = data.name.strip()
    if data.city is not None:
        hotel.city = data.city.strip()
    if data.address is not None:
        hotel.address = data.address.strip()
    if data.phone is not None:
        hotel.phone = data.phone.strip()
    if data.email is not None:
        hotel.email = data.email.strip()

    db.commit()
    db.refresh(hotel)

    return {
        "id": str(hotel.id),
        "name": hotel.name,
        "city": hotel.city,
        "address": hotel.address,
        "phone": hotel.phone,
        "email": hotel.email,
    }


@router.delete("/hotels/{hotel_id}", status_code=status.HTTP_200_OK)
def delete_hotel(
    hotel_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN")),
):
    hotel = db.query(Tenant).filter(Tenant.id == hotel_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Établissement introuvable")

    hotel_name = hotel.name

    res_ids = [r.id for r in db.query(Reservation.id).filter(Reservation.tenant_id == hotel_id).all()]
    if res_ids:
        db.query(Payment).filter(Payment.reservation_id.in_(res_ids)).delete(synchronize_session=False)
        db.query(Reservation).filter(Reservation.tenant_id == hotel_id).delete(synchronize_session=False)

    db.query(Room).filter(Room.tenant_id == hotel_id).delete(synchronize_session=False)
    db.query(Customer).filter(Customer.tenant_id == hotel_id).delete(synchronize_session=False)
    db.query(User).filter(User.tenant_id == hotel_id).delete(synchronize_session=False)
    db.delete(hotel)

    db.commit()
    return {"message": f"L'hôtel '{hotel_name}' et toutes ses données associées ont été supprimés avec succès."}


# =========================================================================
# 3. ALL USERS MANAGEMENT
# =========================================================================

@router.get("/users")
def get_all_users(
    hotel_id: Optional[uuid.UUID] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN")),
):
    query = db.query(User).options(joinedload(User.tenant))
    if hotel_id:
        query = query.filter(User.tenant_id == hotel_id)
    if role:
        query = query.filter(User.role == role)

    users_raw = query.order_by(User.created_at.desc()).all()

    return [
        {
            "id": str(u.id),
            "first_name": u.first_name,
            "last_name": u.last_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "tenant_id": str(u.tenant_id) if u.tenant_id else None,
            "hotel_name": u.tenant.name if u.tenant else "Super Admin Plateforme",
            "hotel_city": u.tenant.city if u.tenant else None,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users_raw
    ]


@router.patch("/users/{user_id}/status")
def toggle_user_status(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Impossible de désactiver votre propre compte Super Admin")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "is_active": user.is_active,
        "message": f"Statut mis à jour : {'Actif' if user.is_active else 'Désactivé'}",
    }


# =========================================================================
# 4. ALL PLATFORM RESERVATIONS AUDIT
# =========================================================================

@router.get("/reservations")
def get_all_platform_reservations(
    hotel_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN")),
):
    query = (
        db.query(Reservation)
        .options(
            joinedload(Reservation.tenant),
            joinedload(Reservation.customer),
            joinedload(Reservation.room),
            joinedload(Reservation.user),
        )
    )

    if hotel_id:
        query = query.filter(Reservation.tenant_id == hotel_id)
    if status:
        query = query.filter(Reservation.status == status)

    reservations = query.order_by(Reservation.created_at.desc()).limit(limit).all()

    res_ids = [r.id for r in reservations]
    paid_ids = set()
    if res_ids:
        paid_records = (
            db.query(Payment.reservation_id)
            .filter(Payment.reservation_id.in_(res_ids), Payment.status == "SUCCESS")
            .all()
        )
        paid_ids = {p[0] for p in paid_records}

    results = []
    for r in reservations:
        results.append({
            "id": str(r.id),
            "reservation_code": r.reservation_code,
            "hotel_id": str(r.tenant_id),
            "hotel_name": r.tenant.name if r.tenant else "Établissement inconnu",
            "hotel_city": r.tenant.city if r.tenant else None,
            "room_number": r.room.number if r.room else "-",
            "room_type": r.room.type if r.room else "-",
            "customer_name": f"{r.customer.first_name} {r.customer.last_name}" if r.customer else "Client",
            "customer_phone": r.customer.phone if r.customer else None,
            "receptionist_name": f"{r.user.first_name} {r.user.last_name}" if r.user else "Portail Public (En ligne)",
            "check_in": r.check_in.isoformat() if hasattr(r.check_in, 'isoformat') else str(r.check_in),
            "check_out": r.check_out.isoformat() if hasattr(r.check_out, 'isoformat') else str(r.check_out),
            "number_of_guests": r.number_of_guests,
            "status": r.status,
            "total_price": float(r.total_price),
            "is_paid": r.id in paid_ids,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return results

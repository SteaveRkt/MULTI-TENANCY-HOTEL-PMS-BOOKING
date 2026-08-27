
from datetime import datetime, date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.models.user import User
from app.models.room import Room
from app.models.customer import Customer
from app.models.reservation import Reservation
from app.models.payment import Payment


router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
def get_dashboard_stats(
    start_date: Optional[date] = Query(None, description="Date de début (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="Date de fin (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Statistiques du tableau de bord avec KPI par mois
    """
    tenant_id = current_user.tenant_id

    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date must be before end date"
        )

    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    today = date.today()

    # --- STATUTS DES CHAMBRES BASES SUR LES RESERVATIONS ---
    total_rooms = (
        db.query(Room)
        .filter(Room.tenant_id == tenant_id)
        .count()
    )

    maintenance_rooms = (
        db.query(Room)
        .filter(
            Room.tenant_id == tenant_id,
            Room.status == "MAINTENANCE",
        )
        .count()
    )

    # Chambres actuellement occupées (CHECKED_IN en cours)
    occupied_rooms = (
        db.query(Reservation.room_id)
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.status == "CHECKED_IN",
            Reservation.check_in <= today,
            Reservation.check_out > today,
        )
        .distinct()
        .count()
    )

    # Chambres réservées (CONFIRMED mais pas encore CHECKED_IN)
    reserved_rooms = (
        db.query(Reservation.room_id)
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.status == "CONFIRMED",
            Reservation.check_in > today,
        )
        .distinct()
        .count()
    )

    # Chambres disponibles = total - occupées - réservées - maintenance
    available_rooms = total_rooms - occupied_rooms - reserved_rooms - maintenance_rooms
    if available_rooms < 0:
        available_rooms = 0

    # --- STATISTIQUES CLIENTS ---
    total_customers = (
        db.query(Customer)
        .filter(Customer.tenant_id == tenant_id)
        .count()
    )

    new_customers = (
        db.query(Customer)
        .filter(
            Customer.tenant_id == tenant_id,
            Customer.created_at >= start_datetime,
            Customer.created_at <= end_datetime,
        )
        .count()
    )

    # --- STATISTIQUES RESERVATIONS ---
    total_reservations = (
        db.query(Reservation)
        .filter(Reservation.tenant_id == tenant_id)
        .count()
    )

    # Réservations par statut (total)
    reservations_by_status_total = (
        db.query(
            Reservation.status,
            func.count(Reservation.id).label("count")
        )
        .filter(Reservation.tenant_id == tenant_id)
        .group_by(Reservation.status)
        .all()
    )

    status_total_data = {}
    for item in reservations_by_status_total:
        status_total_data[item.status] = item.count

    # Réservations sur la période
    reservations_in_period = (
        db.query(Reservation)
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.created_at >= start_datetime,
            Reservation.created_at <= end_datetime,
        )
    )

    pending_reservations = (
        reservations_in_period
        .filter(Reservation.status == "PENDING")
        .count()
    )

    confirmed_reservations = (
        reservations_in_period
        .filter(Reservation.status == "CONFIRMED")
        .count()
    )

    cancelled_reservations = (
        reservations_in_period
        .filter(Reservation.status == "CANCELLED")
        .count()
    )

    checked_in_reservations = (
        reservations_in_period
        .filter(Reservation.status == "CHECKED_IN")
        .count()
    )

    checked_out_reservations = (
        reservations_in_period
        .filter(Reservation.status == "CHECKED_OUT")
        .count()
    )

    # --- STATISTIQUES FINANCIERES & KPIS HOTELIERS ---
    active_statuses = ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]

    # 1. Revenu total encaissé (historique complet)
    total_collected_revenue = (
        db.query(
            func.coalesce(
                func.sum(Payment.amount),
                0,
            )
        )
        .join(
            Reservation,
            Payment.reservation_id == Reservation.id,
        )
        .filter(
            Reservation.tenant_id == tenant_id,
            Payment.status == "SUCCESS",
        )
        .scalar()
    )
    total_collected_revenue = float(total_collected_revenue or 0)

    # 2. Revenu encaissé sur la période (Collected Revenue / Trésorerie)
    period_collected_revenue = (
        db.query(
            func.coalesce(
                func.sum(Payment.amount),
                0,
            )
        )
        .join(
            Reservation,
            Payment.reservation_id == Reservation.id,
        )
        .filter(
            Reservation.tenant_id == tenant_id,
            Payment.status == "SUCCESS",
            Payment.created_at >= start_datetime,
            Payment.created_at <= end_datetime,
        )
        .scalar()
    )
    period_collected_revenue = float(period_collected_revenue or 0)

    # 3. Revenu engagé / réservé sur la période (Booked Revenue)
    booked_stats = (
        db.query(
            func.coalesce(func.sum(Reservation.total_price), 0).label("booked_revenue"),
            func.count(Reservation.id).label("booked_count"),
        )
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.status.in_(active_statuses),
            Reservation.created_at >= start_datetime,
            Reservation.created_at <= end_datetime,
        )
        .first()
    )
    period_booked_revenue = float(booked_stats.booked_revenue or 0)
    period_booked_count = int(booked_stats.booked_count or 0)

    # Nuitées vendues sur la période
    confirmed_reservations_list = (
        db.query(Reservation.check_in, Reservation.check_out)
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.status.in_(active_statuses),
            Reservation.created_at >= start_datetime,
            Reservation.created_at <= end_datetime,
        )
        .all()
    )
    total_nights_sold = sum((r.check_out - r.check_in).days for r in confirmed_reservations_list)

    # Reste à encaisser GLOBAL (toutes réservations actives non soldées)
    # Ce montant est un état instantané, indépendant de la période sélectionnée
    all_active_booked = (
        db.query(func.coalesce(func.sum(Reservation.total_price), 0))
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.status.in_(["CONFIRMED", "CHECKED_IN", "PENDING"]),
        )
        .scalar()
    )
    all_active_collected = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .join(Reservation, Payment.reservation_id == Reservation.id)
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.status.in_(["CONFIRMED", "CHECKED_IN", "PENDING"]),
            Payment.status == "SUCCESS",
        )
        .scalar()
    )
    pending_revenue = max(0.0, round(float(all_active_booked or 0) - float(all_active_collected or 0), 2))


    # ADR: Average Daily Rate (Prix moyen par nuitée vendue)
    adr = round(period_booked_revenue / total_nights_sold, 2) if total_nights_sold > 0 else 0.0

    # Période en jours & Capacité totale
    period_days = (end_date - start_date).days + 1
    total_available_room_nights = total_rooms * period_days

    # RevPAR: Revenue Per Available Room (Revenu par chambre disponible)
    revpar = (
        round(period_booked_revenue / total_available_room_nights, 2)
        if total_available_room_nights > 0
        else 0.0
    )

    # ALOS: Average Length of Stay (Durée moyenne de séjour en nuits)
    alos = round(total_nights_sold / period_booked_count, 1) if period_booked_count > 0 else 0.0

    # Average Booking Value (Panier moyen par réservation)
    average_booking_value = (
        round(period_booked_revenue / period_booked_count, 2)
        if period_booked_count > 0
        else 0.0
    )

    # Paiements par méthode sur la période
    payment_methods = (
        db.query(
            Payment.method,
            func.count(Payment.id).label("count"),
            func.sum(Payment.amount).label("total")
        )
        .join(
            Reservation,
            Payment.reservation_id == Reservation.id,
        )
        .filter(
            Reservation.tenant_id == tenant_id,
            Payment.status == "SUCCESS",
            Payment.created_at >= start_datetime,
            Payment.created_at <= end_datetime,
        )
        .group_by(Payment.method)
        .all()
    )

    payment_methods_data = [
        {
            "method": method.method,
            "count": method.count,
            "total": float(method.total or 0),
        }
        for method in payment_methods
    ]

    # Revenu par type de chambre (Revenue by Room Type)
    room_type_revenues = (
        db.query(
            Room.type.label("room_type"),
            func.coalesce(func.sum(Reservation.total_price), 0).label("revenue"),
            func.count(Reservation.id).label("booking_count"),
        )
        .join(Room, Reservation.room_id == Room.id)
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.status.in_(active_statuses),
            Reservation.created_at >= start_datetime,
            Reservation.created_at <= end_datetime,
        )
        .group_by(Room.type)
        .order_by(func.sum(Reservation.total_price).desc())
        .all()
    )

    revenue_by_room_type_data = []
    for item in room_type_revenues:
        rev = float(item.revenue or 0)
        percentage = round((rev / period_booked_revenue) * 100, 1) if period_booked_revenue > 0 else 0.0
        revenue_by_room_type_data.append({
            "room_type": item.room_type,
            "revenue": rev,
            "booking_count": item.booking_count,
            "percentage": percentage,
        })

    # Réservations payées sur la période
    paid_reservations = (
        db.query(Reservation.id)
        .join(
            Payment,
            Payment.reservation_id == Reservation.id,
        )
        .filter(
            Reservation.tenant_id == tenant_id,
            Payment.status == "SUCCESS",
            Payment.created_at >= start_datetime,
            Payment.created_at <= end_datetime,
        )
        .distinct()
        .count()
    )

    # Nombre total de paiements sur la période
    total_payments = (
        db.query(Payment.id)
        .join(
            Reservation,
            Payment.reservation_id == Reservation.id,
        )
        .filter(
            Reservation.tenant_id == tenant_id,
            Payment.status == "SUCCESS",
            Payment.created_at >= start_datetime,
            Payment.created_at <= end_datetime,
        )
        .count()
    )

    average_payment = (
        period_collected_revenue / paid_reservations
        if paid_reservations > 0 else 0.0
    )

    # --- KPI PAR MOIS (6 derniers mois) ---
    monthly_kpi = []
    current_year = today.year
    current_month = today.month

    for i in range(6):
        target_month = current_month - i
        target_year = current_year
        while target_month <= 0:
            target_month += 12
            target_year -= 1

        month_date = date(target_year, target_month, 1)
        month_start = datetime(target_year, target_month, 1, 0, 0, 0)
        
        if target_month == 12:
            next_month = date(target_year + 1, 1, 1)
        else:
            next_month = date(target_year, target_month + 1, 1)
        
        month_end = datetime.combine(
            next_month - timedelta(days=1),
            datetime.max.time()
        )

        # Réservations du mois
        month_reservations = (
            db.query(Reservation)
            .filter(
                Reservation.tenant_id == tenant_id,
                Reservation.created_at >= month_start,
                Reservation.created_at <= month_end,
            )
            .count()
        )

        # Réservations confirmées du mois
        month_confirmed = (
            db.query(Reservation)
            .filter(
                Reservation.tenant_id == tenant_id,
                Reservation.status == "CONFIRMED",
                Reservation.created_at >= month_start,
                Reservation.created_at <= month_end,
            )
            .count()
        )

        # CHECKED_IN du mois
        month_checked_in = (
            db.query(Reservation)
            .filter(
                Reservation.tenant_id == tenant_id,
                Reservation.status == "CHECKED_IN",
                Reservation.created_at >= month_start,
                Reservation.created_at <= month_end,
            )
            .count()
        )

        # Revenu encaissé du mois
        revenue = (
            db.query(
                func.coalesce(
                    func.sum(Payment.amount),
                    0,
                )
            )
            .join(
                Reservation,
                Payment.reservation_id == Reservation.id,
            )
            .filter(
                Reservation.tenant_id == tenant_id,
                Payment.status == "SUCCESS",
                Payment.created_at >= month_start,
                Payment.created_at <= month_end,
            )
            .scalar()
        )

        # Paiements du mois
        payments_count = (
            db.query(Payment.id)
            .join(
                Reservation,
                Payment.reservation_id == Reservation.id,
            )
            .filter(
                Reservation.tenant_id == tenant_id,
                Payment.status == "SUCCESS",
                Payment.created_at >= month_start,
                Payment.created_at <= month_end,
            )
            .count()
        )

        # Nouveaux clients du mois
        new_customers_month = (
            db.query(Customer)
            .filter(
                Customer.tenant_id == tenant_id,
                Customer.created_at >= month_start,
                Customer.created_at <= month_end,
            )
            .count()
        )

        monthly_kpi.append({
            "year": month_date.year,
            "month": month_date.month,
            "month_name": month_date.strftime("%B"),
            "reservations": month_reservations,
            "confirmed": month_confirmed,
            "checked_in": month_checked_in,
            "revenue": float(revenue or 0),
            "payments": payments_count,
            "new_customers": new_customers_month,
        })

    monthly_kpi.reverse()

    # --- TAUX D'OCCUPATION ---
    occupancy_rate = 0.0
    if total_rooms > 0:
        occupancy_rate = round(
            (occupied_rooms / total_rooms) * 100,
            2
        )

    # --- STATISTIQUES JOURNALIERES (Optimisé en requêtes groupées) ---
    daily_res_query = (
        db.query(
            func.date(Reservation.created_at).label("d"),
            func.count(Reservation.id).label("c")
        )
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.created_at >= start_datetime,
            Reservation.created_at <= end_datetime,
        )
        .group_by(func.date(Reservation.created_at))
        .all()
    )
    daily_res_map = {str(row.d): row.c for row in daily_res_query}

    daily_pay_query = (
        db.query(
            func.date(Payment.created_at).label("d"),
            func.coalesce(func.sum(Payment.amount), 0).label("amt")
        )
        .join(Reservation, Payment.reservation_id == Reservation.id)
        .filter(
            Reservation.tenant_id == tenant_id,
            Payment.status == "SUCCESS",
            Payment.created_at >= start_datetime,
            Payment.created_at <= end_datetime,
        )
        .group_by(func.date(Payment.created_at))
        .all()
    )
    daily_pay_map = {str(row.d): float(row.amt or 0) for row in daily_pay_query}

    active_checked_in = (
        db.query(Reservation.check_in, Reservation.check_out)
        .filter(
            Reservation.tenant_id == tenant_id,
            Reservation.status == "CHECKED_IN",
            Reservation.check_in <= end_date,
            Reservation.check_out >= start_date,
        )
        .all()
    )

    daily_stats = []
    current_date = start_date
    while current_date <= end_date:
        d_str = current_date.isoformat()
        day_reservations = daily_res_map.get(d_str, 0)
        day_revenue = daily_pay_map.get(d_str, 0.0)
        day_occupied = sum(
            1 for r in active_checked_in
            if r.check_in <= current_date < r.check_out
        )

        daily_stats.append({
            "date": d_str,
            "reservations": day_reservations,
            "revenue": round(day_revenue, 2),
            "occupied_rooms": day_occupied,
        })
        current_date += timedelta(days=1)

    # --- RESERVATIONS RECENTES (Jointure optimisée en 1 requête) ---
    recent_reservations = (
        db.query(Reservation, Room, Customer, Payment)
        .outerjoin(Room, Reservation.room_id == Room.id)
        .outerjoin(Customer, Reservation.customer_id == Customer.id)
        .outerjoin(Payment, (Payment.reservation_id == Reservation.id) & (Payment.status == "SUCCESS"))
        .filter(Reservation.tenant_id == tenant_id)
        .order_by(Reservation.created_at.desc())
        .limit(5)
        .all()
    )

    recent_reservations_data = []
    for res, rm, cust, pay in recent_reservations:
        recent_reservations_data.append({
            "reservation_id": str(res.id),
            "reservation_code": res.reservation_code,
            "room_number": rm.number if rm else None,
            "customer_name": (
                f"{cust.first_name} {cust.last_name}"
                if cust else None
            ),
            "check_in": res.check_in,
            "check_out": res.check_out,
            "guests": res.number_of_guests,
            "status": res.status,
            "total_price": float(res.total_price),
            "is_paid": pay is not None,
            "payment_status": "PAID" if pay else "UNPAID"
        })

    # --- CHAMBRES LES PLUS RESERVEES ---
    most_reserved_rooms = (
        db.query(
            Room.id,
            Room.number,
            Room.type,
            func.count(Reservation.id).label("reservation_count"),
        )
        .join(
            Reservation,
            Reservation.room_id == Room.id,
        )
        .filter(
            Room.tenant_id == tenant_id,
            Reservation.created_at >= start_datetime,
            Reservation.created_at <= end_datetime,
        )
        .group_by(
            Room.id,
            Room.number,
            Room.type,
        )
        .order_by(
            func.count(Reservation.id).desc()
        )
        .limit(5)
        .all()
    )

    most_reserved_rooms_data = []
    for room in most_reserved_rooms:
        most_reserved_rooms_data.append({
            "room_id": str(room.id),
            "room_number": room.number,
            "room_type": room.type,
            "reservation_count": room.reservation_count,
        })

    return {
        "period": {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days": (end_date - start_date).days + 1
        },
        "rooms": {
            "total": total_rooms,
            "available": available_rooms,
            "reserved": reserved_rooms,
            "occupied": occupied_rooms,
            "maintenance": maintenance_rooms,
        },
        "customers": {
            "total": total_customers,
            "new": new_customers,
        },
        "reservations": {
            "total": total_reservations,
            "period_total": reservations_in_period.count(),
            "by_status": status_total_data,
            "pending": pending_reservations,
            "confirmed": confirmed_reservations,
            "cancelled": cancelled_reservations,
            "checked_in": checked_in_reservations,
            "checked_out": checked_out_reservations,
        },
        "financial": {
            "total_revenue": total_collected_revenue,
            "period_revenue": period_collected_revenue,
            "collected_revenue": period_collected_revenue,
            "booked_revenue": period_booked_revenue,
            "pending_revenue": pending_revenue,
            "adr": adr,
            "revpar": revpar,
            "alos": alos,
            "average_booking_value": average_booking_value,
            "average_payment": round(average_payment, 2),
            "paid_reservations": paid_reservations,
            "total_payments": total_payments,
            "total_nights_sold": total_nights_sold,
            "payment_methods": payment_methods_data,
            "revenue_by_room_type": revenue_by_room_type_data,
        },
        "occupancy": {
            "rate": occupancy_rate,
            "occupied_rooms": occupied_rooms,
            "total_rooms": total_rooms,
        },
        "monthly_kpi": monthly_kpi,
        "daily_stats": daily_stats,
        "recent_reservations": recent_reservations_data,
        "most_reserved_rooms": most_reserved_rooms_data,
    }


@router.get("/monthly-kpi")
def get_monthly_kpi(
    year: Optional[int] = Query(None, description="Année"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "RECEPTIONIST")),
):
    """
    KPI détaillés par mois pour une année donnée
    """
    tenant_id = current_user.tenant_id

    if not year:
        year = date.today().year

    monthly_kpi = []
    
    for month in range(1, 13):
        month_start = datetime(year, month, 1, 0, 0, 0)
        
        if month == 12:
            month_end = datetime(year + 1, 1, 1, 0, 0, 0) - timedelta(seconds=1)
        else:
            month_end = datetime(year, month + 1, 1, 0, 0, 0) - timedelta(seconds=1)

        # Statistiques du mois
        month_data = {
            "year": year,
            "month": month,
            "month_name": date(year, month, 1).strftime("%B"),
        }

        # Réservations
        month_data["total_reservations"] = (
            db.query(Reservation)
            .filter(
                Reservation.tenant_id == tenant_id,
                Reservation.created_at >= month_start,
                Reservation.created_at <= month_end,
            )
            .count()
        )

        # Réservations par statut
        for status in ["PENDING", "CONFIRMED", "CANCELLED", "CHECKED_IN", "CHECKED_OUT"]:
            count = (
                db.query(Reservation)
                .filter(
                    Reservation.tenant_id == tenant_id,
                    Reservation.status == status,
                    Reservation.created_at >= month_start,
                    Reservation.created_at <= month_end,
                )
                .count()
            )
            month_data[f"{status.lower()}_count"] = count

        # Revenu Encaissé du mois (Collected)
        collected_revenue = float(
            db.query(
                func.coalesce(
                    func.sum(Payment.amount),
                    0,
                )
            )
            .join(
                Reservation,
                Payment.reservation_id == Reservation.id,
            )
            .filter(
                Reservation.tenant_id == tenant_id,
                Payment.status == "SUCCESS",
                Payment.created_at >= month_start,
                Payment.created_at <= month_end,
            )
            .scalar() or 0
        )
        month_data["revenue"] = collected_revenue
        month_data["collected_revenue"] = collected_revenue

        # Revenu Engagé du mois (Booked)
        booked_info = (
            db.query(
                func.coalesce(func.sum(Reservation.total_price), 0).label("booked_revenue"),
                func.count(Reservation.id).label("booked_count"),
            )
            .filter(
                Reservation.tenant_id == tenant_id,
                Reservation.status.in_(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]),
                Reservation.created_at >= month_start,
                Reservation.created_at <= month_end,
            )
            .first()
        )
        booked_revenue = float(booked_info.booked_revenue or 0)
        month_data["booked_revenue"] = booked_revenue

        # Nuitées vendues et ADR du mois
        month_stays = (
            db.query(Reservation.check_in, Reservation.check_out)
            .filter(
                Reservation.tenant_id == tenant_id,
                Reservation.status.in_(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]),
                Reservation.created_at >= month_start,
                Reservation.created_at <= month_end,
            )
            .all()
        )
        month_nights = sum((r.check_out - r.check_in).days for r in month_stays)
        month_data["nights_sold"] = month_nights
        month_data["adr"] = round(booked_revenue / month_nights, 2) if month_nights > 0 else 0.0

        # Paiements
        month_data["payments_count"] = (
            db.query(Payment.id)
            .join(
                Reservation,
                Payment.reservation_id == Reservation.id,
            )
            .filter(
                Reservation.tenant_id == tenant_id,
                Payment.status == "SUCCESS",
                Payment.created_at >= month_start,
                Payment.created_at <= month_end,
            )
            .count()
        )

        # Nouveaux clients
        month_data["new_customers"] = (
            db.query(Customer)
            .filter(
                Customer.tenant_id == tenant_id,
                Customer.created_at >= month_start,
                Customer.created_at <= month_end,
            )
            .count()
        )

        monthly_kpi.append(month_data)

    total_collected = sum(m["collected_revenue"] for m in monthly_kpi)
    total_booked = sum(m["booked_revenue"] for m in monthly_kpi)

    return {
        "year": year,
        "months": monthly_kpi,
        "total_revenue": total_collected,
        "total_collected_revenue": total_collected,
        "total_booked_revenue": total_booked,
        "total_reservations": sum(m["total_reservations"] for m in monthly_kpi),
        "total_customers": sum(m["new_customers"] for m in monthly_kpi),
    }


@router.get("/rooms-status")
def get_rooms_status(
    target_date: Optional[date] = Query(None, alias="date", description="Date cible pour l'état du rack (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("ADMIN", "RECEPTIONIST")),
):
    """
    Statut détaillé de chaque chambre basé sur les réservations à une date donnée
    """
    tenant_id = current_user.tenant_id
    if not target_date:
        target_date = date.today()

    rooms = (
        db.query(Room)
        .filter(Room.tenant_id == tenant_id)
        .order_by(Room.floor.asc(), Room.number.asc())
        .all()
    )

    rooms_status = []
    
    for room in rooms:
        # Données de base de la chambre
        base_info = {
            "room_id": str(room.id),
            "room_number": room.number,
            "room_type": room.type,
            "floor": room.floor,
            "capacity": room.capacity,
            "price_per_night": float(room.price_per_night or 0),
            "description": room.description,
        }

        # Si la chambre est en maintenance
        if room.status == "MAINTENANCE":
            rooms_status.append({
                **base_info,
                "status": "MAINTENANCE",
                "current_reservation": None,
                "next_reservation": None
            })
            continue

        # 1. Vérifier si la chambre est occupée ou réservée à la date cible
        active_reservation = (
            db.query(Reservation)
            .filter(
                Reservation.room_id == room.id,
                Reservation.tenant_id == tenant_id,
                Reservation.status.in_(["CHECKED_IN", "CONFIRMED", "PENDING"]),
                Reservation.check_in <= target_date,
                Reservation.check_out > target_date,
            )
            .first()
        )

        if active_reservation:
            # Récupérer les informations du client
            customer_name = None
            customer_phone = None
            if active_reservation.customer_id:
                cust = db.query(Customer).filter(Customer.id == active_reservation.customer_id).first()
                if cust:
                    customer_name = f"{cust.first_name} {cust.last_name}".strip()
                    customer_phone = cust.phone

            res_status = "OCCUPIED" if active_reservation.status == "CHECKED_IN" else "RESERVED"

            rooms_status.append({
                **base_info,
                "status": res_status,
                "current_reservation": {
                    "reservation_id": str(active_reservation.id),
                    "reservation_code": active_reservation.reservation_code,
                    "check_in": active_reservation.check_in.isoformat() if hasattr(active_reservation.check_in, 'isoformat') else str(active_reservation.check_in),
                    "check_out": active_reservation.check_out.isoformat() if hasattr(active_reservation.check_out, 'isoformat') else str(active_reservation.check_out),
                    "status": active_reservation.status,
                    "total_price": float(active_reservation.total_price or 0),
                    "number_of_guests": active_reservation.number_of_guests,
                    "customer_name": customer_name,
                    "customer_phone": customer_phone,
                },
                "next_reservation": None
            })
            continue

        # 2. Vérifier si une réservation future est prévue après la date cible
        next_reservation = (
            db.query(Reservation)
            .filter(
                Reservation.room_id == room.id,
                Reservation.tenant_id == tenant_id,
                Reservation.status.in_(["CONFIRMED", "PENDING", "CHECKED_IN"]),
                Reservation.check_in > target_date,
            )
            .order_by(Reservation.check_in.asc())
            .first()
        )

        next_res_info = None
        if next_reservation:
            next_cust_name = None
            if next_reservation.customer_id:
                cust = db.query(Customer).filter(Customer.id == next_reservation.customer_id).first()
                if cust:
                    next_cust_name = f"{cust.first_name} {cust.last_name}".strip()

            next_res_info = {
                "reservation_id": str(next_reservation.id),
                "reservation_code": next_reservation.reservation_code,
                "check_in": next_reservation.check_in.isoformat() if hasattr(next_reservation.check_in, 'isoformat') else str(next_reservation.check_in),
                "check_out": next_reservation.check_out.isoformat() if hasattr(next_reservation.check_out, 'isoformat') else str(next_reservation.check_out),
                "status": next_reservation.status,
                "customer_name": next_cust_name,
            }

        # 3. Chambre disponible à cette date
        rooms_status.append({
            **base_info,
            "status": "AVAILABLE",
            "current_reservation": None,
            "next_reservation": next_res_info
        })

    return {
        "date": target_date.isoformat(),
        "total_rooms": len(rooms),
        "available": sum(1 for r in rooms_status if r["status"] == "AVAILABLE"),
        "reserved": sum(1 for r in rooms_status if r["status"] == "RESERVED"),
        "occupied": sum(1 for r in rooms_status if r["status"] == "OCCUPIED"),
        "maintenance": sum(1 for r in rooms_status if r["status"] == "MAINTENANCE"),
        "rooms": rooms_status
    }

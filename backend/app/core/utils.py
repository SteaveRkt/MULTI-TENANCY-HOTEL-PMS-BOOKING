import secrets
from sqlalchemy.orm import Session
from app.models.reservation import Reservation

def generate_reservation_code(db: Session) -> str:
    
    while True:
        code = "HTL-" + secrets.token_hex(4).upper()
        existing = db.query(Reservation).filter(
            Reservation.reservation_code == code
        ).first()
        
        if not existing:
            return code

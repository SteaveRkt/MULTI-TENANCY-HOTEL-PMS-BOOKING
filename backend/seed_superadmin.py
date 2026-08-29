import os
import sys
from app.core.database import Base, engine, SessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models import tenant, room, customer, reservation as res_model, payment

def seed_superadmin():
    # 1. Ensure tables exist
    print("Vérification et création des tables de la base de données...")
    Base.metadata.create_all(bind=engine)

    # 2. Seed Super Admin
    email = os.getenv("SUPERADMIN_EMAIL", "superadmin@hotelpms.com")
    password = os.getenv("SUPERADMIN_PASSWORD", "superadmin123")
    first_name = os.getenv("SUPERADMIN_FIRST_NAME", "Super")
    last_name = os.getenv("SUPERADMIN_LAST_NAME", "Admin")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = "SUPER_ADMIN"
            user.tenant_id = None
            user.is_active = True
            user.password_hash = hash_password(password)
            print(f"✅ Compte existant mis à jour en Super Admin : {email}")
        else:
            new_user = User(
                email=email,
                password_hash=hash_password(password),
                first_name=first_name,
                last_name=last_name,
                role="SUPER_ADMIN",
                tenant_id=None,
                is_active=True,
            )
            db.add(new_user)
            print(f"✅ Nouveau compte Super Admin créé avec succès : {email}")
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de la création du Super Admin : {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed_superadmin()

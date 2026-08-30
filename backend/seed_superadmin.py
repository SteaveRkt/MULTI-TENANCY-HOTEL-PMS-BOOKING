import os
import sys
from pathlib import Path

# Assurer que le dossier backend est dans le path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.security import hash_password
from app.core.database import Base
from app.models.user import User
from app.models import tenant, room, customer, reservation as res_model, payment

def get_target_database_url():
    # 1. Argument en ligne de commande (ex: python seed_superadmin.py "postgres://...")
    if len(sys.argv) > 1 and sys.argv[1].strip():
        return sys.argv[1].strip()
    
    # 2. Variable d'environnement DATABASE_URL
    env_url = os.getenv("DATABASE_URL")
    if env_url and env_url.strip():
        return env_url.strip()
    
    # 3. Fichier .env via pydantic settings
    try:
        from app.core.config import settings
        if settings.DATABASE_URL:
            return settings.DATABASE_URL
    except Exception:
        pass
        
    return "sqlite:///./hotel.db"

def seed():
    raw_url = get_target_database_url()
    
    # Normalisation du format PostgreSQL pour psycopg v3
    db_url = raw_url
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
        
    # Masquer le mot de passe pour l'affichage
    display_url = raw_url
    if "@" in display_url:
        prefix, host_part = display_url.split("@", 1)
        proto = prefix.split("://")[0]
        user = prefix.split("://")[1].split(":")[0]
        display_url = f"{proto}://{user}:****@{host_part}"
        
    print(f"\n🔌 Connexion à la base de données : {display_url}")
    
    engine_kwargs = {}
    if "sqlite" in db_url:
        engine_kwargs["connect_args"] = {"check_same_thread": False}
        
    try:
        engine = create_engine(db_url, **engine_kwargs)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Connexion réussie à la base de données !")
    except Exception as e:
        print(f"❌ Impossible de se connecter à la base de données : {e}")
        print("\n💡 Astuce : Passez l'URL Render en argument :")
        print('   python seed_superadmin.py "postgresql://user:pass@dpg-xxx.render.com/db_name"\n')
        sys.exit(1)
        
    # 1. Création des tables
    print("📦 Création / vérification des tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables prêtes.")
    
    # 2. Création ou mise à jour du Super Admin
    email = os.getenv("SUPERADMIN_EMAIL", "superadmin@hotelpms.com")
    password = os.getenv("SUPERADMIN_PASSWORD", "superadmin123")
    first_name = os.getenv("SUPERADMIN_FIRST_NAME", "Super")
    last_name = os.getenv("SUPERADMIN_LAST_NAME", "Admin")
    
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = "SUPER_ADMIN"
            user.tenant_id = None
            user.is_active = True
            user.first_name = first_name
            user.last_name = last_name
            user.password_hash = hash_password(password)
            print(f"👑 Compte existant mis à jour avec le rôle SUPER_ADMIN : {email}")
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
            print(f"👑 Nouveau compte Super Admin créé avec succès : {email}")
            
        db.commit()
        print("\n🎉 SUCCÈS ! Vous pouvez maintenant vous connecter avec :")
        print(f"   📧 Email    : {email}")
        print(f"   🔑 Password : {password}\n")
    except Exception as e:
        db.rollback()
        print(f"❌ Erreur lors de l'enregistrement du Super Admin : {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    seed()

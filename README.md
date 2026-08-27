backend/
├── app/
│   ├── __init__.py
│   ├── main.py
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── tenant.py
│   │   ├── user.py
│   │   ├── room.py
│   │   ├── customer.py
│   │   └── reservation.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── room.py
│   │   ├── customer.py
│   │   └── reservation.py
│   │
│   └── api/
│       ├── __init__.py
│       ├── deps.py
│       └── routes/
│           ├── __init__.py
│           ├── auth.py
│           ├── rooms.py
│           ├── customers.py
│           └── reservations.py
│
├── alembic/
├── .env
├── .env.example
├── .gitignore
├── alembic.ini
└── requirements.txt
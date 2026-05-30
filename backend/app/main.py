from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from .routers import todos, goals, auth, ai_chat
from .auth import SECRET_KEY, ALGORITHM
from . import models
import jwt
import sentry_sdk


sentry_sdk.init(
    dsn="https://abd8b101f761ef1bb90ab503d92051d4@o4511457760772096.ingest.de.sentry.io/4511457800486992",
    # Add request headers and IP for users,
    # see https://docs.sentry.io/platforms/python/data-management/data-collected/ for more info
    send_default_pii=True,
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for tracing.
    traces_sample_rate=1.0,
    # To collect profiles for all profile sessions,
    # set `profile_session_sample_rate` to 1.0.
    profile_session_sample_rate=1.0,
    # Profiles will be automatically collected while
    # there is an active span.
    profile_lifecycle="trace",
)

# Auto-create database tables on startup (if they don't already exist)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ONYX Task & Goal Tracker API",
    description="Backend API for supporting the minimal Todo & Goal Set & Track application.",
    version="1.0.0",
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all standard methods (GET, POST, PATCH, DELETE, etc.)
    allow_headers=["*"],
)


@app.middleware("http")
async def set_sentry_user(request: Request, call_next):
    auth_header = request.headers.get("Authorization")
    user_email = None
    user_id = None

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get("sub")
            user_email = payload.get("email")
        except jwt.PyJWTError:
            pass

    if user_email:
        sentry_sdk.set_user({"email": user_email, "id": user_id})
    else:
        sentry_sdk.set_user(None)

    return await call_next(request)


# Register API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(todos.router, prefix="/api")
app.include_router(goals.router, prefix="/api")
app.include_router(ai_chat.router, prefix="/api")


@app.get("/")
def root():
    return {"status": "online", "service": "ONYX API Server", "docs": "/docs"}


@app.post("/add-user-to-db")
def add_to_db(db: Session = Depends(get_db)):
    import uuid

    random_str = str(uuid.uuid4())[:8]
    test_user = models.User(
        email=f"test_{random_str}@example.com", hashed_password="hashed_password_here"
    )
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    return {
        "message": "Successfully added user to DB!",
        "user": {"id": test_user.id, "email": test_user.email},
    }

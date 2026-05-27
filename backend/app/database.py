import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Load env variables (searches current directory and parent directories)
load_dotenv()

DB_URL = os.getenv("DB_URL")
if not DB_URL:
    raise ValueError("DB_URL environment variable is not set. Please configure it in your backend/.env file.")

# Create the SQLAlchemy engine
# Note: For SQLite, we might need connect_args={"check_same_thread": False}, 
# but for PostgreSQL, standard pool connection args are handled by defaults.
engine = create_engine(DB_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# DB Session Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

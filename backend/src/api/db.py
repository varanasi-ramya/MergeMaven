"""SQLite database initialization and session helpers."""

from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from .models import Base

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "mergeguard.db"


def get_engine(db_path: str | Path | None = None):
    """Create a SQLAlchemy engine for the SQLite database."""
    path = Path(db_path) if db_path else DEFAULT_DB_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    return create_engine(f"sqlite:///{path}", echo=False)


def init_db(engine=None) -> None:
    """Create all tables defined in the models."""
    eng = engine or get_engine()
    Base.metadata.create_all(eng)


def get_session_factory(engine=None):
    """Return a session factory bound to the given engine."""
    eng = engine or get_engine()
    return sessionmaker(bind=eng, autoflush=False, autocommit=False)
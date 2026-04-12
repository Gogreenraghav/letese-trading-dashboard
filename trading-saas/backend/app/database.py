"""
Database connection and utilities
"""
import psycopg2
from psycopg2.extras import RealDictCursor, Json
from contextlib import contextmanager
import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://letese_user:letese_pass@localhost:5432/letese_prod"
)

def get_db_connection():
    """Create a new database connection."""
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

@contextmanager
def get_db():
    """Context manager for database connections."""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

async def init_db():
    """Initialize database with schema."""
    schema_path = os.path.join(os.path.dirname(__file__), "../../schema.sql")
    if os.path.exists(schema_path):
        conn = psycopg2.connect(DATABASE_URL)
        with open(schema_path) as f:
            conn.executescript(f.read())
        conn.commit()
        conn.close()
        print("✅ Database schema initialized")
    else:
        print("⚠️ Schema file not found, using existing tables")

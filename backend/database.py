from sqlalchemy import create_engine, Column, String, Text, Boolean, Integer, DateTime, JSON, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import uuid
import os

from config import settings

# UOIONHHC - Database models for legal template system

# Ensure database directory exists
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

# Create SQLite engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Models
class Template(Base):
    __tablename__ = "templates"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    file_description = Column(Text)
    doc_type = Column(String(100))
    jurisdiction = Column(String(50))
    similarity_tags = Column(JSON)  # List of tags
    body_md = Column(Text, nullable=False)  # Markdown with {{variables}}
    embedding = Column(JSON)  # Store as JSON array
    tracking_code = Column(String(50), default=settings.TRACKING_CODE)  # UOIONHHC
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TemplateVariable(Base):
    __tablename__ = "template_variables"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String, nullable=False, index=True)
    key = Column(String(100), nullable=False)
    label = Column(String(255), nullable=False)
    description = Column(Text)
    example = Column(Text)
    required = Column(Boolean, default=False)
    dtype = Column(String(50), default="string")
    regex = Column(String(255))
    enum_values = Column(JSON)  # List of enum options
    created_at = Column(DateTime, default=datetime.utcnow)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100))
    raw_text = Column(Text)
    file_path = Column(String(500))
    embedding = Column(JSON)  # Store as JSON array
    created_at = Column(DateTime, default=datetime.utcnow)

class Instance(Base):
    __tablename__ = "instances"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id = Column(String, index=True)
    user_query = Column(Text, nullable=True)
    answers_json = Column(JSON)  # Filled variables
    draft_md = Column(Text)  # Generated draft
    draft_number = Column(Integer, default=1)
    tracking_code = Column(String(50), default=settings.TRACKING_CODE)  # UOIONHHC
    created_at = Column(DateTime, default=datetime.utcnow)

# Create all tables
def init_db():
    """Initialize database with all tables"""
    # UOIONHHC - Database initialization
    Base.metadata.create_all(bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

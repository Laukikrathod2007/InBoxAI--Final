from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# SQLite database file
DB_URL = "sqlite:///./inboxiq.db"

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class EmailRecord(Base):
    __tablename__ = "emails"
    id = Column(String, primary_key=True, index=True) # Gmail Message ID
    sender = Column(String)
    subject = Column(String)
    received_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="processed") # processed, error, low_confidence
    
    # Relationship to extractions
    extraction = relationship("ExtractionRecord", back_populates="email", uselist=False)

class ExtractionRecord(Base):
    __tablename__ = "extractions"
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, ForeignKey("emails.id"))
    name = Column(String)
    doc_date = Column(String)
    document_type = Column(String)
    important_fields = Column(JSON)
    confidence = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    email = relationship("EmailRecord", back_populates="extraction")

class SystemLog(Base):
    __tablename__ = "logs"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String) # INFO, ERROR, WARN
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

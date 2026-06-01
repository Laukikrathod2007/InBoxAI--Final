from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, JSON, ForeignKey, Boolean
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
    thread_id = Column(String, index=True)
    sender = Column(String)
    subject = Column(String)
    summary = Column(Text)
    category = Column(String) 
    priority = Column(String) 
    importance_score = Column(Integer) 
    confidence_score = Column(Integer) 
    needs_reply = Column(Boolean, default=False)
    suggested_reply = Column(Text) 
    is_done = Column(Boolean, default=False) 
    reasoning = Column(Text) 
    actions_required = Column(JSON) # RESTORED
    deadlines = Column(JSON) # NEW
    people = Column(JSON) # NEW
    organizations = Column(JSON) # NEW
    content = Column(Text) 
    cleaned_content = Column(Text) # NEW
    latency = Column(Integer) # NEW (ms)
    received_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="processed") 
    primary_action = Column(String) # NEW: UI Contract
    secondary_actions = Column(JSON) # NEW: UI Contract

class DecisionLog(Base): # UPGRADED
    __tablename__ = "decision_logs"
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, index=True)
    raw_email = Column(Text)
    cleaned_email = Column(Text)
    category = Column(String)
    confidence = Column(Integer)
    decision = Column(String)
    reply_needed = Column(Boolean)
    latency = Column(Integer) # ms
    model_version = Column(String) # NEW
    prompt_version = Column(String) # NEW
    timestamp = Column(DateTime, default=datetime.utcnow)

class ThreadRecord(Base):
    __tablename__ = "threads"
    id = Column(String, primary_key=True, index=True) # Gmail Thread ID
    summary = Column(Text)
    participants = Column(JSON) 
    last_updated = Column(DateTime, default=datetime.utcnow)

class ActionItem(Base):
    __tablename__ = "action_items"
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, ForeignKey("emails.id"))
    thread_id = Column(String)
    type = Column(String) # invoice, meeting, reply, task, complaint
    title = Column(String)
    description = Column(Text)
    due_date = Column(DateTime, nullable=True)
    priority = Column(String)
    status = Column(String, default="open") # open, in_progress, done, muted
    confidence = Column(Integer)
    automation_proposed = Column(Boolean, default=False)
    suggested_draft = Column(Text, nullable=True) # AI proposed response or tool output
    created_at = Column(DateTime, default=datetime.utcnow)

class ProcessedEmail(Base):
    __tablename__ = "processed_emails"
    email_id = Column(String, primary_key=True)

class UserFeedback(Base):
    __tablename__ = "user_feedback"
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, ForeignKey("emails.id"))
    field = Column(String) # category, priority, etc.
    original_value = Column(String)
    new_value = Column(String)
    is_noise_override = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class SystemLog(Base):
    """Table for system logging and monitoring"""
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String)  # INFO, WARNING, ERROR
    message = Column(String)
    component = Column(String)  # brain, extractor, gmail_reader, etc.
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class DocumentExtraction(Base):
    """Table for storing intelligent document extraction results"""
    __tablename__ = "document_extractions"
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, ForeignKey("emails.id"), index=True)
    document_type = Column(String)  # invoice, resume, form, receipt, contract
    extracted_data = Column(JSON)  # Structured extraction results
    confidence = Column(Integer)  # 0-100
    raw_text_length = Column(Integer)
    filename = Column(String)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EmailAttachment(Base):
    """Table for storing email attachment metadata"""
    __tablename__ = "email_attachments"
    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(String, ForeignKey("emails.id"), index=True)
    filename = Column(String)
    size = Column(Integer)
    mime_type = Column(String)
    attachment_id = Column(String)  # Gmail attachment ID
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Migration: Add columns if they don't exist
    from sqlalchemy import text
    with engine.connect() as conn:
        cols = [
            ("reasoning", "TEXT"),
            ("suggested_reply", "TEXT"),
            ("is_done", "BOOLEAN DEFAULT 0"),
            ("confidence_score", "INTEGER"),
            ("cleaned_content", "TEXT"),
            ("latency", "INTEGER")
        ]
        for col_name, col_type in cols:
            try:
                conn.execute(text(f"ALTER TABLE emails ADD COLUMN {col_name} {col_type}"))
                conn.commit()
                print(f"✅ Database migration: Added '{col_name}' column.")
            except Exception:
                pass 

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

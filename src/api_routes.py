from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .database import get_db, EmailRecord, ExtractionRecord, SystemLog
from .models import ExtractedData
import logging

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

@router.get("/history")
def get_history(db: Session = Depends(get_db)):
    """ Fetch all processed emails with their extractions """
    results = db.query(EmailRecord).order_by(EmailRecord.received_at.desc()).all()
    history = []
    for rec in results:
        ext = rec.extraction
        history.append({
            "id": rec.id,
            "sender": rec.sender,
            "subject": rec.subject,
            "received_at": rec.received_at,
            "status": rec.status,
            "extraction": {
                "name": ext.name if ext else "N/A",
                "document_type": ext.document_type if ext else "N/A",
                "date": ext.doc_date if ext else "N/A",
                "fields": ext.important_fields if ext else {}
            } if ext else None
        })
    return history

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """ Fetch high-level stats for the dashboard """
    total_emails = db.query(EmailRecord).count()
    invoices = db.query(ExtractionRecord).filter(ExtractionRecord.document_type == "invoice").count()
    resumes = db.query(ExtractionRecord).filter(ExtractionRecord.document_type == "resume").count()
    errors = db.query(SystemLog).filter(SystemLog.level == "ERROR").count()
    
    return {
        "total_processed": total_emails,
        "invoices_count": invoices,
        "resumes_count": resumes,
        "system_errors": errors
    }

@router.get("/logs")
def get_logs(limit: int = 50, db: Session = Depends(get_db)):
    """ Fetch recent system logs """
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit).all()
    return logs

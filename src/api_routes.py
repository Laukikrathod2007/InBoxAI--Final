from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from .database import get_db, EmailRecord, ThreadRecord, SystemLog, UserFeedback
from .chat_engine import chat_engine
from .llm_client import llm_client
import logging
from .config import settings

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

from .email_reader import gmail_reader

def serialize_db_object(obj):
    if obj is None:
        return None
    data = {}
    for column in obj.__table__.columns:
        data[column.name] = getattr(obj, column.name)
    return jsonable_encoder(data)


def serialize_db_list(rows):
    return [serialize_db_object(row) for row in rows]

class ChatRequest(BaseModel):
    message: str

class ComposeRequest(BaseModel):
    intent: str
    thread_id: Optional[str] = None
    tone: Optional[str] = "Professional" # Professional, Casual, Direct

class SendRequest(BaseModel):
    recipient: str
    subject: str
    body: str
    thread_id: Optional[str] = None

class OverrideRequest(BaseModel):
    email_id: str
    priority: Optional[str] = None
    is_noise: Optional[bool] = None
    is_done: Optional[bool] = None

class BulkActionRequest(BaseModel):
    category: str = "all"
    action: str

CATEGORY_PATTERNS = {
    "Naukri": ["naukri", "recruiter", "jobs"],
    "LinkedIn": ["linkedin"],
    "Quora": ["quora"],
    "Marketing": ["newsletter", "promo", "marketing", "sales"]
}

def _build_category_query(db: Session, category: str):
    from sqlalchemy import or_

    if category.lower() == "all":
        filters = []
        for patterns in CATEGORY_PATTERNS.values():
            filters.extend([EmailRecord.sender.ilike(f"%{p}%") for p in patterns])
    else:
        patterns = CATEGORY_PATTERNS.get(category)
        if not patterns:
            return None
        filters = [EmailRecord.sender.ilike(f"%{p}%") for p in patterns]

    query = db.query(EmailRecord)
    if filters:
        query = query.filter(or_(*filters))
    return query

@router.post("/compose-draft")
def post_compose(req: ComposeRequest, db: Session = Depends(get_db)):
    """ Generate a professional draft using the Ghostwriter engine """
    from .ghostwriter import ghostwriter
    
    history = ""
    if req.thread_id:
        thread = db.query(ThreadRecord).filter(ThreadRecord.id == req.thread_id).first()
        if thread:
            history = thread.summary
            
    try:
        draft = ghostwriter.draft_manual(intent=req.intent, thread_context=history, tone=req.tone)
        return draft
    except Exception as e:
        logger.error(f"Drafting logic failed: {str(e)}")
        raise HTTPException(status_code=500, detail="AI drafting unavailable locally.")

@router.post("/send")
def post_send(req: SendRequest):
    """ Send the finalized email via Gmail API """
    msg_id = gmail_reader.send_email(req.recipient, req.subject, req.body, req.thread_id)
    if msg_id:
        return {"status": "success", "message_id": msg_id}
    raise HTTPException(status_code=500, detail="Failed to send email via Gmail.")

@router.get("/history")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    """Fetch processed emails (most recent first)."""
    limit = max(1, min(int(limit), 500))
    results = db.query(EmailRecord).order_by(EmailRecord.received_at.desc()).limit(limit).all()
    return serialize_db_list(results)

@router.get("/search")
def search_emails(q: str = "", db: Session = Depends(get_db)):
    """ Full-text search across subject, sender, and summary """
    if not q.strip():
        results = db.query(EmailRecord).order_by(EmailRecord.received_at.desc()).all()
        return serialize_db_list(results)
    term = f"%{q.lower()}%"
    results = db.query(EmailRecord).filter(
        (EmailRecord.subject.ilike(term)) |
        (EmailRecord.sender.ilike(term)) |
        (EmailRecord.summary.ilike(term)) |
        (EmailRecord.content.ilike(term))
    ).order_by(EmailRecord.received_at.desc()).all()
    return serialize_db_list(results)

@router.post("/overrides")
def post_override(req: OverrideRequest, db: Session = Depends(get_db)):
    """ Record manual user feedback for priority/noise/done status """
    feedback = UserFeedback(
        email_id=req.email_id,
        override_priority=req.priority,
        override_noise=req.is_noise,
        override_done=req.is_done
    )
    db.add(feedback)
    
    # Update the record directly for immediate UI feedback
    email = db.query(EmailRecord).filter(EmailRecord.id == req.email_id).first()
    if email:
        if req.priority: email.priority = req.priority
        if req.is_noise is not None: 
            email.status = "noise" if req.is_noise else "processed"
            email.is_done = req.is_noise # Noise is effectively 'done' with for the inbox
        if req.is_done is not None:
            email.is_done = req.is_done
            if req.is_done: email.status = "archived" # Visual distinction
    
    db.commit()
    return {"status": "success"}

@router.post("/bulk-action")
def post_bulk_action(req: BulkActionRequest, db: Session = Depends(get_db)):
    """Apply a bulk archive/mute action to matching categories."""
    query = _build_category_query(db, req.category)
    if query is None:
        raise HTTPException(status_code=400, detail="Invalid category for bulk action")

    emails = query.all()
    if not emails:
        return {"updated": 0}

    if req.action == "archive":
        for email in emails:
            email.status = "archived"
            email.is_done = True
    elif req.action in ["mute", "noise"]:
        for email in emails:
            email.status = "noise"
            email.is_done = True
    else:
        raise HTTPException(status_code=400, detail="Invalid bulk action")

    db.commit()
    return {"updated": len(emails)}

from .database import get_db, EmailRecord, ThreadRecord, SystemLog, UserFeedback, ActionItem

@router.get("/action-items")
def get_actions(status: str = "open", db: Session = Depends(get_db)):
    """ Fetch work items for the Action Board """
    items = db.query(ActionItem).filter(ActionItem.status == status).order_by(ActionItem.created_at.desc()).all()
    return serialize_db_list(items)

@router.post("/action-items/{item_id}/status")
def update_action_status(item_id: int, status: str, db: Session = Depends(get_db)):
    """ Update status of a work item """
    item = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")
    item.status = status
    db.commit()
    return {"status": "success"}

@router.post("/chat")
def post_chat(req: ChatRequest, db: Session = Depends(get_db)):
    """ Ask questions to your inbox brain (Retrieval from ActionItems and Threads) """
    # Fetch recent context for RAG
    recent_actions = db.query(ActionItem).filter(ActionItem.status == 'open').limit(10).all()
    context = "\n".join([f"- {a.type.upper()}: {a.title}" for a in recent_actions])
    
    prompt = f"""
    You are the InBoxIQ AI Brain. Answer the user based on their current Action Board.
    
    CURRENT ACTION BOARD:
    {context}
    
    USER QUESTION:
    {req.message}
    """
    response = llm_client.generate(prompt, system="You are an omniscient inbox assistant.")
    if not response:
        response = "The inbox AI is currently unavailable. Please check your LLM credentials and try again."
    return {"response": response}

@router.get("/daily-briefing")
def get_daily_briefing(db: Session = Depends(get_db)):
    """ Generate an AI summary based on the Action Board """
    open_items = db.query(ActionItem).filter(ActionItem.status == 'open').all()
    if not open_items:
        return {"briefing": "Peaceful day. No urgent actions pending."}
        
    summary = "\n".join([f"[{i.type}] {i.title} (Priority: {i.priority})" for i in open_items])
    prompt = f"Provide a concise executive briefing of these pending work items:\n{summary}"
    
    briefing = llm_client.generate(prompt, system="You are an AI Chief of Staff. Be brief, direct, and actionable.")
    if not briefing:
        briefing = "The briefing cannot be generated right now. Please verify your AI configuration and retry."
    return {"briefing": briefing}

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """ Fetch high-level stats for the dashboard """
    total_emails = db.query(EmailRecord).count()
    noise_count = db.query(EmailRecord).filter(EmailRecord.status == "noise").count()
    needs_reply = db.query(EmailRecord).filter(EmailRecord.needs_reply == True).count()
    errors = db.query(SystemLog).filter(SystemLog.level == "ERROR").count()
    
    return {
        "total_processed": total_emails,
        "noise_count": noise_count,
        "needs_reply": needs_reply,
        "system_errors": errors
    }

@router.get("/logs")
def get_logs(limit: int = 50, db: Session = Depends(get_db)):
    """ Fetch recent system logs """
    logs = db.query(SystemLog).order_by(SystemLog.timestamp.desc()).limit(limit).all()
    return serialize_db_list(logs)

@router.get("/user-profile")
def get_user_profile():
    """ Fetch user profile info from Gmail """
    try:
        service = gmail_reader.service
        profile = service.users().getProfile(userId='me').execute()
        
        return {
            "email": profile.get('emailAddress', 'user@gmail.com'),
            "name": profile.get('emailAddress', 'User').split('@')[0].title(),
            "avatar": f"https://ui-avatars.com/api/?name={profile.get('emailAddress', 'User')}&background=5f5e5e&color=fff",
            "total_messages": profile.get('messagesTotal', 0),
            "labels": profile.get('threadsTotal', 0)
        }
    except Exception as e:
        logger.error(f"Failed to get user profile: {str(e)}")
        return {
            "email": "user@gmail.com",
            "name": "User",
            "avatar": "https://ui-avatars.com/api/?name=User&background=5f5e5e&color=fff",
            "total_messages": 0,
            "labels": 0
        }

@router.get("/emails-by-category")
def get_emails_by_category(db: Session = Depends(get_db)):
    """ Get emails grouped by category/sender for the Noise Control view """
    try:
        # Define category patterns - match senders to categories
        categories = {
            "Naukri": {"senders": ["naukri", "recruiter", "jobs"], "icon": "work", "color": "primary"},
            "LinkedIn": {"senders": ["linkedin"], "icon": "group", "color": "secondary"},
            "Quora": {"senders": ["quora"], "icon": "quiz", "color": "on-surface-variant"},
            "Marketing": {"senders": ["newsletter", "promo", "marketing", "sales"], "icon": "campaign", "color": "primary"},
        }
        
        result = {}
        
        for category, config in categories.items():
            query = db.query(EmailRecord)
            
            # Build OR filter for senders
            filters = []
            for sender_pattern in config["senders"]:
                filters.append(EmailRecord.sender.ilike(f"%{sender_pattern}%"))
            
            if filters:
                from sqlalchemy import or_
                query = query.filter(or_(*filters))
            
            emails = query.order_by(EmailRecord.received_at.desc()).limit(100).all()
            
            # Group by sender
            sender_groups = {}
            for email in emails:
                sender = email.sender or "Unknown"
                if sender not in sender_groups:
                    sender_groups[sender] = []
                sender_groups[sender].append(email)
            
            # Create summary
            result[category] = {
                "count": len(emails),
                "icon": config["icon"],
                "color": config["color"],
                "summary": f"{len(emails)} emails from {len(sender_groups)} senders",
                "senders": list(sender_groups.keys())[:5],  # Top 5 senders
                "latest": [{"id": e.id, "sender": e.sender, "subject": e.subject, "time": e.received_at} for e in emails[:3]]
            }
        
        return result
    except Exception as e:
        logger.error(f"Failed to get emails by category: {str(e)}")
        return {}

@router.get("/threads")
def get_threads(db: Session = Depends(get_db)):
    """ Fetch inbox threads and thread summaries """
    threads = db.query(ThreadRecord).order_by(ThreadRecord.last_updated.desc()).all()
    return serialize_db_list(threads)

@router.get("/document-extractions")
def get_document_extractions(email_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Get document extraction results, optionally filtered by email_id"""
    from .database import DocumentExtraction

    query = db.query(DocumentExtraction)
    if email_id:
        query = query.filter(DocumentExtraction.email_id == email_id)

    extractions = query.order_by(DocumentExtraction.created_at.desc()).all()
    results = []
    for extraction in extractions:
        row = serialize_db_object(extraction)
        email = db.query(EmailRecord).filter(EmailRecord.id == extraction.email_id).first()
        if email:
            row["email_sender"] = email.sender
            row["email_subject"] = email.subject
            row["email_category"] = email.category
        results.append(row)
    return results

@router.get("/extraction-stats")
def get_extraction_stats(db: Session = Depends(get_db)):
    """Get statistics about document extraction performance"""
    from .database import DocumentExtraction

    try:
        # Total extractions
        total = db.query(DocumentExtraction).count()

        # By document type
        type_stats = db.query(
            DocumentExtraction.document_type,
            func.count(DocumentExtraction.id).label('count'),
            func.avg(DocumentExtraction.confidence).label('avg_confidence')
        ).group_by(DocumentExtraction.document_type).all()

        # Confidence distribution
        confidence_ranges = {
            "high": db.query(DocumentExtraction).filter(DocumentExtraction.confidence >= 80).count(),
            "medium": db.query(DocumentExtraction).filter(DocumentExtraction.confidence.between(60, 79)).count(),
            "low": db.query(DocumentExtraction).filter(DocumentExtraction.confidence < 60).count()
        }

        return {
            "total_extractions": total,
            "by_type": [
                {
                    "type": stat.document_type,
                    "count": stat.count,
                    "avg_confidence": round(float(stat.avg_confidence or 0), 1)
                }
                for stat in type_stats
            ],
            "confidence_distribution": confidence_ranges,
            "success_rate": round((confidence_ranges["high"] + confidence_ranges["medium"]) / max(total, 1) * 100, 1)
        }
    except Exception as e:
        logger.error(f"Failed to get extraction stats: {str(e)}")
        return {"error": str(e)}

@router.get("/review-queue")
def get_review_queue(db: Session = Depends(get_db)):
    """Get emails that need human review based on confidence scores"""
    from .database import ActionItem

    try:
        # Get action items that need review (low confidence)
        review_items = db.query(ActionItem).filter(
            ActionItem.status == "open",
            ActionItem.confidence < settings.CONFIDENCE_THRESHOLD  # Below configured threshold needs review
        ).order_by(ActionItem.created_at.desc()).all()

        return serialize_db_list(review_items)
    except Exception as e:
        logger.error(f"Failed to get review queue: {str(e)}")
        return []

class SettingsUpdate(BaseModel):
    confidence_threshold: int

@router.get("/settings")
def get_settings():
    """Fetch current dynamic settings"""
    return {
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD,
        "autopilot_mode": settings.AUTOPILOT_MODE,
        "autopilot_active": settings.AUTOPILOT_ENABLED
    }

@router.post("/settings")
def update_settings(req: SettingsUpdate):
    """Update current dynamic settings"""
    if not (50 <= req.confidence_threshold <= 95):
        raise HTTPException(status_code=400, detail="Threshold must be between 50 and 95")
    settings.CONFIDENCE_THRESHOLD = req.confidence_threshold
    logger.info(f"Updated CONFIDENCE_THRESHOLD to {req.confidence_threshold}")
    return {
        "status": "success",
        "confidence_threshold": settings.CONFIDENCE_THRESHOLD
    }

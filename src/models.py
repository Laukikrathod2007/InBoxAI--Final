from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class EmailAnalysis(BaseModel):
    summary: str
    category: str  # MEETING_REQUEST, TASK_ASSIGNED, etc.
    confidence: float
    priority: str
    score: int
    decision: str
    reasoning: str
    actions_required: List[str]
    deadlines: List[str]
    people: List[str]
    organizations: List[str]
    reply_needed: bool
    draft_reply: Optional[str] = None

class DocumentExtraction(BaseModel):
    """Model for intelligent document extraction results"""
    document_type: str  # invoice, resume, form, receipt, contract
    extracted_data: Dict[str, Any]
    confidence: float
    raw_text_length: int
    extraction_timestamp: str
    filename: str
    error: Optional[str] = None

class AttachmentInfo(BaseModel):
    """Model for email attachment metadata"""
    filename: str
    size: int
    mime_type: str
    attachment_id: str

class WorkflowState(BaseModel):
    email_id: str
    thread_id: str
    sender: str
    subject: str
    raw_content: str
    cleaned_content: Optional[str] = None
    thread_history: str
    analysis: Optional[EmailAnalysis] = None
    attachments: List[AttachmentInfo] = []
    document_extractions: List[DocumentExtraction] = []
    confidence_score: float = 0.0
    needs_human_review: bool = False
    confidence_level: str = "unknown"
    is_noise: bool = False
    latency: float = 0.0
    finished: bool = False

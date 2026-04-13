from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class ExtractedData(BaseModel):
    name: Optional[str] = "Unknown"
    date: Optional[str] = "Unknown"
    document_type: Optional[str] = "Other"
    important_fields: Dict[str, Any] = {}
    confidence_score: Optional[float] = 1.0

class EmailMetadata(BaseModel):
    id: str
    sender: str
    subject: str
    date: str
    snippet: str

class WorkflowState(BaseModel):
    email_id: str
    sender: str
    subject: str
    pdf_text: Optional[str] = None
    extracted_data: Optional[ExtractedData] = None
    sheet_row_index: Optional[int] = None
    draft_reply_id: Optional[str] = None
    error: Optional[str] = None

import logging
import time
import json
from typing import List, Optional, Dict, Any, TypedDict
from langgraph.graph import StateGraph, END
from .email_reader import gmail_reader
from .database import (
    SessionLocal,
    EmailRecord,
    ActionItem,
    DecisionLog,
    DocumentExtraction,
    EmailAttachment,
)
from .autopilot import get_autopilot_config, should_auto_archive, label_for_category
from .llm_client import llm_client
from .config import settings
from .models import EmailAnalysis
from .extractor import document_extractor

logger = logging.getLogger("InBoxIQ.Brain")

# --- PROMPT VERSIONING ---
PROMPT_VERSION = "2.0-collapsed"
MODEL_VERSION = settings.MODEL_NAME

class AgentState(TypedDict):
    email_id: str
    thread_id: str
    sender: str
    subject: str
    raw_content: str
    cleaned_content: str
    thread_history: str
    analysis: Optional[Dict[str, Any]]
    category: str
    decision: str
    priority: str
    score: int
    is_noise: bool
    latency_start: float
    finished: bool
    draft_reply: Optional[str]
    attachments: List[Dict[str, Any]]  # New: attachment info
    document_extractions: List[Dict[str, Any]]  # New: extracted document data
    confidence_score: float  # New: overall confidence

# --- CORE UTILITIES ---

def clean_email(text: str) -> str:
    """ UPGRADED: Remove signatures and quoted replies """
    if not text: return ""
    # Remove quoted replies
    text = text.split("On ", 1)[0]
    text = text.split("---------- Forwarded message", 1)[0]
    # Remove common signatures
    for sig in ["Best regards", "Kind regards", "Sincerely", "Thanks,", "Sent from my"]:
        text = text.split(sig, 1)[0]
    return text.strip()

def quick_rule_filter(sender: str, subject: str, text: str, attachments: list, thread_history: str) -> Optional[dict]:
    """
    Deterministic pre-bucketing of emails before LLM logic to optimize cost and speed.
    """
    sender_lower = sender.lower()
    subject_lower = subject.lower()
    text_lower = text.lower()
    
    # 1. Marketing / Noise
    if "unsubscribe" in text_lower or "list-unsubscribe" in text_lower or \
       any(word in sender_lower for word in ["newsletter", "promo", "marketing", "deals", "offers", "subscription"]) or \
       any(word in subject_lower for word in ["discount", "sale", "limited offer", "off your next"]):
        return {
            "bucket": "MARKETING_NOISE",
            "is_noise": True,
            "category": "PROMOTION",
            "decision": "ARCHIVE",
            "priority": "low",
            "score": 10,
            "analysis": {
                "summary": "Marketing newsletter / promotion filtered deterministically",
                "category": "PROMOTION",
                "confidence": 100,
                "importance_score": 10,
                "reasoning": "Deterministic rule matched promotional sender or unsubscribe link.",
                "requires_action": False,
                "action_type": "NONE",
                "deadline": None,
                "actions_required": [],
                "deadlines": [],
                "people": [],
                "organizations": [],
                "reply_needed": False
            }
        }
        
    # 2. Automated Notifications
    if "no-reply" in sender_lower or "donotreply" in sender_lower or "notification" in sender_lower or \
       "alert" in sender_lower or "jira" in sender_lower or "github" in sender_lower or \
       any(word in subject_lower for word in ["notification", "alert", "daily update", "status report"]):
        return {
            "bucket": "AUTOMATED_NOTIFICATIONS",
            "is_noise": True,
            "category": "NEWSLETTER",
            "decision": "FYI_KNOWLEDGE",
            "priority": "low",
            "score": 30,
            "analysis": {
                "summary": "Automated system notification logged",
                "category": "NEWSLETTER",
                "confidence": 100,
                "importance_score": 30,
                "reasoning": "Deterministic rule matched automated system sender pattern.",
                "requires_action": False,
                "action_type": "NONE",
                "deadline": None,
                "actions_required": [],
                "deadlines": [],
                "people": [],
                "organizations": [],
                "reply_needed": False
            }
        }
        
    return None

# --- PROMPTS ---

CATEGORIES = [
    "MEETING_REQUEST", "WORK_ASSIGNMENT", "CLIENT_DELIVERABLE",
    "FINANCE_TRANSACTION", "APPROVAL_REQUEST", "INFORMATION_UPDATE",
    "NEWSLETTER", "PROMOTION", "PERSONAL", "SPAM", "UNCERTAIN"
]

CLASSIFICATION_PROMPT = """
You are the InBoxIQ Extraction Engine. Analyze the email and extract structured workflow data.

OUTPUT FORMAT (STRICT JSON):
{{
  "summary": "one sentence headline",
  "category": "MEETING_REQUEST | WORK_ASSIGNMENT | CLIENT_DELIVERABLE | FINANCE_TRANSACTION | APPROVAL_REQUEST | INFORMATION_UPDATE | PERSONAL | UNCERTAIN",
  "confidence": 0-100,
  "importance_score": 0-100,
  "reasoning": "why this category?",
  "requires_action": true|false,
  "action_type": "DRAFT_REPLY | EXTRACTION_APPROVAL | CALENDAR_BOOKING | ACKNOWLEDGEMENT | NONE",
  "deadline": "YYYY-MM-DD HH:MM | null",
  "actions_required": ["specific action items"],
  "deadlines": ["associated deadlines"],
  "people": ["extracted names"],
  "organizations": ["extracted companies"],
  "reply_needed": true|false
}}
"""

class LangGraphBrain:
    def __init__(self):
        self.workflow = self._build_graph()

    def _build_graph(self):
        builder = StateGraph(AgentState)
        
        builder.add_node("ingest", self._ingest_node)
        builder.add_node("rule_filter", self._rule_filter_node)
        builder.add_node("process_attachments", self._process_attachments_node)  # New node
        builder.add_node("classify_extract", self._classify_extract_node)
        builder.add_node("decision_engine", self._decision_engine_node)
        builder.add_node("generate_reply", self._generate_reply_node)
        builder.add_node("store", self._store_node)
        
        builder.set_entry_point("ingest")
        
        builder.add_edge("ingest", "rule_filter")
        builder.add_conditional_edges(
            "rule_filter",
            self._should_skip,
            {
                "skip": "store",
                "continue": "process_attachments"  # Route to new node
            }
        )
        builder.add_edge("process_attachments", "classify_extract")
        builder.add_edge("classify_extract", "decision_engine")
        builder.add_edge("decision_engine", "generate_reply")
        builder.add_edge("generate_reply", "store")
        builder.add_edge("store", END)
        
        return builder.compile()

    def _ingest_node(self, state: AgentState):
        logger.info(f"Stage 1: Ingesting email {state['email_id']}")
        details = gmail_reader.get_email_details(state['email_id'])
        thread_data = gmail_reader.get_thread(state['thread_id'])
        
        raw_body = details.get('body', '')
        cleaned_body = clean_email(raw_body)
        
        history = ""
        for msg in thread_data.get('messages', [])[-3:]:
            snippet = msg.get('snippet', "")
            history += f"Snippet: {snippet}\n"
            
        return {
            "sender": details.get('sender', 'Unknown'),
            "subject": details.get('subject', 'No Subject'),
            "raw_content": raw_body,
            "cleaned_content": cleaned_body,
            "thread_history": history,
            "latency_start": time.time(),
            "attachments": details.get('attachments', []),
            "document_extractions": []
        }

    def _rule_filter_node(self, state: AgentState):
        logger.info("Stage 2: Rule-based filter")
        bucket_data = quick_rule_filter(
            state.get('sender', ''),
            state.get('subject', ''),
            state.get('cleaned_content', ''),
            state.get('attachments', []),
            state.get('thread_history', '')
        )
        if bucket_data:
            return {
                "is_noise": bucket_data["is_noise"], 
                "category": bucket_data["category"],
                "decision": bucket_data["decision"],
                "priority": bucket_data["priority"],
                "score": bucket_data["score"],
                "analysis": bucket_data["analysis"]
            }
        return {"is_noise": False}

    def _should_skip(self, state: AgentState):
        return "skip" if state.get('is_noise') else "continue"

    def _process_attachments_node(self, state: AgentState):
        """
        Stage 2.5: Process PDF attachments with intelligent extraction
        """
        logger.info("Stage 2.5: Processing attachments")

        # Get email details including attachments
        details = gmail_reader.get_email_details(state['email_id'])
        attachments = details.get('attachments', [])

        document_extractions = []
        total_confidence = 0
        attachment_count = 0

        for attachment in attachments:
            if attachment.get('filename', '').lower().endswith('.pdf'):
                try:
                    logger.info(f"Processing PDF: {attachment['filename']}")

                    # Download attachment
                    attachment_id = attachment.get('attachmentId') or attachment.get('attachment_id')
                    if not attachment_id:
                        raise KeyError("No valid attachment ID key found in attachment metadata.")

                    attachment_data = gmail_reader.download_attachment(
                        state['email_id'],
                        attachment_id
                    )

                    if attachment_data:
                        # Extract document intelligence
                        extraction = document_extractor.extract_from_pdf(
                            attachment_data,
                            attachment['filename']
                        )

                        document_extractions.append(extraction)
                        total_confidence += extraction.get('confidence', 0)
                        attachment_count += 1

                        logger.info(f"Extracted {extraction.get('document_type')} with {extraction.get('confidence', 0):.2f} confidence")

                except Exception as e:
                    logger.error(f"Failed to process attachment {attachment.get('filename')}: {str(e)}")

        # Calculate overall confidence
        overall_confidence = total_confidence / max(attachment_count, 1)

        return {
            "attachments": attachments,
            "document_extractions": document_extractions,
            "confidence_score": overall_confidence
        }

    def _classify_extract_node(self, state: AgentState):
        logger.info("Stage 3: LLM Classification + Extraction")
        
        # Include document extraction context
        doc_context = ""
        if state.get('document_extractions'):
            doc_context = "\n\nDOCUMENT EXTRACTIONS:\n"
            for i, extraction in enumerate(state['document_extractions']):
                doc_context += f"Document {i+1}: {extraction.get('document_type', 'unknown')} "
                doc_context += f"(confidence: {extraction.get('confidence', 0):.2f})\n"
                if extraction.get('extracted_data'):
                    doc_context += f"Key data: {json.dumps(extraction['extracted_data'], indent=2)[:500]}...\n"

        context = f"SENDER: {state['sender']}\nSUBJECT: {state['subject']}\nCONTENT: {state['cleaned_content']}\nTHREAD: {state['thread_history']}{doc_context}"

        analysis = llm_client.generate_structured(context, system=CLASSIFICATION_PROMPT)

        # Adjust confidence based on document extraction
        base_confidence = analysis.get('confidence', 0)
        doc_confidence = state.get('confidence_score', 0)

        # Weighted average: 70% email analysis, 30% document extraction
        if state.get('document_extractions'):
            adjusted_confidence = (base_confidence * 0.7) + (doc_confidence * 100 * 0.3)
            analysis['confidence'] = min(adjusted_confidence, 100)
        else:
            analysis['confidence'] = base_confidence

        return {"analysis": analysis, "category": analysis.get('category', 'UNCERTAIN')}

    def _decision_engine_node(self, state: AgentState):
        logger.info("Stage 4: Smart Decision Engine with Confidence Scoring")
        analysis = state['analysis'] or {}
        category = state['category']
        confidence = analysis.get('confidence', 0)
        document_extractions = state.get('document_extractions', [])

        # Base decision logic
        decision = "FYI_KNOWLEDGE"
        priority = "medium"
        needs_review = False

        # Pull multi-factor indicators
        importance_score = analysis.get('importance_score', 50)
        requires_action = analysis.get('requires_action', False)
        sender_lower = state['sender'].lower()
        has_thread_history = bool(state['thread_history'].strip())

        # Guardrail: Confidence check
        if confidence < settings.CONFIDENCE_THRESHOLD:
            needs_review = True
            decision = "REVIEW"
            priority = "high"
            logger.info(f"Low confidence ({confidence}%) - routing to Needs Review (Threshold: {settings.CONFIDENCE_THRESHOLD}%)")

        # If confidence is safe, apply Multi-Factor Decision Grid
        else:
            # RULE 1: Auto Archive / Mute
            # For low-importance noise or marketing that does not require action
            if category in ["PROMOTION", "SPAM"] or \
               (not requires_action and importance_score < 40 and not has_thread_history):
                decision = "ARCHIVE"
                priority = "low"

            # RULE 2: Surface as Action Item
            # Requires action + high importance score or active thread history
            elif requires_action or importance_score >= 70 or has_thread_history:
                priority = "high" if importance_score >= 80 else "medium"

                # Check specialized document classifications
                if document_extractions:
                    if any(ext.get('document_type') == 'invoice' for ext in document_extractions):
                        decision = "PROCESS_INVOICE"
                    elif any(ext.get('document_type') == 'resume' for ext in document_extractions):
                        decision = "PROCESS_RESUME"
                    else:
                        decision = "TASK"
                else:
                    if category == "MEETING_REQUEST" or analysis.get('action_type') == "CALENDAR_BOOKING":
                        decision = "SCHEDULE"
                    elif analysis.get('action_type') == "DRAFT_REPLY" or analysis.get('reply_needed'):
                        decision = "REPLY"
                    else:
                        decision = "TASK"

            # RULE 3: Mark as Knowledge Only
            # Important updates or documents with no direct task/reply required
            else:
                decision = "FYI_KNOWLEDGE"
                priority = "medium" if importance_score >= 60 else "low"

                # Documents with high confidence but no direct actions
                if document_extractions:
                    if any(ext.get('document_type') == 'invoice' for ext in document_extractions):
                        decision = "PROCESS_INVOICE"
                    elif any(ext.get('document_type') == 'resume' for ext in document_extractions):
                        decision = "PROCESS_RESUME"

        # Score override for extreme priorities
        if importance_score >= 90 and not needs_review:
            priority = "urgent"

        return {
            "decision": decision,
            "priority": priority,
            "score": importance_score,
            "needs_human_review": needs_review,
            "confidence_level": self._get_confidence_level(confidence)
        }

    def _get_confidence_level(self, confidence: float) -> str:
        """Convert confidence score to human-readable level"""
        if confidence >= 90:
            return "very_high"
        elif confidence >= 80:
            return "high"
        elif confidence >= 70:
            return "medium"
        elif confidence >= 50:
            return "low"
        else:
            return "very_low"

    def _generate_reply_node(self, state: AgentState):
        if state['decision'] not in ["REPLY", "REVIEW", "TASK"] and not state['analysis'].get('reply_needed'):
            return {"draft_reply": None}
            
        logger.info("Stage 5: Conditional Reply Generation (LLM)")
        prompt = (
            f"Generate a highly professional, polite, and extremely concise email reply to address this message. "
            f"SENDER: {state['sender']}, SUBJECT: {state['subject']}, CONTENT: {state['cleaned_content']}"
        )
        system = (
            "You are the InBoxIQ Executive Ghostwriter. Generate ONLY a concise, professional reply. "
            "NO placeholders like [Name]. Keep it extremely short (1-2 sentences maximum, under 50 words)."
        )
        
        reply = llm_client.generate(prompt, system=system)
        return {"draft_reply": reply}

    def _store_node(self, state: AgentState):
        logger.info("Stage 6: Storing result")
        latency = int((time.time() - state['latency_start']) * 1000)
        analysis = state['analysis']
        
        # Build UI-ready object
        ui_object = {
            "headline": analysis.get('summary', 'New Email'),
            "decision": state['decision'],
            "primary_action": self._get_primary_action(state['decision']),
            "secondary_actions": ["View", "Archive", "Snooze"]
        }
        
        db = SessionLocal()
        try:
            # 1. Update EmailRecord
            email_rec = db.query(EmailRecord).filter(EmailRecord.id == state['email_id']).first()
            if not email_rec:
                email_rec = EmailRecord(id=state['email_id'], thread_id=state['thread_id'])
                db.add(email_rec)
            
            email_rec.sender = state['sender']
            email_rec.subject = state['subject']
            email_rec.content = state['raw_content']
            email_rec.cleaned_content = state['cleaned_content']
            email_rec.summary = analysis.get('summary')
            email_rec.category = state['category']
            email_rec.priority = state['priority']
            email_rec.importance_score = state['score']
            email_rec.confidence_score = int(analysis.get('confidence', 0))
            email_rec.needs_reply = analysis.get('reply_needed', False)
            email_rec.suggested_reply = state.get('draft_reply')
            email_rec.reasoning = analysis.get('reasoning')
            email_rec.actions_required = analysis.get('actions_required', [])
            email_rec.deadlines = analysis.get('deadlines', [])
            email_rec.people = analysis.get('people', [])
            email_rec.organizations = analysis.get('organizations', [])
            email_rec.latency = latency
            email_rec.status = state['decision']
            email_rec.primary_action = ui_object['primary_action']
            # 1b. Store document extractions
            document_extractions = state.get('document_extractions', [])
            for extraction in document_extractions:
                doc_record = DocumentExtraction(
                    email_id=state['email_id'],
                    document_type=extraction.get('document_type', 'unknown'),
                    extracted_data=extraction.get('extracted_data', {}),
                    confidence=int(extraction.get('confidence', 0) * 100),  # Convert to 0-100
                    raw_text_length=extraction.get('raw_text_length', 0),
                    filename=extraction.get('filename', ''),
                    error=extraction.get('error')
                )
                db.add(doc_record)

            # 1c. Store attachment metadata
            attachments = state.get('attachments', [])
            for attachment in attachments:
                att_record = EmailAttachment(
                    email_id=state['email_id'],
                    filename=attachment.get('filename', ''),
                    size=attachment.get('size', 0),
                    mime_type=attachment.get('mimeType', ''),
                    attachment_id=attachment.get('attachmentId', ''),
                    processed=True  # We've processed PDFs
                )
                db.add(att_record)

            # 1d. Create/Update ActionItem (so the UI has real work items)
            decision = (state.get("decision") or "").upper()
            item_type = None
            if decision == "REPLY" or analysis.get("reply_needed"):
                item_type = "reply"
            elif decision in ["PROCESS_INVOICE", "REVIEW_INVOICE"]:
                item_type = "invoice"
            elif decision in ["PROCESS_RESUME", "REVIEW_RESUME"]:
                item_type = "resume"
            elif decision == "TASK" or (analysis.get("actions_required") or []):
                item_type = "task"
            elif decision == "SCHEDULE" or "MEETING" in (state.get("category") or ""):
                item_type = "schedule"

            if item_type:
                existing_item = (
                    db.query(ActionItem)
                    .filter(ActionItem.email_id == state["email_id"])
                    .filter(ActionItem.status == "open")
                    .first()
                )
                if not existing_item:
                    existing_item = ActionItem(
                        email_id=state["email_id"],
                        thread_id=state["thread_id"],
                        status="open",
                    )
                    db.add(existing_item)

                existing_item.type = item_type
                existing_item.title = analysis.get("summary") or state.get("subject") or "New Item"
                
                # Use the clean, short AI draft response or a one-sentence summary for the description
                draft = state.get("draft_reply")
                if draft:
                    existing_item.description = draft
                else:
                    existing_item.description = f"Email Summary: {analysis.get('summary') or 'Awaiting verification.'}"
                    
                existing_item.priority = state.get("priority") or "medium"
                existing_item.confidence = int(analysis.get("confidence", 0) or 0)
                existing_item.automation_proposed = True
                existing_item.suggested_draft = state.get("draft_reply")

                # Add document-specific context
                if document_extractions and item_type in ["invoice", "resume"]:
                    doc_data = document_extractions[0].get('extracted_data', {})
                    if item_type == "invoice":
                        existing_item.title = f"Invoice: {doc_data.get('invoice_number', 'Unknown')}"
                        existing_item.description = f"Amount: ${doc_data.get('total_amount', 'Unknown')} from {doc_data.get('vendor_name', 'Unknown Vendor')}"
                    elif item_type == "resume":
                        existing_item.title = f"Resume: {doc_data.get('name', 'Unknown Candidate')}"
                        existing_item.description = f"{doc_data.get('current_position', 'Unknown Position')} with {doc_data.get('experience_years', 0)} years experience"

            # 2. Log Decision (with versioning)
            log = DecisionLog(
                email_id=state['email_id'],
                raw_email=state['raw_content'][:500],
                cleaned_email=state['cleaned_content'][:500],
                category=state['category'],
                confidence=int(analysis.get('confidence', 0)),
                decision=state['decision'],
                reply_needed=analysis.get('reply_needed', False),
                latency=latency,
                model_version=MODEL_VERSION,
                prompt_version=PROMPT_VERSION
            )
            db.add(log)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to store result: {e}")
            db.rollback()
        finally:
            db.close()

        # 3. Autopilot actions (Gmail-side), only after DB write succeeded
        try:
            cfg = get_autopilot_config()
            if cfg.enabled:
                if cfg.apply_labels:
                    label = label_for_category(state.get("category", ""))
                    if label:
                        gmail_reader.apply_label_by_name(state["email_id"], label)

                if should_auto_archive(state.get("decision", ""), state.get("is_noise", False), state.get("category", "")):
                    gmail_reader.archive(state["email_id"])
                    if cfg.mark_read_on_archive:
                        gmail_reader.mark_read(state["email_id"])
        except Exception as e:
            logger.error(f"Autopilot action failed for {state.get('email_id')}: {e}")
            
        return {"finished": True, "ui_data": ui_object}

    def _get_primary_action(self, decision: str) -> str:
        mapping = {
            "TASK": "Mark Done",
            "REPLY": "Send Draft",
            "SCHEDULE": "Open Calendar",
            "IGNORE": "Archive",
            "READ_LATER": "Mark as Read"
        }
        return mapping.get(decision, "Open")

    async def execute(self, email_id: str, thread_id: str):
        initial_state = {
            "email_id": email_id,
            "thread_id": thread_id,
            "sender": "",
            "subject": "",
            "raw_content": "",
            "cleaned_content": "",
            "thread_history": "",
            "analysis": None,
            "category": "UNCERTAIN",
            "decision": "READ_LATER",
            "priority": "medium",
            "score": 0,
            "is_noise": False,
            "latency_start": 0.0,
            "finished": False,
            "draft_reply": None,
        }
        return await self.workflow.ainvoke(initial_state)

brain = LangGraphBrain()

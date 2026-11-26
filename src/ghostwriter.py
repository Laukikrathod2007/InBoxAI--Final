import logging
from .llm_client import llm_client

logger = logging.getLogger(__name__)

class Ghostwriter:
    """
    The InBoxIQ Ghostwriter handles manual drafting requests.
    Proactive drafting is now handled by the brain's master prompt.
    """
    
    PERSONA = (
        "You are the InBoxIQ Executive Ghostwriter. Your tone is ultra-professional, "
        "concise, and context-aware. You write emails that are ready to send. "
        "Strict rules:\n"
        "1. NO placeholders like [Name] or [Date].\n"
        "2. Structure: Subject Line -> Formal Salutation -> Clear Context -> Call to action -> Professional Sign-off.\n"
        "3. You write AS the user, in the first person. Sign off with just 'Best regards,' and no name."
    )

    def draft_manual(self, intent: str, thread_context: str = "", tone: str = "Professional") -> dict:
        """ Generate a draft based on specific user intent """
        prompt = f"""
USER INTENT: {intent}
CONTEXT: {thread_context}
TONE: {tone}

Draft the full email (Subject and Body). Return as a JSON object with 'subject' and 'body' keys.
"""
        system = f"{self.PERSONA}\nDraft in a {tone} tone."
        try:
            data = llm_client.generate_json(prompt, system=system) or {}
        except Exception:
            data = {}
        return normalize_draft(data)


def normalize_draft(data: dict) -> dict:
    """Always return {subject, body} strings. The UI must never show a raw model dict."""
    if not isinstance(data, dict):
        data = {}
    subject = str(data.get("subject") or "").strip()
    body = str(data.get("body") or data.get("email") or data.get("content") or "").strip()
    if not body:
        return {"subject": subject, "body": "", "error": "The model did not return a draft. Edit this message or try again."}
    return {"subject": subject or "(no subject)", "body": body}

ghostwriter = Ghostwriter()

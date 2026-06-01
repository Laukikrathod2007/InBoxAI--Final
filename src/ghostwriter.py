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
        "3. Sign off as: 'Best regards, The InBoxIQ Team'."
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
            return llm_client.generate_json(prompt, system=system)
        except Exception:
            return {"subject": "New Message", "body": "Drafting failed. Please try again."}

ghostwriter = Ghostwriter()

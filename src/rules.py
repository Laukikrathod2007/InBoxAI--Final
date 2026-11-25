"""Pure, dependency-free email rules (no network, no LLM, no Gmail). Safe to import anywhere."""
from typing import Optional

# --- CORE UTILITIES ---

def clean_email(text: str) -> str:
    """ UPGRADED: Remove signatures and quoted replies """
    if not text: return ""
    import re
    # Cut only at a real quoted-reply header ("On <date>, X wrote:"), not at any "On ".
    text = re.split(r"\n\s*On .{5,120}wrote:\s*\n", text, maxsplit=1)[0]
    text = text.split("---------- Forwarded message", 1)[0]
    # Remove a sign-off only when it starts a line.
    # Sign-off must be alone on its line ("Thanks, can you..." is content, not a sign-off).
    text = re.split(r"\n\s*(?:Best regards|Kind regards|Sincerely|Thanks|Cheers),?\s*(?:\n|$)|\n\s*Sent from my",
                    text, maxsplit=1)[0]
    return text.strip()

def quick_rule_filter(sender: str, subject: str, text: str, attachments: list, thread_history: str) -> Optional[dict]:
    """
    Deterministic pre-bucketing of emails before LLM logic to optimize cost and speed.
    """
    sender_lower = sender.lower()
    subject_lower = subject.lower()
    text_lower = text.lower()
    
    # 1. Marketing / Noise
    # Precision first: a rule may only hide mail when it is very sure. An
    # "unsubscribe" footer alone is NOT enough (contracts, project mail and
    # GitHub notifications carry one). Everything unsure goes to the LLM.
    bulk_sender = any(w in sender_lower for w in
                      ["newsletter", "promo", "marketing", "deals", "offers", "subscription",
                       "digest", "jobs-noreply", "mailchimp"])
    promo_subject = any(w in subject_lower for w in ["discount", "% off", "limited offer", "off your next"])
    # Real-mail check (eval/real.py, 50 hand labels): sender keywords and
    # "unsubscribe + noreply" hid newsletters and notices the user reads
    # (30.3% false-archive). Only promo subjects were always right, so only they
    # hide mail. bulk_sender is kept as a hint for the LLM, not a decision.
    _ = bulk_sender, text_lower
    if promo_subject and not any(w in subject_lower for w in
                                 ["invoice", "payment", "security", "contract", "review requested"]):
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
    # Only routine status mail from automated senders. Ticket, review, security
    # and payment mail is never matched here; the LLM decides those.
    if ("no-reply" in sender_lower or "noreply" in sender_lower or "donotreply" in sender_lower) and \
       any(word in subject_lower for word in ["daily update", "status report", "weekly digest"]):
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


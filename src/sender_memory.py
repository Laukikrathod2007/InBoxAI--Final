"""Learn noise senders from the user's own Mute clicks.

A sender is treated as noise after the user has muted their mail MUTE_THRESHOLD
times, unless the user has ever written to them (checked by the caller) or has
since marked one of their emails as not noise. Pure counting, no model.
"""
import re

from .database import EmailRecord, SessionLocal, UserFeedback

MUTE_THRESHOLD = 2


def sender_key(sender: str) -> str:
    m = re.search(r"<([^>]+)>", sender or "")
    return (m.group(1) if m else (sender or "")).strip().lower()


def muted_senders(db=None, threshold: int = MUTE_THRESHOLD) -> set:
    """Senders the user has muted at least `threshold` times and never un-muted."""
    own = db is None
    db = db or SessionLocal()
    try:
        rows = (db.query(EmailRecord.sender, UserFeedback.new_value)
                .join(UserFeedback, UserFeedback.email_id == EmailRecord.id)
                .filter(UserFeedback.field == "is_noise").all())
        mutes, unmutes = {}, set()
        for sender, new in rows:
            k = sender_key(sender)
            if str(new) == "True":
                mutes[k] = mutes.get(k, 0) + 1
            else:
                unmutes.add(k)
        return {k for k, n in mutes.items() if n >= threshold and k not in unmutes}
    finally:
        if own:
            db.close()


def learned_noise(sender: str, db=None) -> dict | None:
    """Rule-filter result if the user taught us this sender is noise, else None."""
    if sender_key(sender) not in muted_senders(db):
        return None
    return {
        "bucket": "USER_MUTED_SENDER", "is_noise": True, "category": "NEWSLETTER",
        "decision": "ARCHIVE", "priority": "low", "score": 5,
        "analysis": {
            "summary": "Sender muted by you before", "category": "NEWSLETTER", "confidence": 100,
            "importance_score": 5, "reasoning": f"You muted this sender at least {MUTE_THRESHOLD} times.",
            "requires_action": False, "action_type": "NONE", "deadline": None, "actions_required": [],
            "deadlines": [], "people": [], "organizations": [], "reply_needed": False,
        },
    }

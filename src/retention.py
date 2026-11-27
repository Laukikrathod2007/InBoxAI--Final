"""Data minimisation: erase stored email bodies after RETENTION_DAYS.

Subject, sender, summary, labels and decisions stay, so the dashboard and the
audit log keep working. Only the full text is removed. 0 disables it.
"""
import logging
import os
from datetime import datetime, timedelta

from .database import DecisionLog, EmailRecord, SessionLocal

logger = logging.getLogger(__name__)


def retention_days() -> int:
    try:
        return max(0, int(os.getenv("RETENTION_DAYS", "30")))
    except ValueError:
        return 30


def purge_old_bodies(days: int | None = None, now: datetime | None = None) -> int:
    days = retention_days() if days is None else days
    if days <= 0:
        return 0
    cutoff = (now or datetime.utcnow()) - timedelta(days=days)
    db = SessionLocal()
    try:
        rows = (db.query(EmailRecord)
                .filter(EmailRecord.received_at < cutoff)
                .filter((EmailRecord.content.isnot(None)) | (EmailRecord.cleaned_content.isnot(None)))
                .all())
        ids = [r.id for r in rows]
        for r in rows:
            r.content = None
            r.cleaned_content = None
        if ids:
            (db.query(DecisionLog).filter(DecisionLog.email_id.in_(ids))
             .update({DecisionLog.raw_email: None, DecisionLog.cleaned_email: None}, synchronize_session=False))
        db.commit()
        if ids:
            logger.info(f"Retention: erased bodies of {len(ids)} emails older than {days} days.")
        return len(ids)
    finally:
        db.close()

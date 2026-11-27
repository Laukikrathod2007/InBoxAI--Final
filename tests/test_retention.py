from datetime import datetime, timedelta

from src.database import DecisionLog, EmailRecord, SessionLocal, init_db
from src.retention import purge_old_bodies


def test_old_bodies_are_erased_but_metadata_kept():
    init_db()
    db = SessionLocal()
    db.query(EmailRecord).filter(EmailRecord.id.in_(["r_old", "r_new"])).delete(synchronize_session=False)
    now = datetime(2026, 11, 27)
    db.add(EmailRecord(id="r_old", subject="old", sender="a@b.example", content="secret body",
                       cleaned_content="secret", received_at=now - timedelta(days=40)))
    db.add(EmailRecord(id="r_new", subject="new", sender="a@b.example", content="fresh body",
                       received_at=now - timedelta(days=2)))
    db.add(DecisionLog(email_id="r_old", raw_email="secret body", cleaned_email="secret"))
    db.commit()
    db.close()

    assert purge_old_bodies(days=30, now=now) >= 1

    db = SessionLocal()
    old, new = db.get(EmailRecord, "r_old"), db.get(EmailRecord, "r_new")
    assert old.content is None and old.cleaned_content is None and old.subject == "old"
    assert new.content == "fresh body"
    assert db.query(DecisionLog).filter_by(email_id="r_old").first().raw_email is None
    db.close()


def test_zero_days_disables_retention():
    assert purge_old_bodies(days=0) == 0

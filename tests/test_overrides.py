from fastapi.testclient import TestClient

from src.database import EmailRecord, SessionLocal, UserFeedback, init_db
from src.main import app

client = TestClient(app)
from src.auth import get_token
H = {"X-InBoxIQ-Token": get_token()}



def _seed(email_id="t1"):
    init_db()
    db = SessionLocal()
    db.query(UserFeedback).delete()
    db.query(EmailRecord).filter(EmailRecord.id == email_id).delete()
    db.add(EmailRecord(id=email_id, sender="a@b.c", subject="s", status="TASK", priority="high"))
    db.commit()
    db.close()


def test_override_marks_done_and_records_feedback():
    _seed()
    r = client.post("/api/overrides", json={"email_id": "t1", "is_done": True}, headers=H)
    assert r.status_code == 200
    db = SessionLocal()
    assert db.query(EmailRecord).get("t1").status == "archived"
    assert db.query(UserFeedback).filter_by(email_id="t1", field="is_done").count() == 1
    db.close()


def test_override_unknown_email_returns_404():
    _seed()
    r = client.post("/api/overrides", json={"email_id": "missing", "is_done": True}, headers=H)
    assert r.status_code == 404

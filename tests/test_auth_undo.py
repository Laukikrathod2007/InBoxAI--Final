from unittest.mock import patch

from fastapi.testclient import TestClient

from src.auth import get_token
from src.database import EmailRecord, SessionLocal, SystemLog, init_db
from src.main import app

client = TestClient(app)
H = {"X-InBoxIQ-Token": get_token()}


def test_api_requires_token():
    assert client.get("/api/history").status_code == 401
    assert client.post("/api/send", json={"recipient": "a@b.c", "subject": "s", "body": "b"}).status_code == 401
    assert client.post("/process-now").status_code == 401


def test_wrong_token_rejected():
    assert client.get("/api/history", headers={"X-InBoxIQ-Token": "nope"}).status_code == 401


def test_session_gives_working_token_to_local_ui():
    tok = client.get("/api/session").json()["token"]
    assert client.get("/api/stats", headers={"X-InBoxIQ-Token": tok}).status_code == 200


def test_undo_executed_archive():
    init_db()
    db = SessionLocal()
    db.query(EmailRecord).filter(EmailRecord.id == "u1").delete()
    db.add(EmailRecord(id="u1", status="ARCHIVE", is_done=True))
    log = SystemLog(level="INFO", component="autopilot", message="EXECUTED archive",
                    details={"email_id": "u1", "action": "archive", "executed": True})
    db.add(log)
    db.commit()
    log_id = log.id
    db.close()
    with patch("src.api_routes.gmail_reader") as gm:
        gm.modify_message_labels.return_value = True
        r = client.post(f"/api/autopilot/undo/{log_id}", headers=H)
    assert r.status_code == 200 and r.json()["status"] == "undone"
    gm.modify_message_labels.assert_called_once_with("u1", add_label_ids=["INBOX", "UNREAD"])
    db = SessionLocal()
    assert db.query(EmailRecord).get("u1").status == "REVIEW"
    db.close()


def test_dry_run_entries_cannot_be_undone():
    init_db()
    db = SessionLocal()
    log = SystemLog(level="INFO", component="autopilot", message="DRY_RUN archive",
                    details={"email_id": "u2", "action": "archive", "executed": False})
    db.add(log)
    db.commit()
    log_id = log.id
    db.close()
    assert client.post(f"/api/autopilot/undo/{log_id}", headers=H).status_code == 400


def test_empty_token_file_does_not_disable_auth():
    from src import auth
    auth.TOKEN_FILE.write_text("")
    assert client.get("/api/history").status_code == 401
    assert len(auth.get_token()) >= 20
    globals()["H"] = {"X-InBoxIQ-Token": auth.get_token()}


def test_store_failure_skips_gmail_actions():
    from src.autopilot import AutopilotConfig
    from src.brain import brain
    cfg = AutopilotConfig(True, "autonomous", True, True, True, False, ())
    bad_state = {"email_id": "f1", "decision": "ARCHIVE", "is_noise": True, "category": "PROMOTION",
                 "analysis": None, "latency_start": 0.0}  # analysis=None makes the store fail
    with patch("src.brain.get_autopilot_config", return_value=cfg), \
         patch("src.autopilot.get_autopilot_config", return_value=cfg), \
         patch("src.brain.gmail_reader") as gm:
        try:
            brain._store_node(bad_state)
        except Exception:
            pass
    assert not gm.archive.called


def test_bounce_mail_is_not_hidden_by_rules():
    from src.brain import quick_rule_filter
    assert quick_rule_filter("Mail Delivery <mailer-daemon@googlemail.com>",
                             "Delivery Status Notification (Failure)", "Address not found", [], "") is None


def test_clean_email_keeps_thanks_sentence():
    from src.brain import clean_email
    assert "send the invoice" in clean_email("Hi,\nThanks, can you send the invoice by Friday?")

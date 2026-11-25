from unittest.mock import patch

from fastapi.testclient import TestClient

from src.autopilot import AutopilotConfig
from src.brain import brain
from src.database import SystemLog, SessionLocal, init_db
from src.main import app


def _cfg(mode):
    return AutopilotConfig(True, mode, True, True, True, False, ())


def _state():
    return {"email_id": "e1", "decision": "ARCHIVE", "is_noise": True,
            "category": "PROMOTION", "analysis": {}, "latency_start": 0.0,
            "sender": "s", "subject": "s", "raw_content": "", "cleaned_content": "",
            "thread_id": "t", "priority": "low", "score": 0, "draft_reply": None}


def test_assist_mode_never_touches_gmail():
    init_db()
    with patch("src.brain.get_autopilot_config", return_value=_cfg("assist")), \
         patch("src.brain.gmail_reader") as gm:
        brain._store_node(_state())
    assert not gm.archive.called and not gm.apply_label_by_name.called and not gm.mark_read.called


def test_assist_mode_writes_dry_run_audit_row():
    init_db()
    db = SessionLocal()
    before = db.query(SystemLog).filter(SystemLog.message == "DRY_RUN archive").count()
    db.close()
    with patch("src.brain.get_autopilot_config", return_value=_cfg("assist")), \
         patch("src.brain.gmail_reader"):
        brain._store_node(_state())
    db = SessionLocal()
    assert db.query(SystemLog).filter(SystemLog.message == "DRY_RUN archive").count() > before
    db.close()


def test_autonomous_mode_archives():
    init_db()
    with patch("src.brain.get_autopilot_config", return_value=_cfg("autonomous")), \
         patch("src.autopilot.get_autopilot_config", return_value=_cfg("autonomous")), \
         patch("src.brain.gmail_reader") as gm:
        brain._store_node(_state())
    assert gm.archive.called


def test_metrics_endpoint_shape():
    r = TestClient(app).get("/api/metrics")
    assert r.status_code == 200 and "p95_ms" in r.json()

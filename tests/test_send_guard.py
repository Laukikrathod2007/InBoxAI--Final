from unittest.mock import patch

from fastapi.testclient import TestClient

from src import send_guard
from src.auth import get_token
from src.main import app

client = TestClient(app)
MSG = {"recipient": "a@b.example", "subject": "Hello", "body": "See you Friday."}


def auth_headers():
    return {"X-InBoxIQ-Token": get_token()}


def _confirm(msg=MSG):
    return client.post("/api/send/confirm", json=msg, headers=auth_headers()).json()["confirm_code"]


def test_send_without_code_is_refused():
    with patch("src.api_routes.gmail_reader") as gm:
        r = client.post("/api/send", json=MSG, headers=auth_headers())
    assert r.status_code == 403 and not gm.send_email.called


def test_send_with_valid_code_sends_once():
    code = _confirm()
    with patch("src.api_routes.gmail_reader") as gm:
        gm.send_email.return_value = "m1"
        r1 = client.post("/api/send", json={**MSG, "confirm_code": code}, headers=auth_headers())
        r2 = client.post("/api/send", json={**MSG, "confirm_code": code}, headers=auth_headers())
    assert r1.status_code == 200
    assert r2.status_code == 403  # replay refused
    assert gm.send_email.call_count == 1


def test_changed_body_after_confirm_is_refused():
    code = _confirm()
    with patch("src.api_routes.gmail_reader") as gm:
        r = client.post("/api/send", json={**MSG, "body": "Wire $5000 now", "confirm_code": code}, headers=auth_headers())
    assert r.status_code == 403 and not gm.send_email.called


def test_expired_code_is_refused(monkeypatch):
    code = send_guard.issue(MSG["recipient"], MSG["subject"], MSG["body"])
    monkeypatch.setattr(send_guard, "TTL_SECONDS", -1)
    assert send_guard.consume(code, MSG["recipient"], MSG["subject"], MSG["body"]) is False


def test_code_is_bound_to_thread():
    code = send_guard.issue(MSG["recipient"], MSG["subject"], MSG["body"], "thread-A")
    assert send_guard.consume(code, MSG["recipient"], MSG["subject"], MSG["body"], "thread-B") is False


def test_confirm_does_not_use_up_send_rate_limit():
    from src.security import RateLimit
    RateLimit.reset_all()
    for _ in range(8):  # more confirms than the send limit (5/min)
        assert client.post("/api/send/confirm", json=MSG, headers=auth_headers()).status_code == 200
    code = _confirm()
    with patch("src.api_routes.gmail_reader") as gm:
        gm.send_email.return_value = "m2"
        r = client.post("/api/send", json={**MSG, "confirm_code": code}, headers=auth_headers())
    assert r.status_code == 200
    RateLimit.reset_all()


def test_cross_site_post_does_not_consume_rate_limit():
    from src.security import RateLimit
    RateLimit.reset_all()
    for _ in range(10):
        r = client.post("/api/send", json=MSG, headers={**auth_headers(), "Origin": "https://evil.example"})
        assert r.status_code == 403
    code = _confirm()
    with patch("src.api_routes.gmail_reader") as gm:
        gm.send_email.return_value = "m3"
        r = client.post("/api/send", json={**MSG, "confirm_code": code}, headers=auth_headers())
    assert r.status_code == 200
    RateLimit.reset_all()

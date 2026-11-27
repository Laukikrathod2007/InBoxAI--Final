import logging

from fastapi.testclient import TestClient

from src.auth import get_token
from src.main import app

client = TestClient(app)
H = {"X-InBoxIQ-Token": get_token()}


def test_api_docs_are_hidden_by_default():
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert client.get(path).status_code in (404, 200)
        # A 200 can only be the SPA index fallback, never the API schema.
        assert "openapi" not in client.get(path).text.lower()


def test_security_headers_present():
    r = client.get("/health")
    assert r.headers["x-frame-options"] == "DENY"
    assert r.headers["x-content-type-options"] == "nosniff"
    assert "frame-ancestors 'none'" in r.headers["content-security-policy"]
    assert r.headers["referrer-policy"] == "no-referrer"


def test_send_is_rate_limited():
    codes = [client.post("/api/send", json={"recipient": "a@b.example", "subject": "s", "body": "b"},
                         headers=H).status_code for _ in range(8)]
    assert 429 in codes, codes


def test_llm_output_is_never_logged(monkeypatch, caplog):
    from src.llm_client import LLMClient
    c = LLMClient()
    secret = "Confidential: salary review for Dana"
    monkeypatch.setattr(c, "_call_with_fallback", lambda *a, **k: secret)
    with caplog.at_level(logging.WARNING):
        c.generate_structured("x", retries=1)
    assert secret not in caplog.text
    assert "sha256=" in caplog.text

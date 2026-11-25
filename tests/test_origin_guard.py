from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


def test_cross_origin_write_is_blocked():
    r = client.post("/api/settings", json={"confidence_threshold": 80},
                    headers={"Origin": "https://evil.example"})
    assert r.status_code == 403


def test_same_origin_write_is_allowed():
    r = client.post("/api/settings", json={"confidence_threshold": 80},
                    headers={"Origin": "http://localhost:8001"})
    assert r.status_code == 200


def test_unknown_host_header_is_rejected():
    r = client.get("/health", headers={"Host": "attacker.example"})
    assert r.status_code == 400

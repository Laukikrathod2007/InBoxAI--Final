import pytest
from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)  # no "with": startup (worker) is not triggered


@pytest.mark.parametrize(
    "path",
    [
        "/..%2f..%2fSECRET_PROBE.txt",
        "/%2e%2e/%2e%2e/SECRET_PROBE.txt",
        "/..%2fSECRET_PROBE.txt",
    ],
)
def test_path_traversal_does_not_leak_files(path):
    r = client.get(path)
    assert "SECRET_CONTENT" not in r.text


def test_spa_fallback_still_serves_index():
    r = client.get("/some/client/route")
    assert r.status_code == 200
    assert "INDEX_PAGE" in r.text


def test_cors_rejects_foreign_origin():
    r = client.options(
        "/api/stats",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "GET"},
    )
    assert "access-control-allow-origin" not in {k.lower() for k in r.headers}


def test_autopilot_defaults_to_assist():
    from src.config import Settings
    assert Settings.model_fields["AUTOPILOT_MODE"].default == "assist"

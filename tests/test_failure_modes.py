"""Failure drills: what the system does when its dependencies fail."""
from src.config import settings
from src.llm_client import LLMClient


def _client_with_no_models(monkeypatch):
    c = LLMClient()
    monkeypatch.setattr(c, "_call_with_fallback", lambda *a, **k: "")
    return c


def test_no_llm_returns_empty_not_invented_data(monkeypatch):
    c = _client_with_no_models(monkeypatch)
    assert c.generate_structured("anything") == {}


def test_garbage_llm_output_returns_empty(monkeypatch):
    c = LLMClient()
    monkeypatch.setattr(c, "_call_with_fallback", lambda *a, **k: "sorry, no json here")
    assert c.generate_structured("x", retries=2) == {}


def test_empty_analysis_routes_to_human_review():
    from src.brain import brain
    state = {
        "analysis": {}, "category": "UNCERTAIN", "sender": "a@b.example",
        "thread_history": "", "document_extractions": [],
    }
    out = brain._decision_engine_node(state)
    assert out["decision"] == "REVIEW"
    assert out["priority"] == "high"
    assert settings.CONFIDENCE_THRESHOLD > 0

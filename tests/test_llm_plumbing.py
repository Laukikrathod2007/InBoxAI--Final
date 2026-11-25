import pytest

from src.brain import clean_email
from src.extractor import _json_from_llm


def test_clean_email_keeps_text_after_on_sentence():
    body = "Hi,\nOn Monday we ship the release. Please confirm the plan.\nThanks all"
    assert "Please confirm the plan" in clean_email(body)


def test_clean_email_strips_quoted_reply():
    body = "Sounds good.\n\nOn Tue, 3 Jun 2025, Ana <a@b.example> wrote:\n> old text"
    assert clean_email(body) == "Sounds good."


def test_json_parser_handles_code_fence_and_prose():
    assert _json_from_llm('Here you go:\n```json\n{"a": 1}\n```') == {"a": 1}


def test_json_parser_rejects_non_json():
    with pytest.raises(ValueError):
        _json_from_llm("I could not read this document.")

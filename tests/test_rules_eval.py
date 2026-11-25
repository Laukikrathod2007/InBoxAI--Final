"""Regression guard: the keyword rules must never hide important mail.

Runs on the synthetic mailbox (eval/data). Fails if a needs_action or fyi
email is archived by the rules, or if too much noise slips through.
"""
from eval.run_eval import load, rules_predict, score


def test_rules_never_archive_important_mail():
    rows = load()
    preds = [rules_predict(r) for r in rows]
    s = score(rows, preds)
    assert s["false_archive_pct"] == 0.0, s
    assert s["hard_cases_archived_pct"] == 0.0, s


def test_rules_still_catch_promo_noise():
    # v3 hides only promo subjects (real-mail check showed sender keywords hid
    # mail the user reads). Recall is deliberately low; the LLM handles the rest.
    rows = load()
    s = score(rows, [rules_predict(r) for r in rows])
    assert s["noise_recall_pct"] >= 35.0, s
    assert s["noise_precision_pct"] == 100.0, s


def test_security_probe_mail_is_not_archived():
    from src.brain import quick_rule_filter
    assert quick_rule_filter(
        "Bank <alerts@bank.example>", "Security alert: new sign-in",
        "Unsubscribe", [], "") is None

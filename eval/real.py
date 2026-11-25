"""Score InBoxIQ on YOUR real mail. Nothing here is committed (paths are gitignored).

  python -m eval.real export          # writes eval/data/real_export.csv to label
  python -m eval.real score           # decisions the app stored at the time (old system)
  python -m eval.real rules           # current keyword rules on the same emails
  python -m eval.real pipeline        # current rules + local LLM + decision engine (Ollama only)

Only totals are printed, never email content. The DB is opened read-only.
"""
import csv
import sqlite3
import sys
from pathlib import Path

from eval.run_eval import score

D = Path(__file__).parent / "data"
HIDDEN = {"ARCHIVE", "IGNORE", "noise", "archived"}  # statuses kept out of the action views


def _db():
    return sqlite3.connect("file:inboxiq.db?mode=ro", uri=True)


def _labels():
    # utf-8-sig: Excel adds a byte-order mark when saving CSV.
    rows = csv.DictReader(open(D / "real_labels.csv", encoding="utf-8-sig"))
    return {r["id"]: r["label"].strip().lower() for r in rows
            if (r.get("label") or "").strip().lower() in ("noise", "needs_action", "fyi")}


def export(n=50):
    rows = _db().execute("select id, sender, subject, status from emails "
                         "order by received_at desc limit ?", (n,)).fetchall()
    with open(D / "real_export.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "sender", "subject", "app_decision", "label"])
        w.writerows([*r, ""] for r in rows)
    print(f"wrote {len(rows)} rows; fill the label column, save as real_labels.csv")


def _report(name, rows, preds):
    s = score(rows, preds)
    s.pop("hard_cases_archived_pct", None)
    print(f"{name}: {s}")


def stored():
    c, rows, preds = _db(), [], []
    for eid, label in _labels().items():
        hit = c.execute("select status from emails where id = ?", (eid,)).fetchone()
        if hit:
            rows.append({"label": label, "hard": False})
            preds.append(hit[0] in HIDDEN)
    _report("stored decisions (original system)", rows, preds)


def _emails():
    c = _db()
    for eid, label in _labels().items():
        hit = c.execute("select sender, subject, content from emails where id = ?", (eid,)).fetchone()
        if hit:
            yield label, (hit[0] or ""), (hit[1] or ""), (hit[2] or "")


def rules():
    from src.brain import quick_rule_filter
    rows, preds = [], []
    for label, sender, subject, body in _emails():
        rows.append({"label": label, "hard": False})
        preds.append(quick_rule_filter(sender, subject, body, [], "") is not None)
    _report("current rules only", rows, preds)


def pipeline():
    from src.brain import CLASSIFICATION_PROMPT, brain, clean_email, quick_rule_filter
    from src.llm_client import llm_client
    if not llm_client.local_available:
        raise SystemExit("Ollama is not reachable. Refusing to send real email to a cloud model.")
    llm_client.use_remote = False  # hard stop: real mail never goes to Gemini
    rows, preds = [], []
    for label, sender, subject, body in _emails():
        rows.append({"label": label, "hard": False})
        if quick_rule_filter(sender, subject, body, [], "") is not None:
            preds.append(True)
            continue
        ctx = f"SENDER: {sender}\nSUBJECT: {subject}\nCONTENT: {clean_email(body)[:3000]}"
        a = llm_client.generate_structured(ctx, system=CLASSIFICATION_PROMPT) or {}
        out = brain._decision_engine_node({
            "analysis": a, "category": a.get("category", "UNCERTAIN"), "sender": sender,
            "thread_history": "", "document_extractions": []})
        preds.append(out["decision"] in HIDDEN)
    _report("current rules + local LLM + decision engine", rows, preds)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "export"
    {"export": export, "score": stored, "rules": rules, "pipeline": pipeline}[cmd]()

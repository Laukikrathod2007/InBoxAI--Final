"""Score InBoxIQ on YOUR real mail. Nothing here is committed (paths are gitignored).

  python -m eval.real export    # writes eval/data/real_export.csv (id, sender, subject, app decision)
  # add a "label" column: noise | needs_action | fyi, save as eval/data/real_labels.csv
  python -m eval.real score     # prints only totals, never email content
"""
import csv
import sqlite3
import sys
from pathlib import Path

D = Path(__file__).parent / "data"


def score(rows, preds):
    """Same metrics as eval/run_eval.py, kept here so this script needs no app imports."""
    noise = [p for r, p in zip(rows, preds) if r["label"] == "noise"]
    other = [p for r, p in zip(rows, preds) if r["label"] != "noise"]
    act = [p for r, p in zip(rows, preds) if r["label"] == "needs_action"]
    tp, fp = sum(noise), sum(other)
    pct = lambda a, b: round(100 * a / b, 1) if b else 0.0
    return {"n": len(rows), "noise_recall_pct": pct(tp, len(noise)),
            "noise_precision_pct": pct(tp, tp + fp), "false_archive_pct": pct(fp, len(other)),
            "needs_action_lost_pct": pct(sum(act), len(act))}
HIDDEN = {"ARCHIVE", "IGNORE", "noise", "archived"}  # statuses that keep mail out of the action views


def export(n=50):
    c = sqlite3.connect("file:inboxiq.db?mode=ro", uri=True)  # read-only
    rows = c.execute("select id, sender, subject, status from emails order by received_at desc limit ?", (n,)).fetchall()
    with open(D / "real_export.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "sender", "subject", "app_decision", "label"])
        w.writerows([*r, ""] for r in rows)
    print(f"wrote {len(rows)} rows to {D / 'real_export.csv'}; fill the label column, save as real_labels.csv")


def score_real():
    """Compare (a) what the app decided when it ran (old code) with (b) the current
    keyword rules re-run on the stored email text. Prints totals only."""
    from src.rules import quick_rule_filter
    # utf-8-sig: Excel adds a BOM that would otherwise rename the "id" column.
    with open(D / "real_labels.csv", encoding="utf-8-sig") as f:
        labels = {r["id"].strip(): r["label"].strip().lower() for r in csv.DictReader(f)
                  if (r.get("label") or "").strip().lower() in ("noise", "needs_action", "fyi")}
    c = sqlite3.connect("file:inboxiq.db?mode=ro", uri=True)
    rows, old, new = [], [], []
    for eid, label in labels.items():
        hit = c.execute("select status, sender, subject, content from emails where id = ?", (eid,)).fetchone()
        if not hit:
            continue
        status, sender, subject, content = hit
        rows.append({"label": label, "hard": False})
        old.append(status in HIDDEN)
        new.append(quick_rule_filter(sender or "", subject or "", content or "", [], "") is not None)
    print(f"labelled emails scored: {len(rows)}")
    results = {
        "archive nothing (baseline)": score(rows, [False] * len(rows)),
        "app as it ran (old rules + LLM)": score(rows, old),
        "current rules only (v3)": score(rows, new),
    }
    cols = ["n", "noise_recall_pct", "noise_precision_pct", "false_archive_pct", "needs_action_lost_pct"]
    print("| system | " + " | ".join(cols) + " |")
    for k, v in results.items():
        print(f"| {k} | " + " | ".join(str(v[col]) for col in cols) + " |")


if __name__ == "__main__":
    {"export": export, "score": score_real}[sys.argv[1] if len(sys.argv) > 1 else "export"]()

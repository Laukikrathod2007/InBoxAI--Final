"""Score the noise filter on the synthetic mailbox.

  python -m eval.run_eval --name rules_v2            # keyword rules (no network)
  python -m eval.run_eval --name llm --llm           # local LLM (Ollama) only

"Predicted noise" means the system would archive/hide the email.
The key metric is the false-archive rate: important or informational mail
(labels needs_action, fyi) that was predicted as noise.
"""
import argparse
import json
from pathlib import Path

DATA = Path(__file__).parent / "data" / "synthetic_mailbox.jsonl"


def load():
    return [json.loads(line) for line in DATA.read_text(encoding="utf-8").splitlines() if line.strip()]


def rules_predict(r):
    from src.brain import quick_rule_filter
    return quick_rule_filter(r["sender"], r["subject"], r["body"], [], "") is not None


def llm_predict(r):
    from src.brain import CLASSIFICATION_PROMPT
    from src.llm_client import llm_client
    ctx = f"SENDER: {r['sender']}\nSUBJECT: {r['subject']}\nCONTENT: {r['body']}"
    a = llm_client.generate_structured(ctx, system=CLASSIFICATION_PROMPT)
    if not a:  # model failed: do not archive
        return False
    return (not a.get("requires_action", True)) and a.get("importance_score", 50) < 40


def score(rows, preds):
    noise = [(r, p) for r, p in zip(rows, preds) if r["label"] == "noise"]
    other = [(r, p) for r, p in zip(rows, preds) if r["label"] != "noise"]
    act = [(r, p) for r, p in zip(rows, preds) if r["label"] == "needs_action"]
    hard = [(r, p) for r, p in zip(rows, preds) if r["hard"]]
    tp = sum(p for _, p in noise)
    fp = sum(p for _, p in other)
    pct = lambda a, b: round(100 * a / b, 1) if b else 0.0
    return {
        "n": len(rows),
        "noise_recall_pct": pct(tp, len(noise)),
        "noise_precision_pct": pct(tp, tp + fp),
        "false_archive_pct": pct(fp, len(other)),
        "needs_action_lost_pct": pct(sum(p for _, p in act), len(act)),
        "hard_cases_archived_pct": pct(sum(p for _, p in hard), len(hard)),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", default="rules")
    ap.add_argument("--llm", action="store_true")
    ap.add_argument("--allow-cloud", action="store_true", help="allow Gemini if Ollama is down")
    args = ap.parse_args()
    rows = load()
    if args.llm:
        from src.llm_client import llm_client
        if not llm_client.local_available and not args.allow_cloud:
            raise SystemExit("Ollama is not reachable. Refusing to use a cloud model without --allow-cloud.")
        preds = [llm_predict(r) for r in rows]
    else:
        preds = [rules_predict(r) for r in rows]
    results = {
        "archive nothing (baseline)": score(rows, [False] * len(rows)),
        args.name: score(rows, preds),
    }
    cols = list(next(iter(results.values())).keys())
    lines = ["| system | " + " | ".join(cols) + " |", "|---|" + "---|" * len(cols)]
    for k, v in results.items():
        lines.append(f"| {k} | " + " | ".join(str(v[c]) for c in cols) + " |")
    text = "\n".join(lines)
    print(text)
    out = Path(__file__).parent / "results"
    out.mkdir(exist_ok=True)
    (out / f"{args.name}.md").write_text(text + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

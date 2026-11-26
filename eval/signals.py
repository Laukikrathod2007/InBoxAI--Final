"""How well does each Gmail signal predict 'noise' on the labelled real emails?

  python -m eval.signals

For each candidate rule, prints how much noise it would hide and how much
important mail (needs_action + fyi) it would wrongly hide. Counts only.
"""
import csv
import json
from pathlib import Path

D = Path(__file__).parent / "data"


def load():
    labels = {r["id"]: r["label"].strip().lower() for r in csv.DictReader(open(D / "real_labels.csv", encoding="utf-8-sig"))}
    meta = json.loads((D / "real_meta.json").read_text(encoding="utf-8"))
    return [(labels[i], m) for i, m in meta.items() if i in labels]


def cat(m, name):
    return f"CATEGORY_{name}" in m["labels"]


RULES = {
    "Promotions tab": lambda m: cat(m, "PROMOTIONS"),
    "Social tab": lambda m: cat(m, "SOCIAL"),
    "Updates tab": lambda m: cat(m, "UPDATES"),
    "Promotions or Social": lambda m: cat(m, "PROMOTIONS") or cat(m, "SOCIAL"),
    "List-Unsubscribe header": lambda m: m["has_list_unsubscribe"],
    "Promotions/Social + unsubscribe": lambda m: (cat(m, "PROMOTIONS") or cat(m, "SOCIAL")) and m["has_list_unsubscribe"],
    "Promotions/Social + unsubscribe + never wrote to sender":
        lambda m: (cat(m, "PROMOTIONS") or cat(m, "SOCIAL")) and m["has_list_unsubscribe"] and not m["user_wrote_to_sender"],
}


def main():
    rows = load()
    noise = sum(1 for l, _ in rows if l == "noise")
    other = len(rows) - noise
    print(f"{len(rows)} labelled emails: {noise} noise, {other} important or FYI")
    act = sum(1 for l, _ in rows if l == "needs_action")
    print(f"{'rule':52} noise hidden   important hidden   needs-action hidden")
    for name, rule in RULES.items():
        hit_noise = sum(1 for l, m in rows if l == "noise" and rule(m))
        hit_other = sum(1 for l, m in rows if l != "noise" and rule(m))
        hit_act = sum(1 for l, m in rows if l == "needs_action" and rule(m))
        print(f"{name:52} {hit_noise:2}/{noise} {100*hit_noise/noise:5.1f}%   {hit_other:2}/{other} {100*hit_other/other:5.1f}%"
              f"   {hit_act:2}/{act} {100*hit_act/act:5.1f}%")


if __name__ == "__main__":
    main()

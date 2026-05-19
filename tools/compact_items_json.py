# -*- coding: utf-8 -*-
"""Reescribe data/Items.json en formato compacto (una linea por elemento)."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ITEMS_PATH = ROOT / "data" / "Items.json"


def main():
    with ITEMS_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)
    lines = ["["]
    for i in range(len(data)):
        el = data[i]
        if el is None:
            line = "null"
        else:
            line = json.dumps(el, ensure_ascii=False, separators=(",", ":"))
        lines.append(line + ("," if i < len(data) - 1 else ""))
    lines.append("]")
    text = "\n".join(lines) + "\n"
    with ITEMS_PATH.open("w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("Compacted Items.json, length", len(data))


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""Genera items 121-189 (pesca: crudo, cocinado, quemado) y escribe Items.json."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ITEMS_PATH = ROOT / "data" / "Items.json"

# (nombre_base, categoria_nota, precio_crudo, hp_cocido, hp_quemado)
SMALL = [
    ("Pececillo plateado", "small_net", 3, 28, 6),
    ("Gobio de arroyo", "small_net", 3, 26, 6),
]
ROD = [
    ("Sardina de mar", "rod", 5, 35, 8),
    ("Arenque plateado", "rod", 5, 36, 8),
    ("Lubina comun", "rod", 8, 42, 9),
    ("Corvina gris", "rod", 9, 48, 9),
    ("Dorada costera", "rod", 10, 52, 10),
    ("Robalo del estuario", "rod", 11, 55, 10),
    ("Lucio del pantano", "rod", 12, 58, 10),
    ("Salmon rosa", "rod", 14, 65, 11),
    ("Perca gigante", "rod", 15, 68, 11),
    ("Siluro del fango", "rod", 16, 72, 12),
    ("Mero negro", "rod", 18, 78, 12),
    ("Carpa imperial", "rod", 20, 85, 13),
]
CRUST = [
    ("Cangrejo de rio", "trap", 10, 45, 9),
    ("Langosta espinosa", "trap", 18, 58, 10),
    ("Camaron de estuario", "trap", 8, 38, 8),
    ("Centollo joven", "trap", 22, 62, 11),
    ("Cangrejo ermitano", "trap", 9, 40, 8),
    ("Bogavante pequeno", "trap", 24, 68, 11),
]
HUGE = [
    ("Tiburon gris", "harpoon", 80, 120, 15),
    ("Orca (cria)", "harpoon", 120, 150, 18),
    ("Ballena piloto", "harpoon", 150, 180, 20),
]


def item_base(
    item_id,
    name,
    desc,
    price,
    consumable,
    effects,
    note,
):
    return {
        "id": item_id,
        "animationId": 0,
        "consumable": consumable,
        "damage": {
            "critical": False,
            "elementId": 0,
            "formula": "0",
            "type": 0,
            "variance": 20,
        },
        "description": desc,
        "effects": effects,
        "hitType": 0,
        "iconIndex": 0,
        "itypeId": 1,
        "name": name,
        "note": note,
        "occasion": 0,
        "price": price,
        "repeats": 1,
        "scope": 0,
        "speed": 0,
        "successRate": 100,
        "tpGain": 0,
    }


def triad(start_id, base_name, cat, p_raw, hp_ok, hp_burnt):
    if cat == "trap":
        d_raw = "Crustaceo fresco. Cocinalo en fuego o recetas."
    elif cat == "harpoon":
        d_raw = "Captura marina cruda. Cocinalo en fuego o recetas."
    else:
        d_raw = "Pescado crudo. Cocinalo en fuego o recetas."
    raw = item_base(
        start_id,
        base_name + " (crudo)",
        d_raw,
        p_raw,
        True,
        [],
        "<fish:raw><fish_cat:%s>" % cat,
    )
    cooked = item_base(
        start_id + 1,
        base_name + " (cocinado)",
        "Bien cocinado; recupera algo de vida.",
        p_raw + max(4, p_raw // 2),
        True,
        [{"code": 11, "dataId": 0, "value1": hp_ok, "value2": 0}],
        "<fish:cooked><fish_cat:%s>" % cat,
    )
    burnt = item_base(
        start_id + 2,
        base_name + " (quemado)",
        "Quedo carbonizado; apenas sirve como alimento.",
        max(1, p_raw // 4),
        True,
        [{"code": 11, "dataId": 0, "value1": hp_burnt, "value2": 0}],
        "<fish:burnt><fish_cat:%s>" % cat,
    )
    return [raw, cooked, burnt]


def main():
    blocks = []
    nid = 121
    for name, cat, pr, h1, h2 in SMALL:
        blocks.extend(triad(nid, name, cat, pr, h1, h2))
        nid += 3
    for name, cat, pr, h1, h2 in ROD:
        blocks.extend(triad(nid, name, cat, pr, h1, h2))
        nid += 3
    for name, cat, pr, h1, h2 in CRUST:
        blocks.extend(triad(nid, name, cat, pr, h1, h2))
        nid += 3
    for name, cat, pr, h1, h2 in HUGE:
        blocks.extend(triad(nid, name, cat, pr, h1, h2))
        nid += 3

    if nid - 1 != 189:
        raise SystemExit("expected last id 189, got %s" % (nid - 1))

    with ITEMS_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    for it in blocks:
        iid = it["id"]
        if iid >= len(data):
            raise SystemExit("Items.json too short for id %s" % iid)
        data[iid] = it

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

    print("Patched Items.json ids 121-189 (%s items), compact format." % len(blocks))


if __name__ == "__main__":
    main()

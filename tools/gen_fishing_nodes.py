# -*- coding: utf-8 -*-
"""Genera FishingFish.json (dificultad 1-5), FishingBanks.json (1-10) y snippet de nodos var 1003."""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CUSTOM = ROOT / "data" / "custom"

NET_TOOLS = list(range(140, 144))
ROD_TOOLS = list(range(144, 155))
TRAP_TOOLS = list(range(155, 158))
HARPOON_TOOLS = [158, 159]

# fish_id -> (nombre, output_id crudo, exp, dificultad 1-5, categoria)
FISH = [
    (1, "Pececillo plateado", 121, 8, 1, "small"),
    (2, "Gobio de arroyo", 124, 9, 1, "small"),
    (3, "Sardina de mar", 127, 11, 2, "medium"),
    (4, "Arenque plateado", 130, 12, 2, "medium"),
    (5, "Lubina comun", 133, 14, 2, "medium"),
    (6, "Corvina gris", 136, 15, 2, "medium"),
    (7, "Dorada costera", 139, 17, 2, "medium"),
    (8, "Robalo del estuario", 142, 18, 2, "medium"),
    (9, "Lucio del pantano", 145, 20, 3, "large"),
    (10, "Salmon rosa", 148, 22, 3, "large"),
    (11, "Perca gigante", 151, 24, 3, "large"),
    (12, "Siluro del fango", 154, 26, 3, "large"),
    (13, "Mero negro", 157, 28, 3, "large"),
    (14, "Carpa imperial", 160, 32, 3, "large"),
    (15, "Cangrejo de rio", 163, 20, 3, "trap"),
    (16, "Langosta espinosa", 166, 23, 3, "trap"),
    (17, "Camaron de estuario", 169, 19, 3, "trap"),
    (18, "Centollo joven", 172, 26, 3, "trap"),
    (19, "Cangrejo ermitano", 175, 18, 3, "trap"),
    (20, "Bogavante pequeno", 178, 27, 3, "trap"),
    (21, "Tiburon gris", 181, 55, 4, "huge"),
    (22, "Orca (cria)", 184, 85, 4, "huge"),
    (23, "Ballena piloto", 187, 100, 5, "huge"),
]

NODE_TYPES = {
    1: ["red"],
    2: ["red", "caña"],
    3: ["caña"],
    4: ["caña"],
    5: ["caña", "trampa"],
    6: ["caña", "trampa"],
    7: ["caña", "trampa"],
    8: ["caña", "trampa"],
    9: ["caña", "arpón"],
    10: ["caña", "arpón"],
}

NODE_NAMES = {
    1: "Charca poco profunda",
    2: "Orilla del rio",
    3: "Laguna tranquila",
    4: "Rio medio",
    5: "Estuario",
    6: "Costa rocosa",
    7: "Fango intermareal",
    8: "Bahia somera",
    9: "Mar abierto",
    10: "Aguas profundas",
}

CAT_FISH = {
    "small": [1, 2],
    "medium": list(range(3, 11)),
    "large": list(range(9, 15)),
    "trap": list(range(15, 21)),
    "huge": [21, 22, 23],
}

TYPE_CATS = {
    "red": ["small"],
    "caña": ["medium", "large"],
    "trampa": ["trap"],
    "arpón": ["huge"],
}

TYPE_TOOLS = {
    "red": NET_TOOLS,
    "caña": ROD_TOOLS,
    "trampa": TRAP_TOOLS,
    "arpón": HARPOON_TOOLS,
}


def fish_ids_for_node(n):
    types = NODE_TYPES[n]
    ids = []
    for t in types:
        for cat in TYPE_CATS[t]:
            for fid in CAT_FISH[cat]:
                if fid not in ids:
                    ids.append(fid)
    # Nodos altos: priorizar peces mas dificiles dentro de caña
    if n >= 7 and "caña" in types:
        ids = [f for f in ids if f >= 7 or f in CAT_FISH["trap"] or f in CAT_FISH["huge"]]
    if n <= 2 and "caña" in types:
        ids = [f for f in ids if f <= 8 or f in CAT_FISH["small"]]
    return sorted(ids)


def tools_for_fish(fid, node_types):
    f = next(x for x in FISH if x[0] == fid)
    cat = f[5]
    out = []
    if cat == "small" and "red" in node_types:
        out = NET_TOOLS
    elif cat in ("medium", "large") and "caña" in node_types:
        out = ROD_TOOLS
    elif cat == "trap" and "trampa" in node_types:
        out = TRAP_TOOLS
    elif cat == "huge" and "arpón" in node_types:
        out = HARPOON_TOOLS
    return list(out)


def build_fish_json():
    rows = [None]
    for fid, name, oid, exp, diff, _ in FISH:
        rows.append({
            "fish_id": fid,
            "name": name,
            "output_type": "item",
            "output_id": oid,
            "output_count": 1,
            "difficulty": diff,
            "exp": exp,
        })
    return rows


def build_banks():
    banks = [None]
    for n in range(1, 11):
        types = NODE_TYPES[n]
        fids = fish_ids_for_node(n)
        fish_entries = []
        for fid in fids:
            f = next(x for x in FISH if x[0] == fid)
            tool_ids = tools_for_fish(fid, types)
            tool_lvl = min(10, max(1, n if fid <= 14 else n + 1))
            if fid >= 21:
                tool_lvl = max(5, n - 2)
            fish_entries.append({
                "fish_id": fid,
                "count": 12,
                "weight": 10 + f[4],
                "tool_lvl": tool_lvl,
                "required_tool_ids": tool_ids,
            })
        banks.append({
            "bank_id": n,
            "name": NODE_NAMES[n],
            "node_lvl": n,
            "types": types,
            "fish": fish_entries,
        })
    return banks


def build_node_table(seed=42):
    random.seed(seed)
    table = {}
    for n in range(1, 11):
        mx = random.randint(1, 12)
        table[n] = {
            "node_lvl": n,
            "types": NODE_TYPES[n],
            "type": NODE_TYPES[n][0] if len(NODE_TYPES[n]) == 1 else NODE_TYPES[n][-1],
            "max_fish": mx,
            "fish_left": mx,
            "active": 1,
            "bank_id": n,
            "tool_lvl": n,
        }
    return table


def main():
    fish = build_fish_json()
    banks = build_banks()
    nodes = build_node_table()

    with (CUSTOM / "FishingFish.json").open("w", encoding="utf-8", newline="\n") as f:
        json.dump(fish, f, ensure_ascii=False, indent=2)
        f.write("\n")

    with (CUSTOM / "FishingBanks.json").open("w", encoding="utf-8", newline="\n") as f:
        json.dump(banks, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print("FishingFish.json + FishingBanks.json written.")
    print("Sample node table (var 1003) - use in SkillPesca buildFishingNodeTable1003:")
    print(json.dumps(nodes, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

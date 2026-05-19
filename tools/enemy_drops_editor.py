#!/usr/bin/env python3
import json
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "custom" / "EnemyDrops.json"
RECIPES_PATH = PROJECT_ROOT / "data" / "custom" / "Recipes.json"
RECIPES_TYPE_PATH = PROJECT_ROOT / "data" / "custom" / "RecipesType.json"
ENEMIES_PATH = PROJECT_ROOT / "data" / "Enemies.json"
ITEMS_PATH = PROJECT_ROOT / "data" / "Items.json"
WEAPONS_PATH = PROJECT_ROOT / "data" / "Weapons.json"
ARMORS_PATH = PROJECT_ROOT / "data" / "Armors.json"


def ensure_data_file() -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not DATA_PATH.exists():
        initial = {"config": {"min_enemy_id": 1, "max_enemy_id": 1}, "enemies": []}
        DATA_PATH.write_text(json.dumps(initial, indent=2, ensure_ascii=False), encoding="utf-8")
    if not RECIPES_PATH.exists():
        recipes_initial = {"recipes": []}
        RECIPES_PATH.write_text(json.dumps(recipes_initial, indent=2, ensure_ascii=False), encoding="utf-8")
    if not RECIPES_TYPE_PATH.exists():
        default_types = [None, "inventario", "mesa crafteo", "forja", "yunque"]
        RECIPES_TYPE_PATH.write_text(json.dumps(default_types, indent=2, ensure_ascii=False), encoding="utf-8")


def load_recipe_types_from_file() -> list:
    """Lista de strings válidos para recipe_type (RecipesType.json: arreglo, ignora null)."""
    if not RECIPES_TYPE_PATH.exists():
        return ["inventario", "mesa crafteo", "forja", "yunque"]
    try:
        data = json.loads(RECIPES_TYPE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return ["inventario"]
    if not isinstance(data, list):
        return ["inventario"]
    out = []
    for x in data:
        if x is None:
            continue
        if isinstance(x, str) and x.strip():
            out.append(x.strip())
    return out if out else ["inventario"]


class DropPickerDialog(tk.Toplevel):
    def __init__(self, parent, db, initial_drop=None):
        super().__init__(parent)
        self.title("Objeto a obtener")
        self.resizable(False, False)
        self.transient(parent)
        self.grab_set()

        self.db = db
        self.selected = None

        initial_drop = initial_drop or {}
        initial_type = initial_drop.get("type", "item")
        initial_id = int(initial_drop.get("data_id", 0) or 0)

        frame = ttk.LabelFrame(self, text="Objeto a obtener", padding=10)
        frame.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        frame.columnconfigure(1, weight=1)

        self.kind_var = tk.StringVar(value=initial_type)
        self.filter_var = tk.StringVar()
        self.filtered_db = {"item": [], "weapon": [], "armor": []}

        ttk.Label(frame, text="Filtrar").grid(row=0, column=2, padx=(10, 4), sticky="w")
        filter_entry = ttk.Entry(frame, textvariable=self.filter_var, width=24)
        filter_entry.grid(row=0, column=3, sticky="ew", pady=4)
        filter_entry.bind("<KeyRelease>", lambda _e: self.refresh_kind_state())

        self.kind_rows = {}
        self.kind_combos = {}
        kind_defs = [("item", "Objeto"), ("weapon", "Arma"), ("armor", "Armadura")]

        for offset, (kind_key, label) in enumerate(kind_defs):
            row = offset + 1
            rb = ttk.Radiobutton(
                frame,
                text=label,
                value=kind_key,
                variable=self.kind_var,
                command=self.refresh_kind_state,
            )
            rb.grid(row=row, column=0, sticky="w", pady=4)
            combo = ttk.Combobox(frame, state="readonly", width=38)
            combo.grid(row=row, column=1, sticky="ew", padx=(8, 0), pady=4)
            self.kind_combos[kind_key] = combo
            self.kind_rows[kind_key] = row

        btns = ttk.Frame(self)
        btns.grid(row=1, column=0, sticky="e", padx=10, pady=(0, 10))
        ttk.Button(btns, text="Aceptar", command=self.accept).grid(row=0, column=0, padx=(0, 6))
        ttk.Button(btns, text="Cancelar", command=self.cancel).grid(row=0, column=1)

        self.refresh_kind_state()
        if initial_id > 0:
            self._select_initial_value(initial_type, initial_id)
        self.wait_window(self)

    def _select_initial_value(self, kind_key, data_id):
        items = self.filtered_db.get(kind_key, [])
        for i, it in enumerate(items):
            if it["id"] == data_id:
                self.kind_combos[kind_key].current(i)
                break

    def refresh_kind_state(self):
        needle = self.filter_var.get().strip().lower()
        for kind_key in ("item", "weapon", "armor"):
            base_items = self.db.get(kind_key, [])
            if needle:
                filtered = [
                    x for x in base_items if needle in x["name"].lower() or needle in str(x["id"])
                ]
            else:
                filtered = list(base_items)
            self.filtered_db[kind_key] = filtered
            combo = self.kind_combos[kind_key]
            combo["values"] = [f"[{x['id']}] {x['name']}" for x in filtered]
            if filtered:
                combo.current(0)

        selected_kind = self.kind_var.get()
        for kind_key, combo in self.kind_combos.items():
            combo.configure(state="readonly" if kind_key == selected_kind else "disabled")

    def accept(self):
        kind = self.kind_var.get()
        combo = self.kind_combos[kind]
        idx = combo.current()
        if idx < 0:
            messagebox.showwarning("Atención", "Selecciona un registro.", parent=self)
            return
        filtered = self.filtered_db.get(kind, [])
        if idx >= len(filtered):
            messagebox.showwarning("Atención", "Selecciona un registro válido.", parent=self)
            return
        entry = filtered[idx]
        self.selected = {"type": kind, "data_id": int(entry["id"]), "name": entry["name"]}
        self.destroy()

    def cancel(self):
        self.selected = None
        self.destroy()


class EnemyDropsEditor(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Editor de Enemigos y Drops")
        self.geometry("1240x700")
        self.minsize(1080, 620)

        self.data = {"config": {"min_enemy_id": 1, "max_enemy_id": 1}, "enemies": []}
        self.recipes_data = {"recipes": []}
        self.selected_enemy_index = None
        self.enemy_image_ref = None
        self.db = {"item": [], "weapon": [], "armor": []}
        self.current_drop_pick = None
        self.current_recipe_output_pick = None
        self.current_recipe_material_pick = None
        self._chance_sync_lock = False
        self.recipe_types_list: list = load_recipe_types_from_file()
        self.recipe_filter_enabled_var = tk.BooleanVar(value=False)
        self.recipe_filter_type_var = tk.StringVar(value="(todos)")
        self.recipe_filter_skill_var = tk.StringVar(value="(todos)")
        self._recipe_view_indices = []

        self._build_ui()
        self.load_game_databases()
        self.load_data()
        self.load_recipes_data()

    def _build_ui(self) -> None:
        self.columnconfigure(0, weight=1)
        self.rowconfigure(0, weight=1)

        notebook = ttk.Notebook(self)
        notebook.grid(row=0, column=0, sticky="nsew")

        tab_drops = ttk.Frame(notebook)
        tab_recipes = ttk.Frame(notebook)
        notebook.add(tab_drops, text="Enemy Drops")
        notebook.add(tab_recipes, text="Recetas")

        container = ttk.Frame(tab_drops, padding=8)
        container.grid(sticky="nsew")
        container.columnconfigure(0, weight=0)
        container.columnconfigure(1, weight=1)
        container.rowconfigure(0, weight=1)

        left = ttk.LabelFrame(container, text="Enemigos", padding=8)
        left.grid(row=0, column=0, sticky="nsw", padx=(0, 8))
        left.columnconfigure(0, weight=1)
        left.rowconfigure(2, weight=1)

        nav = ttk.Frame(left)
        nav.grid(row=0, column=0, sticky="ew")
        ttk.Button(nav, text="|<", width=4, command=lambda: self.select_enemy_at(0)).grid(row=0, column=0, padx=(0, 2))
        ttk.Button(nav, text="<", width=4, command=self.select_prev_enemy).grid(row=0, column=1, padx=2)
        ttk.Button(nav, text=">", width=4, command=self.select_next_enemy).grid(row=0, column=2, padx=2)
        ttk.Button(nav, text=">|", width=4, command=self.select_last_enemy).grid(row=0, column=3, padx=2)
        ttk.Label(nav, text="Ir ID").grid(row=0, column=4, padx=(8, 2))
        self.goto_id_var = tk.StringVar()
        ttk.Entry(nav, textvariable=self.goto_id_var, width=8).grid(row=0, column=5, padx=(0, 4))
        ttk.Button(nav, text="Ir", width=4, command=self.goto_enemy_id).grid(row=0, column=6)

        list_wrap = ttk.Frame(left)
        list_wrap.grid(row=2, column=0, sticky="nsew", pady=(8, 0))
        list_wrap.columnconfigure(0, weight=1)
        list_wrap.rowconfigure(0, weight=1)
        self.enemy_listbox = tk.Listbox(list_wrap, width=40, exportselection=False)
        self.enemy_listbox.grid(row=0, column=0, sticky="nsew")
        scrollbar = ttk.Scrollbar(list_wrap, orient="vertical", command=self.enemy_listbox.yview)
        scrollbar.grid(row=0, column=1, sticky="ns")
        self.enemy_listbox.configure(yscrollcommand=scrollbar.set)
        self.enemy_listbox.bind("<<ListboxSelect>>", self.on_enemy_selected)

        range_box = ttk.LabelFrame(left, text="Rango IDs", padding=8)
        range_box.grid(row=3, column=0, sticky="ew", pady=(8, 0))
        ttk.Label(range_box, text="Min").grid(row=0, column=0, padx=(0, 4))
        self.min_enemy_var = tk.StringVar(value="1")
        ttk.Entry(range_box, textvariable=self.min_enemy_var, width=8).grid(row=0, column=1, padx=(0, 8))
        ttk.Label(range_box, text="Max").grid(row=0, column=2, padx=(0, 4))
        self.max_enemy_var = tk.StringVar(value="1")
        ttk.Entry(range_box, textvariable=self.max_enemy_var, width=10).grid(row=0, column=3, padx=(0, 8))
        ttk.Button(range_box, text="Aplicar", command=self.apply_enemy_range).grid(row=0, column=4)

        self.btn_sync_enemies = ttk.Button(left, text="Sincronizar Enemies.json", command=self.sync_from_enemies_file)
        self.btn_sync_enemies.grid(row=4, column=0, sticky="ew", pady=(8, 0))

        right = ttk.Frame(container)
        right.grid(row=0, column=1, sticky="nsew")
        right.columnconfigure(0, weight=1)
        right.rowconfigure(1, weight=1)

        info = ttk.LabelFrame(right, text="Datos del enemigo", padding=8)
        info.grid(row=0, column=0, sticky="ew")
        info.columnconfigure(1, weight=1)
        info.columnconfigure(2, weight=0)

        ttk.Label(info, text="ID:").grid(row=0, column=0, sticky="w")
        self.enemy_id_var = tk.StringVar()
        ttk.Entry(info, textvariable=self.enemy_id_var, width=12, state="readonly").grid(row=0, column=1, sticky="w")
        ttk.Label(info, text="Nombre:").grid(row=1, column=0, sticky="w")
        self.enemy_name_var = tk.StringVar()
        ttk.Entry(info, textvariable=self.enemy_name_var, state="readonly").grid(row=1, column=1, sticky="ew")
        self.enemy_pos_var = tk.StringVar(value="0/0")
        ttk.Label(info, textvariable=self.enemy_pos_var).grid(row=0, column=2, sticky="e", padx=(8, 0))

        self.enemy_image_label = ttk.Label(info, text="Sin imagen", anchor="center", width=20)
        self.enemy_image_label.grid(row=0, column=3, rowspan=2, padx=(12, 0))

        drops_box = ttk.LabelFrame(right, text="Drops (ilimitados)", padding=8)
        drops_box.grid(row=1, column=0, sticky="nsew", pady=(8, 0))
        drops_box.columnconfigure(0, weight=1)
        drops_box.rowconfigure(0, weight=1)

        columns = ("type", "data_id", "name", "min", "max", "chance", "condition")
        self.drops_tree = ttk.Treeview(drops_box, columns=columns, show="headings", height=14)
        self.drops_tree.grid(row=0, column=0, columnspan=8, sticky="nsew")
        self.drops_tree.heading("type", text="Tipo")
        self.drops_tree.heading("data_id", text="ID")
        self.drops_tree.heading("name", text="Objeto")
        self.drops_tree.heading("min", text="Min")
        self.drops_tree.heading("max", text="Max")
        self.drops_tree.heading("chance", text="Prob.")
        self.drops_tree.heading("condition", text="Condición")
        self.drops_tree.column("type", width=75, anchor="center")
        self.drops_tree.column("data_id", width=70, anchor="center")
        self.drops_tree.column("name", width=250)
        self.drops_tree.column("min", width=55, anchor="center")
        self.drops_tree.column("max", width=55, anchor="center")
        self.drops_tree.column("chance", width=130, anchor="center")
        self.drops_tree.column("condition", width=250)
        self.drops_tree.bind("<<TreeviewSelect>>", self.on_drop_selected)

        row = 1
        ttk.Label(drops_box, text="Objeto").grid(row=row, column=0, sticky="w", pady=(8, 0))
        self.drop_selected_var = tk.StringVar(value="(sin seleccionar)")
        ttk.Entry(drops_box, textvariable=self.drop_selected_var, state="readonly", width=40).grid(
            row=row, column=1, columnspan=3, sticky="ew", pady=(8, 0), padx=(0, 8)
        )
        ttk.Button(drops_box, text="Seleccionar...", command=self.select_drop_item).grid(row=row, column=4, sticky="w", pady=(8, 0))

        ttk.Label(drops_box, text="Min").grid(row=row, column=5, sticky="w", pady=(8, 0))
        self.drop_min_var = tk.StringVar(value="1")
        ttk.Entry(drops_box, textvariable=self.drop_min_var, width=6).grid(row=row, column=6, sticky="w", pady=(8, 0))
        ttk.Label(drops_box, text="Max").grid(row=row, column=7, sticky="w", pady=(8, 0))
        self.drop_max_var = tk.StringVar(value="1")
        ttk.Entry(drops_box, textvariable=self.drop_max_var, width=6).grid(row=row, column=8, sticky="w", pady=(8, 0))

        row = 2
        ttk.Label(drops_box, text="Chance (0-10000000)").grid(row=row, column=0, sticky="w", pady=(6, 0))
        self.drop_chance_raw_var = tk.StringVar(value="10000000")
        ttk.Entry(drops_box, textvariable=self.drop_chance_raw_var, width=14).grid(row=row, column=1, sticky="w", pady=(6, 0))
        ttk.Label(drops_box, text="% (1-100)").grid(row=row, column=2, sticky="w", pady=(6, 0))
        self.drop_chance_pct_var = tk.StringVar(value="100")
        ttk.Entry(drops_box, textvariable=self.drop_chance_pct_var, width=8).grid(row=row, column=3, sticky="w", pady=(6, 0), padx=(0, 8))
        ttk.Label(drops_box, text="Condición").grid(row=row, column=4, sticky="w", pady=(6, 0))
        self.drop_condition_var = tk.StringVar(value="None")
        self.drop_condition_combo = ttk.Combobox(
            drops_box,
            textvariable=self.drop_condition_var,
            state="readonly",
            values=["None", "Slayer", "Butchering", "Quest"],
            width=20,
        )
        self.drop_condition_combo.grid(row=row, column=4, columnspan=2, sticky="w", pady=(6, 0), padx=(0, 8))

        self.btn_add_drop = ttk.Button(drops_box, text="+ Drop", command=self.add_drop)
        self.btn_add_drop.grid(row=row, column=6, sticky="ew", pady=(6, 0), padx=(0, 6))
        self.btn_update_drop = ttk.Button(drops_box, text="Editar drop", command=self.update_drop)
        self.btn_update_drop.grid(row=row, column=7, sticky="ew", pady=(6, 0), padx=(0, 6))
        self.btn_remove_drop = ttk.Button(drops_box, text="- Drop", command=self.remove_drop)
        self.btn_remove_drop.grid(row=row, column=8, sticky="ew", pady=(6, 0))

        self.drop_chance_raw_var.trace_add("write", self._on_chance_raw_changed)
        self.drop_chance_pct_var.trace_add("write", self._on_chance_pct_changed)

        footer = ttk.Frame(right)
        footer.grid(row=2, column=0, sticky="ew", pady=(8, 0))
        footer.columnconfigure(1, weight=1)
        ttk.Button(footer, text="Recargar", command=self.load_data).grid(row=0, column=0, sticky="w")
        self.source_var = tk.StringVar(value="Sin sincronizar")
        ttk.Label(footer, textvariable=self.source_var).grid(row=0, column=1, sticky="w", padx=(10, 0))
        ttk.Button(footer, text="Guardar JSON", command=self.save_data).grid(row=0, column=2, sticky="e")

        self._build_recipes_tab(tab_recipes)

    def _build_recipes_tab(self, parent) -> None:
        parent.columnconfigure(0, weight=0)
        parent.columnconfigure(1, weight=1)
        parent.rowconfigure(0, weight=1)

        left = ttk.LabelFrame(parent, text="Recetas", padding=8)
        left.grid(row=0, column=0, sticky="nsw", padx=(8, 8), pady=8)
        left.columnconfigure(0, weight=1)
        left.rowconfigure(1, weight=1)

        recipe_filters = ttk.Frame(left)
        recipe_filters.grid(row=0, column=0, sticky="ew")
        recipe_filters.columnconfigure(4, weight=1)
        ttk.Checkbutton(
            recipe_filters,
            text="Filtro (switch)",
            variable=self.recipe_filter_enabled_var,
            command=self._on_recipe_filter_changed,
        ).grid(row=0, column=0, sticky="w", padx=(0, 8))
        ttk.Label(recipe_filters, text="Tipo").grid(row=0, column=1, sticky="w")
        self.recipe_filter_type_combo = ttk.Combobox(
            recipe_filters,
            state="readonly",
            textvariable=self.recipe_filter_type_var,
            width=13,
            values=["(todos)"] + [str(x) for x in self.recipe_types_list],
        )
        self.recipe_filter_type_combo.grid(row=0, column=2, sticky="w", padx=(4, 8))
        self.recipe_filter_type_combo.bind("<<ComboboxSelected>>", self._on_recipe_filter_changed)
        ttk.Label(recipe_filters, text="Skill").grid(row=0, column=3, sticky="w")
        self.recipe_filter_skill_combo = ttk.Combobox(
            recipe_filters,
            state="readonly",
            textvariable=self.recipe_filter_skill_var,
            width=10,
            values=["(todos)"],
        )
        self.recipe_filter_skill_combo.grid(row=0, column=4, sticky="w", padx=(4, 0))
        self.recipe_filter_skill_combo.bind("<<ComboboxSelected>>", self._on_recipe_filter_changed)
        self.recipe_filter_type_combo.set("(todos)")
        self.recipe_filter_skill_combo.set("(todos)")

        self.recipe_listbox = tk.Listbox(left, width=46, exportselection=False)
        self.recipe_listbox.grid(row=1, column=0, sticky="nsew", pady=(8, 0))
        self.recipe_listbox.bind("<<ListboxSelect>>", self.on_recipe_selected)

        recipe_left_btns = ttk.Frame(left)
        recipe_left_btns.grid(row=2, column=0, sticky="ew", pady=(8, 0))
        ttk.Button(recipe_left_btns, text="+ Receta", command=self.add_recipe).grid(row=0, column=0, padx=(0, 6))
        ttk.Button(recipe_left_btns, text="Editar receta", command=self.update_recipe).grid(row=0, column=1, padx=(0, 6))
        ttk.Button(recipe_left_btns, text="- Receta", command=self.remove_recipe).grid(row=0, column=2)

        right = ttk.Frame(parent, padding=8)
        right.grid(row=0, column=1, sticky="nsew")
        right.columnconfigure(0, weight=1)
        right.rowconfigure(1, weight=1)

        info = ttk.LabelFrame(right, text="Datos de receta", padding=8)
        info.grid(row=0, column=0, sticky="ew")
        info.columnconfigure(1, weight=1)

        ttk.Label(info, text="Recipe ID").grid(row=0, column=0, sticky="w")
        self.recipe_id_var = tk.StringVar(value="1")
        ttk.Entry(info, textvariable=self.recipe_id_var, width=10, state="readonly").grid(row=0, column=1, sticky="w")

        ttk.Label(info, text="Nombre").grid(row=1, column=0, sticky="w")
        self.recipe_name_var = tk.StringVar()
        ttk.Entry(info, textvariable=self.recipe_name_var, state="readonly").grid(row=1, column=1, sticky="ew")

        ttk.Label(info, text="Output").grid(row=2, column=0, sticky="w")
        self.recipe_output_var = tk.StringVar(value="(sin seleccionar)")
        ttk.Entry(info, textvariable=self.recipe_output_var, state="readonly").grid(row=2, column=1, sticky="ew", padx=(0, 6))
        ttk.Button(info, text="Seleccionar...", command=self.select_recipe_output).grid(row=2, column=2, sticky="w")

        ttk.Label(info, text="Chance (1-100)").grid(row=3, column=0, sticky="w")
        self.recipe_chance_var = tk.StringVar(value="100")
        ttk.Entry(info, textvariable=self.recipe_chance_var, width=10).grid(row=3, column=1, sticky="w")
        self.recipe_chance_var.trace_add("write", lambda *_args: self._recompute_recipe_name())

        ttk.Label(info, text="Output count").grid(row=4, column=0, sticky="w")
        self.recipe_output_count_var = tk.StringVar(value="1")
        ttk.Entry(info, textvariable=self.recipe_output_count_var, width=10).grid(row=4, column=1, sticky="w")

        ttk.Label(info, text="EXP (por craft)").grid(row=5, column=0, sticky="w")
        self.recipe_exp_var = tk.StringVar(value="0")
        ttk.Entry(info, textvariable=self.recipe_exp_var, width=10).grid(row=5, column=1, sticky="w")

        ttk.Label(info, text="skill_id").grid(row=6, column=0, sticky="w")
        self.recipe_skill_id_var = tk.StringVar(value="5")
        ttk.Entry(info, textvariable=self.recipe_skill_id_var, width=10).grid(row=6, column=1, sticky="w")

        ttk.Label(info, text="nivel (req)").grid(row=7, column=0, sticky="w")
        self.recipe_level_var = tk.StringVar(value="1")
        ttk.Entry(info, textvariable=self.recipe_level_var, width=10).grid(row=7, column=1, sticky="w")

        ttk.Label(info, text="Tipo (recipe_type)").grid(row=8, column=0, sticky="w")
        self.recipe_type_combo = ttk.Combobox(
            info,
            state="readonly",
            width=26,
            values=tuple(self.recipe_types_list),
        )
        self.recipe_type_combo.grid(row=8, column=1, columnspan=2, sticky="w", pady=(2, 0))
        if self.recipe_types_list:
            self.recipe_type_combo.set(self.recipe_types_list[0])

        self.recipe_has_been_learned_var = tk.BooleanVar(value=False)
        ttk.Checkbutton(
            info,
            text="has_been_learned (requiere aprender receta-item)",
            variable=self.recipe_has_been_learned_var,
        ).grid(row=9, column=0, columnspan=3, sticky="w", pady=(4, 0))

        mats = ttk.LabelFrame(right, text="Materiales de entrada", padding=8)
        mats.grid(row=1, column=0, sticky="nsew", pady=(8, 0))
        mats.columnconfigure(0, weight=1)
        mats.rowconfigure(0, weight=1)

        mat_cols = ("type", "data_id", "name", "count")
        self.recipe_materials_tree = ttk.Treeview(mats, columns=mat_cols, show="headings", height=12)
        self.recipe_materials_tree.grid(row=0, column=0, columnspan=5, sticky="nsew")
        self.recipe_materials_tree.heading("type", text="Tipo")
        self.recipe_materials_tree.heading("data_id", text="ID")
        self.recipe_materials_tree.heading("name", text="Nombre")
        self.recipe_materials_tree.heading("count", text="Cantidad")
        self.recipe_materials_tree.column("type", width=80, anchor="center")
        self.recipe_materials_tree.column("data_id", width=70, anchor="center")
        self.recipe_materials_tree.column("name", width=320)
        self.recipe_materials_tree.column("count", width=90, anchor="center")
        self.recipe_materials_tree.bind("<<TreeviewSelect>>", self.on_recipe_material_selected)

        ttk.Label(mats, text="Material").grid(row=1, column=0, sticky="w", pady=(8, 0))
        self.recipe_material_var = tk.StringVar(value="(sin seleccionar)")
        ttk.Entry(mats, textvariable=self.recipe_material_var, state="readonly", width=46).grid(
            row=1, column=1, columnspan=2, sticky="ew", pady=(8, 0), padx=(0, 6)
        )
        ttk.Button(mats, text="Seleccionar...", command=self.select_recipe_material).grid(row=1, column=3, sticky="w", pady=(8, 0))
        ttk.Label(mats, text="Count").grid(row=1, column=4, sticky="e", pady=(8, 0))
        self.recipe_material_count_var = tk.StringVar(value="1")
        ttk.Entry(mats, textvariable=self.recipe_material_count_var, width=8).grid(row=1, column=5, sticky="w", pady=(8, 0), padx=(4, 0))

        mat_btns = ttk.Frame(mats)
        mat_btns.grid(row=2, column=0, columnspan=6, sticky="e", pady=(8, 0))
        ttk.Button(mat_btns, text="+ Material", command=self.add_recipe_material).grid(row=0, column=0, padx=(0, 6))
        ttk.Button(mat_btns, text="Editar material", command=self.update_recipe_material).grid(row=0, column=1, padx=(0, 6))
        ttk.Button(mat_btns, text="- Material", command=self.remove_recipe_material).grid(row=0, column=2)

        footer = ttk.Frame(right)
        footer.grid(row=2, column=0, sticky="ew", pady=(8, 0))
        footer.columnconfigure(0, weight=1)
        ttk.Button(footer, text="Recargar recetas", command=self.load_recipes_data).grid(row=0, column=0, sticky="w")
        ttk.Button(footer, text="Guardar Recipes.json", command=self.save_recipes_data).grid(row=0, column=1, sticky="e")

    def load_game_databases(self):
        self.db["item"] = self._load_simple_database(ITEMS_PATH)
        self.db["weapon"] = self._load_simple_database(WEAPONS_PATH)
        self.db["armor"] = self._load_simple_database(ARMORS_PATH)

    def _load_simple_database(self, path: Path):
        if not path.exists():
            return []
        try:
            parsed = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return []
        if not isinstance(parsed, list):
            return []
        out = []
        for row in parsed:
            if isinstance(row, dict):
                row_id = row.get("id")
                name = row.get("name")
                if isinstance(row_id, int) and row_id > 0 and isinstance(name, str):
                    out.append({"id": row_id, "name": name})
        return out

    def load_data(self) -> None:
        try:
            parsed = json.loads(DATA_PATH.read_text(encoding="utf-8"))
            if not isinstance(parsed, dict):
                raise ValueError("El JSON raíz debe ser un objeto.")
            config = parsed.get("config", {})
            min_id = int(config.get("min_enemy_id", 1))
            max_id = int(config.get("max_enemy_id", max(min_id, 1)))
            self.data = {
                "config": {"min_enemy_id": max(1, min_id), "max_enemy_id": max(max_id, max(1, min_id))},
                "enemies": parsed.get("enemies", []),
            }
            self.sync_from_enemies_file(show_feedback=False)
            self.refresh_enemy_list()
            self.clear_enemy_detail()
            self.clear_drop_form()
            if self.data["enemies"]:
                self.select_enemy_at(0)
        except Exception as exc:
            messagebox.showerror("Error", f"No se pudo cargar {DATA_PATH.name}:\n{exc}")

    def save_data(self) -> None:
        try:
            text = json.dumps(self.data, indent=2, ensure_ascii=False)
            DATA_PATH.write_text(text, encoding="utf-8")
            messagebox.showinfo("Guardado", f"Archivo guardado en:\n{DATA_PATH}")
        except Exception as exc:
            messagebox.showerror("Error", f"No se pudo guardar:\n{exc}")

    def load_recipes_data(self) -> None:
        try:
            self.recipe_types_list = load_recipe_types_from_file()
            if hasattr(self, "recipe_type_combo"):
                self.recipe_type_combo.configure(values=tuple(self.recipe_types_list))
                if self.recipe_types_list and not self.recipe_type_combo.get():
                    self.recipe_type_combo.set(self.recipe_types_list[0])
            parsed = json.loads(RECIPES_PATH.read_text(encoding="utf-8"))
            if not isinstance(parsed, dict):
                raise ValueError("Recipes.json raíz debe ser objeto.")
            recipes = parsed.get("recipes", [])
            if not isinstance(recipes, list):
                raise ValueError("'recipes' debe ser arreglo.")
            self.recipes_data = {"recipes": recipes}
            self._refresh_recipe_filter_options()
            self.refresh_recipes_list()
            self.clear_recipe_form()
            if recipes:
                self.select_recipe_at(0)
        except Exception as exc:
            messagebox.showerror("Error", f"No se pudo cargar {RECIPES_PATH.name}:\n{exc}")

    def _refresh_recipe_filter_options(self):
        """Actualiza combos de filtro (tipo y skill) con datos actuales."""
        if hasattr(self, "recipe_filter_type_combo"):
            type_values = ["(todos)"] + [str(x) for x in self.recipe_types_list]
            self.recipe_filter_type_combo.configure(values=type_values)
            cur_t = str(self.recipe_filter_type_var.get() or "(todos)")
            if cur_t not in type_values:
                self.recipe_filter_type_var.set("(todos)")
        if hasattr(self, "recipe_filter_skill_combo"):
            skills = set()
            for rec in self.recipes_data.get("recipes", []):
                sid = rec.get("skill_id")
                if sid is None:
                    continue
                try:
                    skills.add(str(int(sid)))
                except Exception:
                    continue
            skill_values = ["(todos)"] + sorted(skills, key=lambda s: int(s))
            self.recipe_filter_skill_combo.configure(values=skill_values)
            cur_s = str(self.recipe_filter_skill_var.get() or "(todos)")
            if cur_s not in skill_values:
                self.recipe_filter_skill_var.set("(todos)")

    def _on_recipe_filter_changed(self, _event=None):
        self.refresh_recipes_list()

    def _recipe_passes_filters(self, rec) -> bool:
        if not self.recipe_filter_enabled_var.get():
            return True
        f_type = str(self.recipe_filter_type_var.get() or "(todos)").strip().lower()
        f_skill = str(self.recipe_filter_skill_var.get() or "(todos)").strip()
        if f_type != "(todos)":
            rt = str(rec.get("recipe_type", "") or "").strip().lower()
            if rt != f_type:
                return False
        if f_skill != "(todos)":
            try:
                sid = str(int(rec.get("skill_id", -1)))
            except Exception:
                return False
            if sid != f_skill:
                return False
        return True

    def _recipe_type_combo_values_with_extra(self, extra=None) -> tuple:
        base = list(self.recipe_types_list)
        ex = (extra or "").strip().lower()
        if ex and ex not in base:
            return tuple([ex] + base)
        return tuple(base)

    def _apply_recipe_type_to_combo(self, recipe_type_raw) -> None:
        """Ajusta values del combo y selección; si el JSON trae un tipo fuera de RecipesType.json, se muestra igual."""
        if not hasattr(self, "recipe_type_combo"):
            return
        rt = str(recipe_type_raw or "").strip().lower()
        vals = self._recipe_type_combo_values_with_extra(rt if rt else None)
        self.recipe_type_combo.configure(values=vals)
        if rt and rt in vals:
            self.recipe_type_combo.set(rt)
        elif self.recipe_types_list:
            self.recipe_type_combo.set(self.recipe_types_list[0])
        elif vals:
            self.recipe_type_combo.set(vals[0])

    def save_recipes_data(self) -> None:
        try:
            if self.get_selected_recipe_index() is not None:
                if not self._persist_selected_recipe_from_form():
                    return
            text = json.dumps(self.recipes_data, indent=2, ensure_ascii=False)
            RECIPES_PATH.write_text(text, encoding="utf-8")
            messagebox.showinfo("Guardado", f"Archivo guardado en:\n{RECIPES_PATH}")
        except Exception as exc:
            messagebox.showerror("Error", f"No se pudo guardar:\n{exc}")

    def refresh_enemy_list(self) -> None:
        self.enemy_listbox.delete(0, tk.END)
        for enemy in self.data["enemies"]:
            enemy_id = enemy.get("enemy_id", "")
            name = (enemy.get("name") or "").strip()
            shown = name if name else "(vacio)"
            self.enemy_listbox.insert(tk.END, f"[{enemy_id}] {shown}")
        self.min_enemy_var.set(str(self.data["config"]["min_enemy_id"]))
        self.max_enemy_var.set(str(self.data["config"]["max_enemy_id"]))

    def select_enemy_at(self, idx):
        total = len(self.data["enemies"])
        if total == 0:
            return
        idx = max(0, min(total - 1, idx))
        self.enemy_listbox.selection_clear(0, tk.END)
        self.enemy_listbox.selection_set(idx)
        self.enemy_listbox.see(idx)
        self.enemy_listbox.event_generate("<<ListboxSelect>>")

    def select_prev_enemy(self):
        idx = self.get_selected_enemy_index()
        self.select_enemy_at(0 if idx is None else idx - 1)

    def select_next_enemy(self):
        idx = self.get_selected_enemy_index()
        if idx is None:
            self.select_enemy_at(0)
            return
        self.select_enemy_at(idx + 1)

    def select_last_enemy(self):
        self.select_enemy_at(len(self.data["enemies"]) - 1)

    def goto_enemy_id(self):
        try:
            target_id = int(self.goto_id_var.get().strip())
        except ValueError:
            messagebox.showwarning("Dato inválido", "ID inválido.")
            return
        for i, enemy in enumerate(self.data["enemies"]):
            if int(enemy.get("enemy_id", 0)) == target_id:
                self.select_enemy_at(i)
                return
        messagebox.showwarning("No encontrado", f"No existe el enemigo ID {target_id} en el rango actual.")

    def apply_enemy_range(self):
        try:
            min_id = int(self.min_enemy_var.get().strip())
            max_id = int(self.max_enemy_var.get().strip())
        except ValueError:
            messagebox.showwarning("Dato inválido", "Min y Max deben ser enteros.")
            return
        if min_id < 1 or max_id < 1 or min_id > max_id:
            messagebox.showwarning("Dato inválido", "Debe cumplirse 1 <= Min <= Max.")
            return
        self.data["config"]["min_enemy_id"] = min_id
        self.data["config"]["max_enemy_id"] = max_id
        self.sync_from_enemies_file(show_feedback=False)
        self.refresh_enemy_list()
        self.select_enemy_at(0)

    def sync_from_enemies_file(self, show_feedback: bool = True) -> None:
        try:
            rpg_enemies, rpg_max = self._load_rpg_enemies()
        except Exception as exc:
            self.source_var.set("Error al leer Enemies.json")
            if show_feedback:
                messagebox.showerror("Error", f"No se pudo cargar Enemies.json:\n{exc}")
            return

        min_id = self.data["config"].get("min_enemy_id", 1)
        max_id = self.data["config"].get("max_enemy_id", 1)
        if rpg_max > max_id:
            max_id = rpg_max
            self.data["config"]["max_enemy_id"] = max_id

        self._merge_enemies_from_source(rpg_enemies, min_id, max_id)
        found = len(rpg_enemies)
        total = len(self.data["enemies"])
        self.source_var.set(f"Sincronizado: {found} definidos / {total} en rango")
        if show_feedback:
            messagebox.showinfo("Sincronizado", f"Enemies.json leído.\nDefinidos: {found}\nRango actual: {min_id}-{max_id}")

    def on_enemy_selected(self, _event=None) -> None:
        idx = self.get_selected_enemy_index()
        self.selected_enemy_index = idx
        if idx is None:
            return
        enemy = self.data["enemies"][idx]
        enemy_id = int(enemy.get("enemy_id", 0))
        self.enemy_id_var.set(str(enemy_id))
        self.enemy_name_var.set((enemy.get("name") or "").strip())
        self.enemy_pos_var.set(f"{idx + 1}/{len(self.data['enemies'])}")
        self.refresh_drops_tree(enemy.get("drops", []))
        self.clear_drop_form()
        self.render_enemy_image(enemy_id)

    def render_enemy_image(self, enemy_id: int):
        enemy_entry = self._get_enemy_from_rpg(enemy_id)
        if not enemy_entry:
            self.enemy_image_ref = None
            self.enemy_image_label.configure(image="", text="Sin imagen")
            return
        battler = (enemy_entry.get("battlerName") or "").strip()
        if not battler:
            self.enemy_image_ref = None
            self.enemy_image_label.configure(image="", text="Sin imagen")
            return

        image_path = None
        for candidate in [
            PROJECT_ROOT / "img" / "enemies" / f"{battler}.png",
            PROJECT_ROOT / "img" / "sv_enemies" / f"{battler}.png",
        ]:
            if candidate.exists():
                image_path = candidate
                break

        if not image_path:
            self.enemy_image_ref = None
            self.enemy_image_label.configure(image="", text=f"Sin png\n{battler}")
            return

        try:
            img = tk.PhotoImage(file=str(image_path))
            if img.width() > 180:
                img = img.subsample(max(1, img.width() // 180))
            self.enemy_image_ref = img
            self.enemy_image_label.configure(image=img, text="")
        except Exception:
            self.enemy_image_ref = None
            self.enemy_image_label.configure(image="", text=f"No se pudo cargar\n{image_path.name}")

    def select_drop_item(self):
        if self.get_selected_enemy() is None:
            messagebox.showwarning("Atención", "Selecciona un enemigo primero.")
            return
        if not (self.db["item"] or self.db["weapon"] or self.db["armor"]):
            messagebox.showwarning("Sin datos", "No se encontraron Items/Weapons/Armors en la carpeta data.")
            return
        dialog = DropPickerDialog(self, self.db, self.current_drop_pick)
        if dialog.selected:
            self.current_drop_pick = dialog.selected
            self.drop_selected_var.set(
                f"{dialog.selected['type']} [{dialog.selected['data_id']}] {dialog.selected['name']}"
            )

    def refresh_drops_tree(self, drops) -> None:
        for item in self.drops_tree.get_children():
            self.drops_tree.delete(item)
        for i, drop in enumerate(drops):
            kind = drop.get("type", "item")
            data_id = drop.get("data_id", drop.get("item_id", ""))
            name = drop.get("name", drop.get("item_name", ""))
            self.drops_tree.insert(
                "",
                tk.END,
                iid=str(i),
                values=(
                    kind,
                    data_id,
                    name,
                    drop.get("min", 1),
                    drop.get("max", 1),
                    self._format_chance_for_tree(drop),
                    drop.get("condition", "None"),
                ),
            )

    def on_drop_selected(self, _event=None) -> None:
        idx = self.get_selected_drop_index()
        enemy = self.get_selected_enemy()
        if idx is None or enemy is None:
            return
        drops = enemy.get("drops", [])
        if idx < 0 or idx >= len(drops):
            return
        drop = self._normalized_drop(drops[idx])
        self.current_drop_pick = {"type": drop["type"], "data_id": drop["data_id"], "name": drop["name"]}
        self.drop_selected_var.set(f"{drop['type']} [{drop['data_id']}] {drop['name']}")
        self.drop_min_var.set(str(drop.get("min", 1)))
        self.drop_max_var.set(str(drop.get("max", 1)))
        self.drop_chance_raw_var.set(str(drop.get("chance_raw", 10000000)))
        self.drop_chance_pct_var.set(f"{drop.get('chance_pct', 100):.2f}".rstrip("0").rstrip("."))
        self.drop_condition_var.set(str(drop.get("condition", "None")))

    def add_drop(self) -> None:
        enemy = self.get_selected_enemy()
        if enemy is None:
            messagebox.showwarning("Atención", "Selecciona un enemigo primero.")
            return
        validated = self._validated_drop_from_form()
        if validated is None:
            return
        enemy.setdefault("drops", []).append(validated)
        self.refresh_drops_tree(enemy["drops"])
        self.clear_drop_form()

    def update_drop(self) -> None:
        enemy = self.get_selected_enemy()
        idx = self.get_selected_drop_index()
        if enemy is None or idx is None:
            messagebox.showwarning("Atención", "Selecciona un drop de la tabla.")
            return
        drops = enemy.setdefault("drops", [])
        if idx < 0 or idx >= len(drops):
            messagebox.showwarning("Atención", "Drop inválido seleccionado.")
            return
        validated = self._validated_drop_from_form()
        if validated is None:
            return
        drops[idx] = validated
        self.refresh_drops_tree(drops)
        self.drops_tree.selection_set(str(idx))

    def remove_drop(self) -> None:
        enemy = self.get_selected_enemy()
        idx = self.get_selected_drop_index()
        if enemy is None or idx is None:
            messagebox.showwarning("Atención", "Selecciona un drop de la tabla.")
            return
        drops = enemy.setdefault("drops", [])
        if idx < 0 or idx >= len(drops):
            return
        drops.pop(idx)
        self.refresh_drops_tree(drops)
        self.clear_drop_form()

    def _validated_drop_from_form(self):
        if not self.current_drop_pick:
            messagebox.showwarning("Dato inválido", "Debes seleccionar un objeto/arma/armadura.")
            return None
        try:
            min_q = int(self.drop_min_var.get().strip())
            max_q = int(self.drop_max_var.get().strip())
            chance_raw = int(self.drop_chance_raw_var.get().strip())
            chance_pct = float(self.drop_chance_pct_var.get().strip().replace(",", "."))
        except ValueError:
            messagebox.showwarning("Dato inválido", "Min, Max, chance y % deben ser numéricos.")
            return None

        condition = self.drop_condition_var.get().strip() or "None"
        if min_q < 0 or max_q < 0:
            messagebox.showwarning("Dato inválido", "Min y Max deben ser >= 0.")
            return None
        if min_q > max_q:
            messagebox.showwarning("Dato inválido", "Min no puede ser mayor que Max.")
            return None
        if chance_raw < 0 or chance_raw > 10000000:
            messagebox.showwarning("Dato inválido", "Chance numérico debe estar entre 0 y 10000000.")
            return None
        if chance_pct <= 0 or chance_pct > 100:
            messagebox.showwarning("Dato inválido", "El porcentaje % debe estar entre 1 y 100.")
            return None
        if condition not in ("None", "Slayer", "Butchering", "Quest"):
            messagebox.showwarning("Dato inválido", "Condición inválida.")
            return None

        return {
            "type": self.current_drop_pick["type"],
            "data_id": int(self.current_drop_pick["data_id"]),
            "name": self.current_drop_pick["name"],
            "min": min_q,
            "max": max_q,
            "chance_raw": chance_raw,
            "chance_pct": round(chance_pct, 4),
            "condition": condition,
        }

    def clear_enemy_detail(self) -> None:
        self.enemy_id_var.set("")
        self.enemy_name_var.set("")
        self.enemy_pos_var.set("0/0")
        self.enemy_image_label.configure(image="", text="Sin imagen")
        self.enemy_image_ref = None

    def clear_drop_form(self) -> None:
        self.current_drop_pick = None
        self.drop_selected_var.set("(sin seleccionar)")
        self.drop_min_var.set("1")
        self.drop_max_var.set("1")
        self.drop_chance_raw_var.set("10000000")
        self.drop_chance_pct_var.set("100")
        self.drop_condition_var.set("None")

    def get_selected_enemy_index(self):
        sel = self.enemy_listbox.curselection()
        if not sel:
            return None
        return int(sel[0])

    def get_selected_enemy(self):
        idx = self.get_selected_enemy_index()
        if idx is None:
            return None
        if idx < 0 or idx >= len(self.data["enemies"]):
            return None
        return self.data["enemies"][idx]

    def get_selected_drop_index(self):
        sel = self.drops_tree.selection()
        if not sel:
            return None
        try:
            return int(sel[0])
        except ValueError:
            return None

    def refresh_recipes_list(self) -> None:
        self.recipe_listbox.delete(0, tk.END)
        self._recipe_view_indices = []
        recipes = self.recipes_data.get("recipes", [])
        for full_idx, rec in enumerate(recipes):
            if not self._recipe_passes_filters(rec):
                continue
            self._recipe_view_indices.append(full_idx)
            rid = rec.get("recipe_id", "")
            name = (rec.get("recipe_name") or "").strip() or "(sin nombre)"
            out_name = (rec.get("output_name") or "").strip()
            rt = str(rec.get("recipe_type", "") or "").strip()
            type_bit = f" [{rt}]" if rt else ""
            suffix = f" -> {out_name}" if out_name else ""
            self.recipe_listbox.insert(tk.END, f"[{rid}]{type_bit} {name}{suffix}")

    def get_selected_recipe_index(self):
        sel = self.recipe_listbox.curselection()
        if not sel:
            return None
        view_idx = int(sel[0])
        if view_idx < 0 or view_idx >= len(self._recipe_view_indices):
            return None
        return self._recipe_view_indices[view_idx]

    def get_selected_recipe(self):
        idx = self.get_selected_recipe_index()
        recipes = self.recipes_data.get("recipes", [])
        if idx is None or idx < 0 or idx >= len(recipes):
            return None
        return recipes[idx]

    def select_recipe_at(self, idx: int):
        recipes = self.recipes_data.get("recipes", [])
        if not recipes:
            return
        idx = max(0, min(len(recipes) - 1, idx))
        if idx not in self._recipe_view_indices:
            # si está filtrado, no forzamos selección incorrecta
            self.recipe_listbox.selection_clear(0, tk.END)
            self.clear_recipe_form()
            return
        view_idx = self._recipe_view_indices.index(idx)
        self.recipe_listbox.selection_clear(0, tk.END)
        self.recipe_listbox.selection_set(view_idx)
        self.recipe_listbox.see(view_idx)
        self.recipe_listbox.event_generate("<<ListboxSelect>>")

    def on_recipe_selected(self, _event=None):
        rec = self.get_selected_recipe()
        if rec is None:
            return
        self.recipe_id_var.set(str(rec.get("recipe_id", 1)))
        self.recipe_name_var.set(str(rec.get("recipe_name", "")))
        self.recipe_chance_var.set(str(rec.get("chance", 100)))
        self.recipe_output_count_var.set(str(rec.get("output_count", 1)))
        self.recipe_exp_var.set(str(rec.get("exp", 0)))
        self.recipe_skill_id_var.set(str(rec.get("skill_id", 5)))
        lvl = rec.get("nivel")
        if lvl is None:
            lvl = rec.get("skill_level", 1)
        self.recipe_level_var.set(str(lvl))
        self.recipe_has_been_learned_var.set(bool(rec.get("has_been_learned", False)))

        out_type = rec.get("output_type", "item")
        out_id = int(rec.get("output_id", 0) or 0)
        out_name = str(rec.get("output_name", ""))
        self.current_recipe_output_pick = {"type": out_type, "data_id": out_id, "name": out_name}
        self.recipe_output_var.set(f"{out_type} [{out_id}] {out_name}")
        self._recompute_recipe_name()
        self._apply_recipe_type_to_combo(rec.get("recipe_type", ""))
        self.refresh_recipe_materials_tree(rec.get("input_material", []))
        self.clear_recipe_material_form()

    def clear_recipe_form(self):
        self.recipe_id_var.set(str(self._next_recipe_id()))
        self.recipe_name_var.set("Receta: (sin output) (100%)")
        self.recipe_chance_var.set("100")
        self.recipe_output_count_var.set("1")
        self.recipe_exp_var.set("0")
        self.recipe_skill_id_var.set("5")
        self.recipe_level_var.set("1")
        self.recipe_has_been_learned_var.set(False)
        self.current_recipe_output_pick = None
        self.recipe_output_var.set("(sin seleccionar)")
        if hasattr(self, "recipe_type_combo"):
            self.recipe_type_combo.configure(values=tuple(self.recipe_types_list))
            if self.recipe_types_list:
                self.recipe_type_combo.set(self.recipe_types_list[0])
        self.refresh_recipe_materials_tree([])
        self.clear_recipe_material_form()

    def select_recipe_output(self):
        if not (self.db["item"] or self.db["weapon"] or self.db["armor"]):
            messagebox.showwarning("Sin datos", "No se encontraron Items/Weapons/Armors en la carpeta data.")
            return
        dialog = DropPickerDialog(self, self.db, self.current_recipe_output_pick)
        if dialog.selected:
            self.current_recipe_output_pick = dialog.selected
            self.recipe_output_var.set(
                f"{dialog.selected['type']} [{dialog.selected['data_id']}] {dialog.selected['name']}"
            )
            self._recompute_recipe_name()

    def _normalize_pct_text(self, chance):
        return f"{float(chance):.4f}".rstrip("0").rstrip(".")

    def _build_recipe_name(self, output_name: str, chance):
        output_label = (output_name or "").strip() or "(sin output)"
        pct_text = self._normalize_pct_text(chance)
        return f"Receta: {output_label} ({pct_text}%)"

    def _recompute_recipe_name(self):
        output_name = ""
        if self.current_recipe_output_pick:
            output_name = self.current_recipe_output_pick.get("name", "")
        chance_text = self.recipe_chance_var.get().strip().replace(",", ".") or "100"
        try:
            chance = float(chance_text)
        except ValueError:
            chance = 100.0
        self.recipe_name_var.set(self._build_recipe_name(output_name, chance))

    def _validated_recipe_from_form(self):
        if not self.current_recipe_output_pick:
            messagebox.showwarning("Dato inválido", "Debes seleccionar el output de la receta.")
            return None
        try:
            chance = float(self.recipe_chance_var.get().strip().replace(",", "."))
            output_count = int(self.recipe_output_count_var.get().strip())
            exp = int(self.recipe_exp_var.get().strip())
            skill_id = int(self.recipe_skill_id_var.get().strip())
            nivel = int(self.recipe_level_var.get().strip())
        except ValueError:
            messagebox.showwarning("Dato inválido", "Chance, output_count, exp, skill_id y nivel deben ser numéricos.")
            return None
        if chance <= 0 or chance > 100:
            messagebox.showwarning("Dato inválido", "Chance debe estar entre 1 y 100.")
            return None
        if output_count < 1:
            messagebox.showwarning("Dato inválido", "Output count debe ser >= 1.")
            return None
        if exp < 0:
            messagebox.showwarning("Dato inválido", "EXP debe ser >= 0.")
            return None
        if skill_id < 1:
            messagebox.showwarning("Dato inválido", "skill_id debe ser >= 1.")
            return None
        if nivel < 1:
            messagebox.showwarning("Dato inválido", "nivel debe ser >= 1.")
            return None

        rt = str(self.recipe_type_combo.get() or "").strip().lower()
        allowed = [str(x).strip().lower() for x in self.recipe_type_combo.cget("values")]
        if not rt or rt not in allowed:
            messagebox.showwarning("Dato inválido", "Selecciona un tipo de receta (recipe_type).")
            return None

        return {
            "recipe_id": None,
            "recipe_name": self._build_recipe_name(self.current_recipe_output_pick["name"], chance),
            "output_type": self.current_recipe_output_pick["type"],
            "output_id": int(self.current_recipe_output_pick["data_id"]),
            "output_name": self.current_recipe_output_pick["name"],
            "recipe_type": rt,
            "chance": round(chance, 4),
            "output_count": output_count,
            "exp": exp,
            "skill_id": skill_id,
            "nivel": nivel,
            "has_been_learned": bool(self.recipe_has_been_learned_var.get()),
            "input_material": [],
        }

    def add_recipe(self):
        validated = self._validated_recipe_from_form()
        if validated is None:
            return
        validated["recipe_id"] = self._next_recipe_id()
        validated["input_material"] = []
        self.recipes_data.setdefault("recipes", []).append(validated)
        self.refresh_recipes_list()
        self.select_recipe_at(len(self.recipes_data["recipes"]) - 1)

    def update_recipe(self):
        idx = self.get_selected_recipe_index()
        if idx is None:
            messagebox.showwarning("Atención", "Selecciona una receta.")
            return
        prev = self.get_selected_recipe()
        if prev is None:
            return
        validated = self._validated_recipe_from_form()
        if validated is None:
            return
        validated["recipe_id"] = int(prev.get("recipe_id", self._next_recipe_id()))
        validated["input_material"] = list(prev.get("input_material", []))
        self.recipes_data["recipes"][idx] = validated
        self.refresh_recipes_list()
        self.select_recipe_at(idx)

    def remove_recipe(self):
        idx = self.get_selected_recipe_index()
        if idx is None:
            messagebox.showwarning("Atención", "Selecciona una receta.")
            return
        self.recipes_data["recipes"].pop(idx)
        self.refresh_recipes_list()
        self.clear_recipe_form()

    def _next_recipe_id(self):
        max_id = 0
        for rec in self.recipes_data.get("recipes", []):
            try:
                max_id = max(max_id, int(rec.get("recipe_id", 0)))
            except (ValueError, TypeError):
                continue
        return max_id + 1

    def _persist_selected_recipe_from_form(self):
        idx = self.get_selected_recipe_index()
        if idx is None:
            return True
        prev = self.get_selected_recipe()
        if prev is None:
            return True
        validated = self._validated_recipe_from_form()
        if validated is None:
            return False
        validated["recipe_id"] = int(prev.get("recipe_id", self._next_recipe_id()))
        validated["input_material"] = list(prev.get("input_material", []))
        self.recipes_data["recipes"][idx] = validated
        self.refresh_recipes_list()
        self.select_recipe_at(idx)
        return True

    def refresh_recipe_materials_tree(self, mats):
        for item in self.recipe_materials_tree.get_children():
            self.recipe_materials_tree.delete(item)
        for i, mat in enumerate(mats):
            self.recipe_materials_tree.insert(
                "",
                tk.END,
                iid=str(i),
                values=(mat.get("type", "item"), mat.get("data_id", 0), mat.get("name", ""), mat.get("count", 1)),
            )

    def get_selected_recipe_material_index(self):
        sel = self.recipe_materials_tree.selection()
        if not sel:
            return None
        try:
            return int(sel[0])
        except ValueError:
            return None

    def on_recipe_material_selected(self, _event=None):
        rec = self.get_selected_recipe()
        idx = self.get_selected_recipe_material_index()
        if rec is None or idx is None:
            return
        mats = rec.get("input_material", [])
        if idx < 0 or idx >= len(mats):
            return
        mat = mats[idx]
        self.current_recipe_material_pick = {
            "type": mat.get("type", "item"),
            "data_id": int(mat.get("data_id", 0) or 0),
            "name": mat.get("name", ""),
        }
        self.recipe_material_var.set(
            f"{self.current_recipe_material_pick['type']} [{self.current_recipe_material_pick['data_id']}] {self.current_recipe_material_pick['name']}"
        )
        self.recipe_material_count_var.set(str(mat.get("count", 1)))

    def clear_recipe_material_form(self):
        self.current_recipe_material_pick = None
        self.recipe_material_var.set("(sin seleccionar)")
        self.recipe_material_count_var.set("1")

    def select_recipe_material(self):
        rec = self.get_selected_recipe()
        if rec is None:
            messagebox.showwarning("Atención", "Selecciona o crea una receta primero.")
            return
        dialog = DropPickerDialog(self, self.db, self.current_recipe_material_pick)
        if dialog.selected:
            self.current_recipe_material_pick = dialog.selected
            self.recipe_material_var.set(
                f"{dialog.selected['type']} [{dialog.selected['data_id']}] {dialog.selected['name']}"
            )

    def _validated_recipe_material_from_form(self):
        if not self.current_recipe_material_pick:
            messagebox.showwarning("Dato inválido", "Debes seleccionar un material.")
            return None
        try:
            count = int(self.recipe_material_count_var.get().strip())
        except ValueError:
            messagebox.showwarning("Dato inválido", "Count debe ser entero.")
            return None
        if count < 1:
            messagebox.showwarning("Dato inválido", "Count debe ser >= 1.")
            return None
        return {
            "type": self.current_recipe_material_pick["type"],
            "data_id": int(self.current_recipe_material_pick["data_id"]),
            "name": self.current_recipe_material_pick["name"],
            "count": count,
        }

    def add_recipe_material(self):
        rec = self.get_selected_recipe()
        if rec is None:
            messagebox.showwarning("Atención", "Selecciona una receta.")
            return
        validated = self._validated_recipe_material_from_form()
        if validated is None:
            return
        rec.setdefault("input_material", []).append(validated)
        self.refresh_recipe_materials_tree(rec["input_material"])
        self.clear_recipe_material_form()

    def update_recipe_material(self):
        rec = self.get_selected_recipe()
        idx = self.get_selected_recipe_material_index()
        if rec is None or idx is None:
            messagebox.showwarning("Atención", "Selecciona un material.")
            return
        validated = self._validated_recipe_material_from_form()
        if validated is None:
            return
        mats = rec.setdefault("input_material", [])
        if idx < 0 or idx >= len(mats):
            return
        mats[idx] = validated
        self.refresh_recipe_materials_tree(mats)
        self.recipe_materials_tree.selection_set(str(idx))

    def remove_recipe_material(self):
        rec = self.get_selected_recipe()
        idx = self.get_selected_recipe_material_index()
        if rec is None or idx is None:
            messagebox.showwarning("Atención", "Selecciona un material.")
            return
        mats = rec.setdefault("input_material", [])
        if idx < 0 or idx >= len(mats):
            return
        mats.pop(idx)
        self.refresh_recipe_materials_tree(mats)
        self.clear_recipe_material_form()

    def _load_rpg_enemies(self):
        if not ENEMIES_PATH.exists():
            return {}, 1
        parsed = json.loads(ENEMIES_PATH.read_text(encoding="utf-8"))
        if not isinstance(parsed, list):
            raise ValueError("Enemies.json debe ser un arreglo.")
        out = {}
        for row in parsed:
            if not isinstance(row, dict):
                continue
            enemy_id = row.get("id")
            name = row.get("name", "")
            if isinstance(enemy_id, int) and enemy_id > 0:
                out[enemy_id] = {
                    "name": (name or "").strip(),
                    "raw": row,
                }
        return out, max(1, len(parsed) - 1)

    def _merge_enemies_from_source(self, source_enemies, min_id, max_id):
        previous_by_id = {}
        for enemy in self.data.get("enemies", []):
            try:
                enemy_id = int(enemy.get("enemy_id"))
            except (TypeError, ValueError):
                continue
            previous_by_id[enemy_id] = enemy

        merged = []
        for enemy_id in range(min_id, max_id + 1):
            prev = previous_by_id.get(enemy_id, {})
            source = source_enemies.get(enemy_id, {})
            merged.append(
                {
                    "enemy_id": enemy_id,
                    "name": source.get("name", prev.get("name", "")),
                    "drops": list(prev.get("drops", [])),
                }
            )
        self.data["enemies"] = merged

    def _get_enemy_from_rpg(self, enemy_id):
        try:
            parsed = json.loads(ENEMIES_PATH.read_text(encoding="utf-8"))
        except Exception:
            return None
        if not isinstance(parsed, list) or enemy_id >= len(parsed):
            return None
        row = parsed[enemy_id]
        return row if isinstance(row, dict) else None

    def _normalized_drop(self, drop):
        kind = drop.get("type", "item")
        data_id = int(drop.get("data_id", drop.get("item_id", 0)) or 0)
        name = drop.get("name", drop.get("item_name", ""))
        return {
            "type": kind,
            "data_id": data_id,
            "name": name,
            "min": int(drop.get("min", 1)),
            "max": int(drop.get("max", 1)),
            "chance_raw": self._extract_chance_raw(drop),
            "chance_pct": self._extract_chance_pct(drop),
            "condition": str(drop.get("condition", "None")),
        }

    def _extract_chance_raw(self, drop):
        if "chance_raw" in drop:
            return int(drop.get("chance_raw", 10000000))
        old = drop.get("chance", 100)
        try:
            old_float = float(old)
        except (ValueError, TypeError):
            old_float = 100.0
        if old_float <= 100:
            return int(round(old_float * 100000))
        return int(round(old_float))

    def _extract_chance_pct(self, drop):
        if "chance_pct" in drop:
            return float(drop.get("chance_pct", 100))
        raw = self._extract_chance_raw(drop)
        return max(0.0, min(100.0, raw / 100000.0))

    def _format_chance_for_tree(self, drop):
        n = self._normalized_drop(drop)
        pct = f"{n['chance_pct']:.2f}".rstrip("0").rstrip(".")
        return f"{n['chance_raw']} ({pct}%)"

    def _on_chance_raw_changed(self, *_args):
        if self._chance_sync_lock:
            return
        value = self.drop_chance_raw_var.get().strip()
        if not value:
            return
        try:
            raw = int(value)
        except ValueError:
            return
        pct = max(0.0, min(100.0, raw / 100000.0))
        self._chance_sync_lock = True
        self.drop_chance_pct_var.set(f"{pct:.4f}".rstrip("0").rstrip("."))
        self._chance_sync_lock = False

    def _on_chance_pct_changed(self, *_args):
        if self._chance_sync_lock:
            return
        value = self.drop_chance_pct_var.get().strip().replace(",", ".")
        if not value:
            return
        try:
            pct = float(value)
        except ValueError:
            return
        raw = int(round(pct * 100000))
        self._chance_sync_lock = True
        self.drop_chance_raw_var.set(str(raw))
        self._chance_sync_lock = False


def main() -> None:
    ensure_data_file()
    app = EnemyDropsEditor()
    app.mainloop()


if __name__ == "__main__":
    main()

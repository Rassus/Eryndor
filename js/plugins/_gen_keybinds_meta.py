# -*- coding: utf-8 -*-
# Genera Onyx_Keybinds_meta.txt. Pegar al final de Onyx_Keybinds.js el IIFE
# (desde "(function(){" hasta ");") que esta en la version actual del plugin.
TYPES = """ * @type select
 * @option (sin accion)
 * @value none
 * @option Script JS
 * @value script
 * @option Comando de plugin
 * @value pluginCommand
 * @option Evento comun
 * @value commonEvent
 * @option Simbolo Input
 * @value inputSymbol
 * @default none"""

MODS = """ * @type select
 * @option (ninguno)
 * @value NONE
 * @option Ctrl
 * @value CTRL
 * @option Shift
 * @value SHIFT
 * @option Alt
 * @value ALT
 * @option Ctrl+Shift
 * @value CTRL+SHIFT
 * @option Ctrl+Alt
 * @value CTRL+ALT
 * @option Shift+Alt
 * @value SHIFT+ALT
 * @option Ctrl+Shift+Alt
 * @value CTRL+SHIFT+ALT
 * @default NONE"""


def block_letter():
    out = []
    for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        out.append(f" * @param let{c}_use")
        out.append(f" * @text Letra {c} — Activar")
        out.append(" * @type boolean")
        out.append(" * @default false")
        out.append(" *")
        out.append(f" * @param let{c}_type")
        out.append(f" * @text Letra {c} — Tipo de accion")
        out.append(TYPES)
        out.append(" *")
        out.append(f" * @param let{c}_data")
        out.append(f" * @text Letra {c} — Datos")
        out.append(" * @type note")
        out.append(" * @desc Script / Plugin Nombre|args / ID evento / simbolo Input")
        out.append(" * @default")
        out.append(" *")
    return "\n".join(out)


def block_digit():
    out = []
    for d in range(10):
        out.append(f" * @param dig{d}_use")
        out.append(f" * @text Numero {d} — Activar")
        out.append(" * @type boolean")
        out.append(" * @default false")
        out.append(" *")
        out.append(f" * @param dig{d}_type")
        out.append(f" * @text Numero {d} — Tipo de accion")
        out.append(TYPES)
        out.append(" *")
        out.append(f" * @param dig{d}_data")
        out.append(f" * @text Numero {d} — Datos")
        out.append(" * @type note")
        out.append(" * @default")
        out.append(" *")
    return "\n".join(out)


def block_fn():
    out = []
    for n in range(1, 13):
        out.append(f" * @param fn{n}_use")
        out.append(f" * @text Tecla F{n} — Activar")
        out.append(" * @type boolean")
        out.append(" * @default false")
        out.append(" *")
        out.append(f" * @param fn{n}_type")
        out.append(f" * @text Tecla F{n} — Tipo de accion")
        out.append(TYPES)
        out.append(" *")
        out.append(f" * @param fn{n}_data")
        out.append(f" * @text Tecla F{n} — Datos")
        out.append(" * @type note")
        out.append(" * @default")
        out.append(" *")
    return "\n".join(out)


def block_combo():
    out = []
    for i in range(1, 61):
        out.append(f" * @param cmb{i:02d}_use")
        out.append(f" * @text Combo {i:02d} — Activar")
        out.append(" * @type boolean")
        out.append(" * @default false")
        out.append(" *")
        out.append(f" * @param cmb{i:02d}_mod")
        out.append(f" * @text Combo {i:02d} — Modificadores")
        out.append(MODS)
        out.append(" *")
        out.append(f" * @param cmb{i:02d}_key")
        out.append(f" * @text Combo {i:02d} — Tecla base")
        out.append(" * @desc A-Z, 0-9 o F1-F12")
        out.append(" * @default")
        out.append(" *")
        out.append(f" * @param cmb{i:02d}_type")
        out.append(f" * @text Combo {i:02d} — Tipo de accion")
        out.append(TYPES)
        out.append(" *")
        out.append(f" * @param cmb{i:02d}_data")
        out.append(f" * @text Combo {i:02d} — Datos")
        out.append(" * @type note")
        out.append(" * @default")
        out.append(" *")
    return "\n".join(out)


HEAD = """/*:
 * @plugindesc (Onyx) v1.3.0.0 - Atajos: A-Z, 0-9, F1-F12 y 60 combos (modificadores)
 * @author Onyx
 * @version 1.3.0.0
 *
 * @help
 * Bloque 1: letras A-Z. Bloque 2: numeros 0-9. Bloque 3: F1-F12.
 * Bloque 4: 60 atajos con modificador + tecla base + accion.
 * Teclas ya usadas por el motor u otros plugins pueden entrar en conflicto.
 * Datos: Script = codigo. Plugin = NombreComando|arg1|arg2. Evento = ID. Input = simbolo.
 * Tipo (sin accion) = no hace nada aunque Activar este en true.
 *
 * Onyx.Keybinds.reloadFromParameters() y OnyxKeybinds ReloadFromPlugin.
"""

if __name__ == "__main__":
    p = __file__.replace("_gen_keybinds_meta.py", "Onyx_Keybinds_meta.txt")
    with open(p, "w", encoding="utf-8") as f:
        f.write(HEAD + "\n")
        f.write(block_letter() + "\n")
        f.write(block_digit() + "\n")
        f.write(block_fn() + "\n")
        f.write(block_combo() + "\n")
        f.write(" */\n")
    print("Wrote", p)

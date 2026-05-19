/*:
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

 * @param letA_use
 * @text Letra A — Activar
 * @type boolean
 * @default false
 *
 * @param letA_type
 * @text Letra A — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letA_data
 * @text Letra A — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letB_use
 * @text Letra B — Activar
 * @type boolean
 * @default false
 *
 * @param letB_type
 * @text Letra B — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letB_data
 * @text Letra B — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letC_use
 * @text Letra C — Activar
 * @type boolean
 * @default false
 *
 * @param letC_type
 * @text Letra C — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letC_data
 * @text Letra C — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letD_use
 * @text Letra D — Activar
 * @type boolean
 * @default false
 *
 * @param letD_type
 * @text Letra D — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letD_data
 * @text Letra D — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letE_use
 * @text Letra E — Activar
 * @type boolean
 * @default false
 *
 * @param letE_type
 * @text Letra E — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letE_data
 * @text Letra E — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letF_use
 * @text Letra F — Activar
 * @type boolean
 * @default false
 *
 * @param letF_type
 * @text Letra F — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letF_data
 * @text Letra F — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letG_use
 * @text Letra G — Activar
 * @type boolean
 * @default false
 *
 * @param letG_type
 * @text Letra G — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letG_data
 * @text Letra G — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letH_use
 * @text Letra H — Activar
 * @type boolean
 * @default false
 *
 * @param letH_type
 * @text Letra H — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letH_data
 * @text Letra H — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letI_use
 * @text Letra I — Activar
 * @type boolean
 * @default false
 *
 * @param letI_type
 * @text Letra I — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letI_data
 * @text Letra I — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letJ_use
 * @text Letra J — Activar
 * @type boolean
 * @default false
 *
 * @param letJ_type
 * @text Letra J — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letJ_data
 * @text Letra J — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letK_use
 * @text Letra K — Activar
 * @type boolean
 * @default false
 *
 * @param letK_type
 * @text Letra K — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letK_data
 * @text Letra K — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letL_use
 * @text Letra L — Activar
 * @type boolean
 * @default false
 *
 * @param letL_type
 * @text Letra L — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letL_data
 * @text Letra L — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letM_use
 * @text Letra M — Activar
 * @type boolean
 * @default false
 *
 * @param letM_type
 * @text Letra M — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letM_data
 * @text Letra M — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letN_use
 * @text Letra N — Activar
 * @type boolean
 * @default false
 *
 * @param letN_type
 * @text Letra N — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letN_data
 * @text Letra N — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letO_use
 * @text Letra O — Activar
 * @type boolean
 * @default false
 *
 * @param letO_type
 * @text Letra O — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letO_data
 * @text Letra O — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letP_use
 * @text Letra P — Activar
 * @type boolean
 * @default false
 *
 * @param letP_type
 * @text Letra P — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letP_data
 * @text Letra P — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letQ_use
 * @text Letra Q — Activar
 * @type boolean
 * @default false
 *
 * @param letQ_type
 * @text Letra Q — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letQ_data
 * @text Letra Q — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letR_use
 * @text Letra R — Activar
 * @type boolean
 * @default false
 *
 * @param letR_type
 * @text Letra R — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letR_data
 * @text Letra R — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letS_use
 * @text Letra S — Activar
 * @type boolean
 * @default false
 *
 * @param letS_type
 * @text Letra S — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letS_data
 * @text Letra S — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letT_use
 * @text Letra T — Activar
 * @type boolean
 * @default false
 *
 * @param letT_type
 * @text Letra T — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letT_data
 * @text Letra T — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letU_use
 * @text Letra U — Activar
 * @type boolean
 * @default false
 *
 * @param letU_type
 * @text Letra U — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letU_data
 * @text Letra U — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letV_use
 * @text Letra V — Activar
 * @type boolean
 * @default false
 *
 * @param letV_type
 * @text Letra V — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letV_data
 * @text Letra V — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letW_use
 * @text Letra W — Activar
 * @type boolean
 * @default false
 *
 * @param letW_type
 * @text Letra W — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letW_data
 * @text Letra W — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letX_use
 * @text Letra X — Activar
 * @type boolean
 * @default false
 *
 * @param letX_type
 * @text Letra X — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letX_data
 * @text Letra X — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letY_use
 * @text Letra Y — Activar
 * @type boolean
 * @default false
 *
 * @param letY_type
 * @text Letra Y — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letY_data
 * @text Letra Y — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param letZ_use
 * @text Letra Z — Activar
 * @type boolean
 * @default false
 *
 * @param letZ_type
 * @text Letra Z — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param letZ_data
 * @text Letra Z — Datos
 * @type note
 * @desc Script / Plugin Nombre|args / ID evento / simbolo Input
 * @default
 *
 * @param dig0_use
 * @text Numero 0 — Activar
 * @type boolean
 * @default false
 *
 * @param dig0_type
 * @text Numero 0 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig0_data
 * @text Numero 0 — Datos
 * @type note
 * @default
 *
 * @param dig1_use
 * @text Numero 1 — Activar
 * @type boolean
 * @default false
 *
 * @param dig1_type
 * @text Numero 1 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig1_data
 * @text Numero 1 — Datos
 * @type note
 * @default
 *
 * @param dig2_use
 * @text Numero 2 — Activar
 * @type boolean
 * @default false
 *
 * @param dig2_type
 * @text Numero 2 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig2_data
 * @text Numero 2 — Datos
 * @type note
 * @default
 *
 * @param dig3_use
 * @text Numero 3 — Activar
 * @type boolean
 * @default false
 *
 * @param dig3_type
 * @text Numero 3 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig3_data
 * @text Numero 3 — Datos
 * @type note
 * @default
 *
 * @param dig4_use
 * @text Numero 4 — Activar
 * @type boolean
 * @default false
 *
 * @param dig4_type
 * @text Numero 4 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig4_data
 * @text Numero 4 — Datos
 * @type note
 * @default
 *
 * @param dig5_use
 * @text Numero 5 — Activar
 * @type boolean
 * @default false
 *
 * @param dig5_type
 * @text Numero 5 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig5_data
 * @text Numero 5 — Datos
 * @type note
 * @default
 *
 * @param dig6_use
 * @text Numero 6 — Activar
 * @type boolean
 * @default false
 *
 * @param dig6_type
 * @text Numero 6 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig6_data
 * @text Numero 6 — Datos
 * @type note
 * @default
 *
 * @param dig7_use
 * @text Numero 7 — Activar
 * @type boolean
 * @default false
 *
 * @param dig7_type
 * @text Numero 7 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig7_data
 * @text Numero 7 — Datos
 * @type note
 * @default
 *
 * @param dig8_use
 * @text Numero 8 — Activar
 * @type boolean
 * @default false
 *
 * @param dig8_type
 * @text Numero 8 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig8_data
 * @text Numero 8 — Datos
 * @type note
 * @default
 *
 * @param dig9_use
 * @text Numero 9 — Activar
 * @type boolean
 * @default false
 *
 * @param dig9_type
 * @text Numero 9 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param dig9_data
 * @text Numero 9 — Datos
 * @type note
 * @default
 *
 * @param fn1_use
 * @text Tecla F1 — Activar
 * @type boolean
 * @default false
 *
 * @param fn1_type
 * @text Tecla F1 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn1_data
 * @text Tecla F1 — Datos
 * @type note
 * @default
 *
 * @param fn2_use
 * @text Tecla F2 — Activar
 * @type boolean
 * @default false
 *
 * @param fn2_type
 * @text Tecla F2 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn2_data
 * @text Tecla F2 — Datos
 * @type note
 * @default
 *
 * @param fn3_use
 * @text Tecla F3 — Activar
 * @type boolean
 * @default false
 *
 * @param fn3_type
 * @text Tecla F3 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn3_data
 * @text Tecla F3 — Datos
 * @type note
 * @default
 *
 * @param fn4_use
 * @text Tecla F4 — Activar
 * @type boolean
 * @default false
 *
 * @param fn4_type
 * @text Tecla F4 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn4_data
 * @text Tecla F4 — Datos
 * @type note
 * @default
 *
 * @param fn5_use
 * @text Tecla F5 — Activar
 * @type boolean
 * @default false
 *
 * @param fn5_type
 * @text Tecla F5 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn5_data
 * @text Tecla F5 — Datos
 * @type note
 * @default
 *
 * @param fn6_use
 * @text Tecla F6 — Activar
 * @type boolean
 * @default false
 *
 * @param fn6_type
 * @text Tecla F6 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn6_data
 * @text Tecla F6 — Datos
 * @type note
 * @default
 *
 * @param fn7_use
 * @text Tecla F7 — Activar
 * @type boolean
 * @default false
 *
 * @param fn7_type
 * @text Tecla F7 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn7_data
 * @text Tecla F7 — Datos
 * @type note
 * @default
 *
 * @param fn8_use
 * @text Tecla F8 — Activar
 * @type boolean
 * @default false
 *
 * @param fn8_type
 * @text Tecla F8 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn8_data
 * @text Tecla F8 — Datos
 * @type note
 * @default
 *
 * @param fn9_use
 * @text Tecla F9 — Activar
 * @type boolean
 * @default false
 *
 * @param fn9_type
 * @text Tecla F9 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn9_data
 * @text Tecla F9 — Datos
 * @type note
 * @default
 *
 * @param fn10_use
 * @text Tecla F10 — Activar
 * @type boolean
 * @default false
 *
 * @param fn10_type
 * @text Tecla F10 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn10_data
 * @text Tecla F10 — Datos
 * @type note
 * @default
 *
 * @param fn11_use
 * @text Tecla F11 — Activar
 * @type boolean
 * @default false
 *
 * @param fn11_type
 * @text Tecla F11 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn11_data
 * @text Tecla F11 — Datos
 * @type note
 * @default
 *
 * @param fn12_use
 * @text Tecla F12 — Activar
 * @type boolean
 * @default false
 *
 * @param fn12_type
 * @text Tecla F12 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param fn12_data
 * @text Tecla F12 — Datos
 * @type note
 * @default
 *
 * @param cmb01_use
 * @text Combo 01 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb01_mod
 * @text Combo 01 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb01_key
 * @text Combo 01 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb01_type
 * @text Combo 01 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb01_data
 * @text Combo 01 — Datos
 * @type note
 * @default
 *
 * @param cmb02_use
 * @text Combo 02 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb02_mod
 * @text Combo 02 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb02_key
 * @text Combo 02 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb02_type
 * @text Combo 02 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb02_data
 * @text Combo 02 — Datos
 * @type note
 * @default
 *
 * @param cmb03_use
 * @text Combo 03 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb03_mod
 * @text Combo 03 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb03_key
 * @text Combo 03 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb03_type
 * @text Combo 03 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb03_data
 * @text Combo 03 — Datos
 * @type note
 * @default
 *
 * @param cmb04_use
 * @text Combo 04 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb04_mod
 * @text Combo 04 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb04_key
 * @text Combo 04 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb04_type
 * @text Combo 04 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb04_data
 * @text Combo 04 — Datos
 * @type note
 * @default
 *
 * @param cmb05_use
 * @text Combo 05 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb05_mod
 * @text Combo 05 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb05_key
 * @text Combo 05 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb05_type
 * @text Combo 05 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb05_data
 * @text Combo 05 — Datos
 * @type note
 * @default
 *
 * @param cmb06_use
 * @text Combo 06 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb06_mod
 * @text Combo 06 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb06_key
 * @text Combo 06 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb06_type
 * @text Combo 06 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb06_data
 * @text Combo 06 — Datos
 * @type note
 * @default
 *
 * @param cmb07_use
 * @text Combo 07 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb07_mod
 * @text Combo 07 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb07_key
 * @text Combo 07 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb07_type
 * @text Combo 07 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb07_data
 * @text Combo 07 — Datos
 * @type note
 * @default
 *
 * @param cmb08_use
 * @text Combo 08 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb08_mod
 * @text Combo 08 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb08_key
 * @text Combo 08 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb08_type
 * @text Combo 08 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb08_data
 * @text Combo 08 — Datos
 * @type note
 * @default
 *
 * @param cmb09_use
 * @text Combo 09 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb09_mod
 * @text Combo 09 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb09_key
 * @text Combo 09 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb09_type
 * @text Combo 09 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb09_data
 * @text Combo 09 — Datos
 * @type note
 * @default
 *
 * @param cmb10_use
 * @text Combo 10 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb10_mod
 * @text Combo 10 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb10_key
 * @text Combo 10 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb10_type
 * @text Combo 10 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb10_data
 * @text Combo 10 — Datos
 * @type note
 * @default
 *
 * @param cmb11_use
 * @text Combo 11 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb11_mod
 * @text Combo 11 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb11_key
 * @text Combo 11 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb11_type
 * @text Combo 11 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb11_data
 * @text Combo 11 — Datos
 * @type note
 * @default
 *
 * @param cmb12_use
 * @text Combo 12 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb12_mod
 * @text Combo 12 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb12_key
 * @text Combo 12 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb12_type
 * @text Combo 12 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb12_data
 * @text Combo 12 — Datos
 * @type note
 * @default
 *
 * @param cmb13_use
 * @text Combo 13 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb13_mod
 * @text Combo 13 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb13_key
 * @text Combo 13 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb13_type
 * @text Combo 13 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb13_data
 * @text Combo 13 — Datos
 * @type note
 * @default
 *
 * @param cmb14_use
 * @text Combo 14 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb14_mod
 * @text Combo 14 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb14_key
 * @text Combo 14 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb14_type
 * @text Combo 14 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb14_data
 * @text Combo 14 — Datos
 * @type note
 * @default
 *
 * @param cmb15_use
 * @text Combo 15 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb15_mod
 * @text Combo 15 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb15_key
 * @text Combo 15 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb15_type
 * @text Combo 15 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb15_data
 * @text Combo 15 — Datos
 * @type note
 * @default
 *
 * @param cmb16_use
 * @text Combo 16 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb16_mod
 * @text Combo 16 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb16_key
 * @text Combo 16 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb16_type
 * @text Combo 16 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb16_data
 * @text Combo 16 — Datos
 * @type note
 * @default
 *
 * @param cmb17_use
 * @text Combo 17 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb17_mod
 * @text Combo 17 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb17_key
 * @text Combo 17 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb17_type
 * @text Combo 17 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb17_data
 * @text Combo 17 — Datos
 * @type note
 * @default
 *
 * @param cmb18_use
 * @text Combo 18 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb18_mod
 * @text Combo 18 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb18_key
 * @text Combo 18 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb18_type
 * @text Combo 18 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb18_data
 * @text Combo 18 — Datos
 * @type note
 * @default
 *
 * @param cmb19_use
 * @text Combo 19 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb19_mod
 * @text Combo 19 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb19_key
 * @text Combo 19 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb19_type
 * @text Combo 19 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb19_data
 * @text Combo 19 — Datos
 * @type note
 * @default
 *
 * @param cmb20_use
 * @text Combo 20 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb20_mod
 * @text Combo 20 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb20_key
 * @text Combo 20 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb20_type
 * @text Combo 20 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb20_data
 * @text Combo 20 — Datos
 * @type note
 * @default
 *
 * @param cmb21_use
 * @text Combo 21 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb21_mod
 * @text Combo 21 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb21_key
 * @text Combo 21 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb21_type
 * @text Combo 21 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb21_data
 * @text Combo 21 — Datos
 * @type note
 * @default
 *
 * @param cmb22_use
 * @text Combo 22 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb22_mod
 * @text Combo 22 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb22_key
 * @text Combo 22 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb22_type
 * @text Combo 22 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb22_data
 * @text Combo 22 — Datos
 * @type note
 * @default
 *
 * @param cmb23_use
 * @text Combo 23 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb23_mod
 * @text Combo 23 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb23_key
 * @text Combo 23 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb23_type
 * @text Combo 23 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb23_data
 * @text Combo 23 — Datos
 * @type note
 * @default
 *
 * @param cmb24_use
 * @text Combo 24 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb24_mod
 * @text Combo 24 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb24_key
 * @text Combo 24 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb24_type
 * @text Combo 24 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb24_data
 * @text Combo 24 — Datos
 * @type note
 * @default
 *
 * @param cmb25_use
 * @text Combo 25 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb25_mod
 * @text Combo 25 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb25_key
 * @text Combo 25 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb25_type
 * @text Combo 25 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb25_data
 * @text Combo 25 — Datos
 * @type note
 * @default
 *
 * @param cmb26_use
 * @text Combo 26 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb26_mod
 * @text Combo 26 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb26_key
 * @text Combo 26 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb26_type
 * @text Combo 26 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb26_data
 * @text Combo 26 — Datos
 * @type note
 * @default
 *
 * @param cmb27_use
 * @text Combo 27 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb27_mod
 * @text Combo 27 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb27_key
 * @text Combo 27 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb27_type
 * @text Combo 27 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb27_data
 * @text Combo 27 — Datos
 * @type note
 * @default
 *
 * @param cmb28_use
 * @text Combo 28 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb28_mod
 * @text Combo 28 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb28_key
 * @text Combo 28 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb28_type
 * @text Combo 28 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb28_data
 * @text Combo 28 — Datos
 * @type note
 * @default
 *
 * @param cmb29_use
 * @text Combo 29 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb29_mod
 * @text Combo 29 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb29_key
 * @text Combo 29 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb29_type
 * @text Combo 29 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb29_data
 * @text Combo 29 — Datos
 * @type note
 * @default
 *
 * @param cmb30_use
 * @text Combo 30 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb30_mod
 * @text Combo 30 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb30_key
 * @text Combo 30 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb30_type
 * @text Combo 30 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb30_data
 * @text Combo 30 — Datos
 * @type note
 * @default
 *
 * @param cmb31_use
 * @text Combo 31 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb31_mod
 * @text Combo 31 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb31_key
 * @text Combo 31 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb31_type
 * @text Combo 31 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb31_data
 * @text Combo 31 — Datos
 * @type note
 * @default
 *
 * @param cmb32_use
 * @text Combo 32 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb32_mod
 * @text Combo 32 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb32_key
 * @text Combo 32 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb32_type
 * @text Combo 32 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb32_data
 * @text Combo 32 — Datos
 * @type note
 * @default
 *
 * @param cmb33_use
 * @text Combo 33 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb33_mod
 * @text Combo 33 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb33_key
 * @text Combo 33 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb33_type
 * @text Combo 33 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb33_data
 * @text Combo 33 — Datos
 * @type note
 * @default
 *
 * @param cmb34_use
 * @text Combo 34 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb34_mod
 * @text Combo 34 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb34_key
 * @text Combo 34 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb34_type
 * @text Combo 34 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb34_data
 * @text Combo 34 — Datos
 * @type note
 * @default
 *
 * @param cmb35_use
 * @text Combo 35 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb35_mod
 * @text Combo 35 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb35_key
 * @text Combo 35 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb35_type
 * @text Combo 35 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb35_data
 * @text Combo 35 — Datos
 * @type note
 * @default
 *
 * @param cmb36_use
 * @text Combo 36 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb36_mod
 * @text Combo 36 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb36_key
 * @text Combo 36 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb36_type
 * @text Combo 36 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb36_data
 * @text Combo 36 — Datos
 * @type note
 * @default
 *
 * @param cmb37_use
 * @text Combo 37 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb37_mod
 * @text Combo 37 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb37_key
 * @text Combo 37 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb37_type
 * @text Combo 37 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb37_data
 * @text Combo 37 — Datos
 * @type note
 * @default
 *
 * @param cmb38_use
 * @text Combo 38 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb38_mod
 * @text Combo 38 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb38_key
 * @text Combo 38 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb38_type
 * @text Combo 38 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb38_data
 * @text Combo 38 — Datos
 * @type note
 * @default
 *
 * @param cmb39_use
 * @text Combo 39 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb39_mod
 * @text Combo 39 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb39_key
 * @text Combo 39 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb39_type
 * @text Combo 39 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb39_data
 * @text Combo 39 — Datos
 * @type note
 * @default
 *
 * @param cmb40_use
 * @text Combo 40 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb40_mod
 * @text Combo 40 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb40_key
 * @text Combo 40 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb40_type
 * @text Combo 40 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb40_data
 * @text Combo 40 — Datos
 * @type note
 * @default
 *
 * @param cmb41_use
 * @text Combo 41 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb41_mod
 * @text Combo 41 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb41_key
 * @text Combo 41 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb41_type
 * @text Combo 41 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb41_data
 * @text Combo 41 — Datos
 * @type note
 * @default
 *
 * @param cmb42_use
 * @text Combo 42 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb42_mod
 * @text Combo 42 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb42_key
 * @text Combo 42 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb42_type
 * @text Combo 42 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb42_data
 * @text Combo 42 — Datos
 * @type note
 * @default
 *
 * @param cmb43_use
 * @text Combo 43 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb43_mod
 * @text Combo 43 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb43_key
 * @text Combo 43 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb43_type
 * @text Combo 43 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb43_data
 * @text Combo 43 — Datos
 * @type note
 * @default
 *
 * @param cmb44_use
 * @text Combo 44 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb44_mod
 * @text Combo 44 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb44_key
 * @text Combo 44 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb44_type
 * @text Combo 44 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb44_data
 * @text Combo 44 — Datos
 * @type note
 * @default
 *
 * @param cmb45_use
 * @text Combo 45 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb45_mod
 * @text Combo 45 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb45_key
 * @text Combo 45 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb45_type
 * @text Combo 45 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb45_data
 * @text Combo 45 — Datos
 * @type note
 * @default
 *
 * @param cmb46_use
 * @text Combo 46 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb46_mod
 * @text Combo 46 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb46_key
 * @text Combo 46 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb46_type
 * @text Combo 46 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb46_data
 * @text Combo 46 — Datos
 * @type note
 * @default
 *
 * @param cmb47_use
 * @text Combo 47 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb47_mod
 * @text Combo 47 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb47_key
 * @text Combo 47 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb47_type
 * @text Combo 47 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb47_data
 * @text Combo 47 — Datos
 * @type note
 * @default
 *
 * @param cmb48_use
 * @text Combo 48 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb48_mod
 * @text Combo 48 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb48_key
 * @text Combo 48 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb48_type
 * @text Combo 48 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb48_data
 * @text Combo 48 — Datos
 * @type note
 * @default
 *
 * @param cmb49_use
 * @text Combo 49 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb49_mod
 * @text Combo 49 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb49_key
 * @text Combo 49 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb49_type
 * @text Combo 49 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb49_data
 * @text Combo 49 — Datos
 * @type note
 * @default
 *
 * @param cmb50_use
 * @text Combo 50 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb50_mod
 * @text Combo 50 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb50_key
 * @text Combo 50 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb50_type
 * @text Combo 50 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb50_data
 * @text Combo 50 — Datos
 * @type note
 * @default
 *
 * @param cmb51_use
 * @text Combo 51 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb51_mod
 * @text Combo 51 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb51_key
 * @text Combo 51 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb51_type
 * @text Combo 51 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb51_data
 * @text Combo 51 — Datos
 * @type note
 * @default
 *
 * @param cmb52_use
 * @text Combo 52 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb52_mod
 * @text Combo 52 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb52_key
 * @text Combo 52 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb52_type
 * @text Combo 52 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb52_data
 * @text Combo 52 — Datos
 * @type note
 * @default
 *
 * @param cmb53_use
 * @text Combo 53 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb53_mod
 * @text Combo 53 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb53_key
 * @text Combo 53 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb53_type
 * @text Combo 53 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb53_data
 * @text Combo 53 — Datos
 * @type note
 * @default
 *
 * @param cmb54_use
 * @text Combo 54 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb54_mod
 * @text Combo 54 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb54_key
 * @text Combo 54 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb54_type
 * @text Combo 54 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb54_data
 * @text Combo 54 — Datos
 * @type note
 * @default
 *
 * @param cmb55_use
 * @text Combo 55 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb55_mod
 * @text Combo 55 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb55_key
 * @text Combo 55 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb55_type
 * @text Combo 55 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb55_data
 * @text Combo 55 — Datos
 * @type note
 * @default
 *
 * @param cmb56_use
 * @text Combo 56 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb56_mod
 * @text Combo 56 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb56_key
 * @text Combo 56 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb56_type
 * @text Combo 56 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb56_data
 * @text Combo 56 — Datos
 * @type note
 * @default
 *
 * @param cmb57_use
 * @text Combo 57 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb57_mod
 * @text Combo 57 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb57_key
 * @text Combo 57 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb57_type
 * @text Combo 57 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb57_data
 * @text Combo 57 — Datos
 * @type note
 * @default
 *
 * @param cmb58_use
 * @text Combo 58 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb58_mod
 * @text Combo 58 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb58_key
 * @text Combo 58 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb58_type
 * @text Combo 58 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb58_data
 * @text Combo 58 — Datos
 * @type note
 * @default
 *
 * @param cmb59_use
 * @text Combo 59 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb59_mod
 * @text Combo 59 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb59_key
 * @text Combo 59 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb59_type
 * @text Combo 59 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb59_data
 * @text Combo 59 — Datos
 * @type note
 * @default
 *
 * @param cmb60_use
 * @text Combo 60 — Activar
 * @type boolean
 * @default false
 *
 * @param cmb60_mod
 * @text Combo 60 — Modificadores
 * @type select
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
 * @default NONE
 *
 * @param cmb60_key
 * @text Combo 60 — Tecla base
 * @desc A-Z, 0-9 o F1-F12
 * @default
 *
 * @param cmb60_type
 * @text Combo 60 — Tipo de accion
 * @type select
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
 * @default none
 *
 * @param cmb60_data
 * @text Combo 60 — Datos
 * @type note
 * @default
 *
 */
(function() {
  "use strict";

  var PLUGIN_NAME = "Onyx_Keybinds";

  window.Onyx = window.Onyx || {};
  Onyx.Keybinds = Onyx.Keybinds || {};

  var _pressed = {};
  var _firedWhileHeld = {};
  var _virtualTrigger = {};

  var KEY_ALIASES = {
    CONTROL: "CTRL",
    CMD: "META",
    COMMAND: "META",
    OPTION: "ALT",
    ESC: "ESCAPE",
    RETURN: "ENTER",
    SPACEBAR: "SPACE",
    PLUS: "+",
    MINUS: "-"
  };

  var KEYCODE_TO_TOKEN = {};
  function mapRange(from, to, baseCode) {
    var i;
    for (i = from; i <= to; i++) KEYCODE_TO_TOKEN[i] = String.fromCharCode(baseCode + (i - from));
  }
  mapRange(65, 90, 65);
  mapRange(48, 57, 48);
  var fk;
  for (fk = 1; fk <= 12; fk++) {
    KEYCODE_TO_TOKEN[111 + fk] = "F" + fk;
  }
  for (fk = 0; fk <= 9; fk++) {
    KEYCODE_TO_TOKEN[96 + fk] = String(fk);
  }
  KEYCODE_TO_TOKEN[17] = "CTRL";
  KEYCODE_TO_TOKEN[16] = "SHIFT";
  KEYCODE_TO_TOKEN[18] = "ALT";
  KEYCODE_TO_TOKEN[91] = "META";
  KEYCODE_TO_TOKEN[93] = "META";
  KEYCODE_TO_TOKEN[27] = "ESCAPE";
  KEYCODE_TO_TOKEN[13] = "ENTER";
  KEYCODE_TO_TOKEN[32] = "SPACE";
  KEYCODE_TO_TOKEN[9] = "TAB";
  KEYCODE_TO_TOKEN[8] = "BACKSPACE";
  KEYCODE_TO_TOKEN[37] = "LEFT";
  KEYCODE_TO_TOKEN[38] = "UP";
  KEYCODE_TO_TOKEN[39] = "RIGHT";
  KEYCODE_TO_TOKEN[40] = "DOWN";
  KEYCODE_TO_TOKEN[187] = "+";
  KEYCODE_TO_TOKEN[189] = "-";

  var MOD_ORDER = ["CTRL", "ALT", "SHIFT", "META"];

  function canonToken(token) {
    var t = String(token || "").trim().toUpperCase();
    if (!t) return "";
    return KEY_ALIASES[t] || t;
  }

  function normalizeCombo(combo) {
    var raw = String(combo || "").trim();
    if (!raw) return "";
    raw = raw.replace(/\s+/g, "");
    var parts = raw.split("+");
    var mods = [];
    var keys = [];
    var i, t;
    for (i = 0; i < parts.length; i++) {
      t = canonToken(parts[i]);
      if (!t) continue;
      if (MOD_ORDER.indexOf(t) >= 0) {
        if (mods.indexOf(t) < 0) mods.push(t);
      } else {
        if (keys.indexOf(t) < 0) keys.push(t);
      }
    }
    mods.sort(function(a, b) { return MOD_ORDER.indexOf(a) - MOD_ORDER.indexOf(b); });
    keys.sort();
    return mods.concat(keys).join("+");
  }

  function parseKeyMapperSymbol(symbol) {
    var s = String(symbol || "").trim();
    if (!s) return null;
    return s.toUpperCase();
  }

  function getStore() {
    if (!$gameSystem) return null;
    if (!$gameSystem._onyxKeybinds) {
      $gameSystem._onyxKeybinds = { actions: {} };
    }
    return $gameSystem._onyxKeybinds;
  }

  function getActions() {
    var st = getStore();
    return st ? st.actions : {};
  }

  function isSingleKey(comboNorm) {
    return comboNorm && comboNorm.indexOf("+") < 0;
  }

  function conflictsWithEngine(comboNorm) {
    if (!isSingleKey(comboNorm)) return false;
    var key = comboNorm;
    var mapper = Input.keyMapper || {};
    var code;
    for (code in mapper) {
      if (!Object.prototype.hasOwnProperty.call(mapper, code)) continue;
      var symbol = parseKeyMapperSymbol(mapper[code]);
      if (!symbol) continue;
      if (symbol === key) return true;
      if (key.length === 1 && symbol.indexOf(key) >= 0) return true;
    }
    return false;
  }

  function isComboAvailable(combo, ignoreActionId, actionsMap) {
    var c = normalizeCombo(combo);
    if (!c) return { ok: false, reason: "Combo vacio." };
    var actions = actionsMap || getActions();
    var id;
    for (id in actions) {
      if (!Object.prototype.hasOwnProperty.call(actions, id)) continue;
      if (ignoreActionId && id === String(ignoreActionId)) continue;
      var row = actions[id];
      if (row && normalizeCombo(row.combo) === c) {
        return { ok: false, reason: "Combo ya usado: " + id };
      }
    }
    if (conflictsWithEngine(c)) {
      return { ok: false, reason: "Conflicto con tecla del motor u otro plugin." };
    }
    return { ok: true, combo: c };
  }

  function fillEntryFromTypeData(entry, type, dataStr) {
    var typ = String(type || "").toLowerCase();
    if (typ === "none" || !typ) return false;
    entry.type = typ;
    var ds = String(dataStr || "");
    if (typ === "script") {
      entry.script = ds;
    } else if (typ === "plugincommand") {
      var parts = ds.split("|").map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
      entry.command = parts[0] || "";
      entry.args = parts.slice(1);
    } else if (typ === "commonevent") {
      entry.commonEventId = parseInt(ds, 10);
      if (!isFinite(entry.commonEventId)) entry.commonEventId = 0;
    } else if (typ === "inputsymbol") {
      entry.symbol = ds.trim();
    } else {
      return false;
    }
    entry.enabled = true;
    return true;
  }

  function normalizeComboKeyToken(raw) {
    var s = String(raw || "").trim().toUpperCase();
    if (!s) return "";
    if (/^F(1[0-2]|[1-9])$/.test(s)) return s;
    if (/^[0-9]$/.test(s)) return s;
    if (/^[A-Z]$/.test(s)) return s;
    return "";
  }

  function modAndKeyToCombo(modVal, keyRaw) {
    var keyTok = normalizeComboKeyToken(keyRaw);
    if (!keyTok) return "";
    var m = String(modVal || "NONE").toUpperCase();
    if (m === "NONE" || m === "") {
      return normalizeCombo(keyTok);
    }
    var modPart = m.replace(/\s+/g, "");
    return normalizeCombo(modPart + "+" + keyTok);
  }

  function buildActionsFromParameters(params) {
    params = params || {};
    var actions = {};
    var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var i, c, id, use, typ, data, entry, chk;
    for (i = 0; i < letters.length; i++) {
      c = letters.charAt(i);
      id = "let_" + c;
      use = String(params["let" + c + "_use"] || "");
      if (use !== "true") continue;
      typ = String(params["let" + c + "_type"] || "none");
      data = params["let" + c + "_data"];
      entry = {};
      if (!fillEntryFromTypeData(entry, typ, data)) continue;
      chk = isComboAvailable(c, id, actions);
      if (!chk.ok) {
        console.warn("[Onyx_Keybinds]", id, chk.reason);
        continue;
      }
      entry.combo = chk.combo;
      actions[id] = entry;
    }
    for (i = 0; i < 10; i++) {
      c = String(i);
      id = "dig_" + c;
      use = String(params["dig" + c + "_use"] || "");
      if (use !== "true") continue;
      typ = String(params["dig" + c + "_type"] || "none");
      data = params["dig" + c + "_data"];
      entry = {};
      if (!fillEntryFromTypeData(entry, typ, data)) continue;
      chk = isComboAvailable(c, id, actions);
      if (!chk.ok) {
        console.warn("[Onyx_Keybinds]", id, chk.reason);
        continue;
      }
      entry.combo = chk.combo;
      actions[id] = entry;
    }
    for (i = 1; i <= 12; i++) {
      id = "fn_F" + i;
      use = String(params["fn" + i + "_use"] || "");
      if (use !== "true") continue;
      typ = String(params["fn" + i + "_type"] || "none");
      data = params["fn" + i + "_data"];
      entry = {};
      if (!fillEntryFromTypeData(entry, typ, data)) continue;
      var fcombo = "F" + i;
      chk = isComboAvailable(fcombo, id, actions);
      if (!chk.ok) {
        console.warn("[Onyx_Keybinds]", id, chk.reason);
        continue;
      }
      entry.combo = chk.combo;
      actions[id] = entry;
    }
    for (i = 1; i <= 60; i++) {
      var suf = i < 10 ? "0" + i : String(i);
      id = "cmb_" + suf;
      use = String(params["cmb" + suf + "_use"] || "");
      if (use !== "true") continue;
      typ = String(params["cmb" + suf + "_type"] || "none");
      data = params["cmb" + suf + "_data"];
      var modV = params["cmb" + suf + "_mod"];
      var keyV = params["cmb" + suf + "_key"];
      var comboStr = modAndKeyToCombo(modV, keyV);
      entry = {};
      if (!fillEntryFromTypeData(entry, typ, data)) continue;
      chk = isComboAvailable(comboStr, id, actions);
      if (!chk.ok) {
        console.warn("[Onyx_Keybinds]", id, chk.reason);
        continue;
      }
      entry.combo = chk.combo;
      actions[id] = entry;
    }
    return actions;
  }

  function applyPluginBindings() {
    var params = PluginManager.parameters(PLUGIN_NAME);
    var actions = buildActionsFromParameters(params);
    var st = getStore();
    if (!st) return;
    st.actions = actions;
  }

  function currentPressedCombo() {
    var mods = [];
    var keys = [];
    var t;
    for (t in _pressed) {
      if (!Object.prototype.hasOwnProperty.call(_pressed, t)) continue;
      if (!_pressed[t]) continue;
      if (MOD_ORDER.indexOf(t) >= 0) mods.push(t);
      else keys.push(t);
    }
    mods.sort(function(a, b) { return MOD_ORDER.indexOf(a) - MOD_ORDER.indexOf(b); });
    keys.sort();
    return mods.concat(keys).join("+");
  }

  function safeEval(scriptText) {
    var fn = new Function(scriptText);
    return fn.call(window);
  }

  function triggerAction(action) {
    if (!action || action.enabled === false) return;
    var type = String(action.type || "").toLowerCase();
    if (type === "script") {
      if (!action.script) return;
      try { safeEval(String(action.script)); } catch (e) { console.error("[Onyx_Keybinds] script", e); }
      return;
    }
    if (type === "plugincommand") {
      var cmd = String(action.command || "");
      if (!cmd) return;
      var args = Array.isArray(action.args) ? action.args.map(String) : [];
      if ($gameMap && $gameMap._interpreter) {
        $gameMap._interpreter.pluginCommand(cmd, args);
      }
      return;
    }
    if (type === "commonevent") {
      var ceId = Number(action.commonEventId) || 0;
      if (ceId > 0 && $gameTemp) $gameTemp.reserveCommonEvent(ceId);
      return;
    }
    if (type === "inputsymbol") {
      var sym = String(action.symbol || "").trim();
      if (!sym) return;
      _virtualTrigger[sym] = true;
      return;
    }
  }

  function onKeyDown(ev) {
    var token = KEYCODE_TO_TOKEN[ev.keyCode];
    if (!token) return;
    _pressed[token] = true;
  }

  function onKeyUp(ev) {
    var token = KEYCODE_TO_TOKEN[ev.keyCode];
    if (!token) return;
    _pressed[token] = false;
    _firedWhileHeld = {};
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", function() {
    _pressed = {};
    _firedWhileHeld = {};
  });

  function processHotkeyCombos() {
    var combo = currentPressedCombo();
    if (!combo) {
      _firedWhileHeld = {};
      return;
    }
    var actions = getActions();
    var id;
    for (id in actions) {
      if (!Object.prototype.hasOwnProperty.call(actions, id)) continue;
      var row = actions[id];
      if (!row || row.enabled === false) continue;
      var target = normalizeCombo(row.combo);
      if (!target || target !== combo) continue;
      var fireKey = id + "::" + target;
      if (_firedWhileHeld[fireKey]) continue;
      triggerAction(row);
      _firedWhileHeld[fireKey] = true;
    }
  }

  var _SceneManager_updateMain = SceneManager.updateMain;
  SceneManager.updateMain = function() {
    _SceneManager_updateMain.call(this);
    processHotkeyCombos();
  };

  var _Input_isTriggered = Input.isTriggered;
  Input.isTriggered = function(keyName) {
    if (_virtualTrigger[keyName]) {
      _virtualTrigger[keyName] = false;
      return true;
    }
    return _Input_isTriggered.call(this, keyName);
  };

  var API = Onyx.Keybinds;

  API.normalizeCombo = normalizeCombo;
  API.isComboAvailable = isComboAvailable;
  API.reloadFromParameters = applyPluginBindings;
  API.getBindings = function() {
    return JSON.parse(JSON.stringify(getActions() || {}));
  };

  API.listActionIds = function() {
    var actions = getActions();
    var ids = [];
    var id;
    for (id in actions) {
      if (Object.prototype.hasOwnProperty.call(actions, id)) ids.push(id);
    }
    ids.sort();
    return ids;
  };

  API.getDisplayName = function(actionId) {
    var actions = getActions();
    var row = actions && actions[String(actionId)];
    if (!row) return String(actionId);
    var dn = row.displayName;
    if (dn != null && String(dn).trim() !== "") return String(dn);
    return String(actionId);
  };

  API.setDisplayName = function(actionId, text) {
    var id = String(actionId || "").trim();
    var actions = getActions();
    if (!actions || !actions[id]) return { ok: false, reason: "Accion no registrada." };
    actions[id].displayName = String(text || "");
    return { ok: true };
  };

  API.registerAction = function(actionId, data) {
    var id = String(actionId || "").trim();
    if (!id) return { ok: false, reason: "actionId vacio." };
    var actions = getActions();
    if (!actions) return { ok: false, reason: "No hay gameSystem." };
    actions[id] = actions[id] || {};
    actions[id].type = String(data && data.type || actions[id].type || "").toLowerCase();
    actions[id].enabled = data && data.enabled != null ? !!data.enabled : (actions[id].enabled !== false);
    if (data) {
      if (data.displayName != null) actions[id].displayName = String(data.displayName);
      if (data.script != null) actions[id].script = String(data.script);
      if (data.command != null) actions[id].command = String(data.command);
      if (data.args != null) actions[id].args = Array.isArray(data.args) ? data.args.slice() : [];
      if (data.commonEventId != null) actions[id].commonEventId = Number(data.commonEventId) || 0;
      if (data.symbol != null) actions[id].symbol = String(data.symbol);
      if (data.combo != null) {
        var bindRes = API.bind(id, data.combo);
        if (!bindRes.ok) return bindRes;
      }
    }
    return { ok: true, actionId: id };
  };

  API.bind = function(actionId, combo) {
    var id = String(actionId || "").trim();
    if (!id) return { ok: false, reason: "actionId vacio." };
    var actions = getActions();
    if (!actions || !actions[id]) return { ok: false, reason: "Accion no registrada: " + id };
    var chk = isComboAvailable(combo, id);
    if (!chk.ok) return chk;
    actions[id].combo = chk.combo;
    return { ok: true, actionId: id, combo: chk.combo };
  };

  API.unbind = function(actionId) {
    var id = String(actionId || "").trim();
    var actions = getActions();
    if (!actions || !actions[id]) return { ok: false, reason: "Accion no registrada." };
    actions[id].combo = "";
    return { ok: true };
  };

  API.remove = function(actionId) {
    var id = String(actionId || "").trim();
    var actions = getActions();
    if (!actions || !actions[id]) return { ok: false, reason: "Accion no registrada." };
    delete actions[id];
    return { ok: true };
  };

  API.enable = function(actionId, enabled) {
    var id = String(actionId || "").trim();
    var actions = getActions();
    if (!actions || !actions[id]) return { ok: false, reason: "Accion no registrada." };
    actions[id].enabled = enabled !== false;
    return { ok: true, enabled: actions[id].enabled };
  };

  API.trigger = function(actionId) {
    var id = String(actionId || "").trim();
    var actions = getActions();
    if (!actions || !actions[id]) return false;
    triggerAction(actions[id]);
    return true;
  };

  var _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    getStore();
    applyPluginBindings();
  };

  var _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    getStore();
    applyPluginBindings();
  };

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (String(command) !== "OnyxKeybinds") return;
    if (!args || !args.length) return;
    var sub = String(args[0] || "");
    var id, combo, rest, n;
    if (sub === "RegisterScript") {
      id = args[1];
      rest = args.slice(2).join(" ");
      API.registerAction(id, { type: "script", script: rest });
      return;
    }
    if (sub === "RegisterPluginCommand") {
      id = args[1];
      API.registerAction(id, { type: "pluginCommand", command: args[2], args: args.slice(3) });
      return;
    }
    if (sub === "RegisterCommonEvent") {
      id = args[1];
      n = Number(args[2]) || 0;
      API.registerAction(id, { type: "commonEvent", commonEventId: n });
      return;
    }
    if (sub === "RegisterInputSymbol") {
      id = args[1];
      API.registerAction(id, { type: "inputSymbol", symbol: args[2] });
      return;
    }
    if (sub === "Bind") {
      id = args[1];
      combo = args.slice(2).join(" ");
      API.bind(id, combo);
      return;
    }
    if (sub === "Unbind") {
      API.unbind(args[1]);
      return;
    }
    if (sub === "Remove") {
      API.remove(args[1]);
      return;
    }
    if (sub === "Enable") {
      API.enable(args[1], true);
      return;
    }
    if (sub === "Disable") {
      API.enable(args[1], false);
      return;
    }
    if (sub === "ReloadFromPlugin") {
      applyPluginBindings();
      return;
    }
  };
})();

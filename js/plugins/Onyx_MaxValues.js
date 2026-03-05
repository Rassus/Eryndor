/*:
 * @plugindesc (Onyx) Permite configurar los máximos de nivel, ítems y parámetros (RPG Maker MV)
 * @name Onyx_MaxValues
 * @author Onyx
 *
 * @param maxActorLevel
 * @text Máx. nivel (actores)
 * @type number
 * @min 1
 * @max 9999
 * @default 99
 * @desc Nivel máximo que pueden alcanzar los personajes. Si el actor tiene más en datos, se limita a este valor.
 *
 * @param maxItemsPerStack
 * @text Máx. ítems por pila
 * @type number
 * @min 1
 * @max 9999
 * @default 99
 * @desc Cantidad máxima de un mismo ítem que puede tener el grupo (por tipo).
 *
 * @param maxMHP
 * @text Máx. HP
 * @type number
 * @min 1
 * @max 9999999
 * @default 9999
 * @desc Límite máximo de HP (actores).
 *
 * @param maxMMP
 * @text Máx. MP
 * @type number
 * @min 1
 * @max 9999999
 * @default 9999
 * @desc Límite máximo de MP.
 *
 * @param maxOtherParam
 * @text Máx. otros parámetros (Atk, Def, etc.)
 * @type number
 * @min 1
 * @max 9999
 * @default 999
 * @desc Límite para Ataque, Defensa, Matk, Mdef, Agilidad y Suerte.
 *
 * @help
 * Configura desde el Plugin Manager los valores máximos que usa el motor:
 *
 *   - Nivel de personajes (global)
 *   - Cantidad de ítems por tipo en el inventario
 *   - HP máximo (actores)
 *   - MP máximo
 *   - Ataque, Defensa, Matk, Mdef, Agilidad, Suerte
 *
 * Los skills (Tala, Minería, etc.) siguen usando su máximo en data/custom/SkillList.json.
 */

(function() {
  "use strict";

  var PARAMS = PluginManager.parameters("Onyx_MaxValues");
  var MAX_ACTOR_LEVEL = Math.max(1, parseInt(PARAMS["maxActorLevel"], 10) || 99);
  var MAX_ITEMS_PER_STACK = Math.max(1, parseInt(PARAMS["maxItemsPerStack"], 10) || 99);
  var MAX_MHP = Math.max(1, parseInt(PARAMS["maxMHP"], 10) || 9999);
  var MAX_MMP = Math.max(1, parseInt(PARAMS["maxMMP"], 10) || 9999);
  var MAX_OTHER_PARAM = Math.max(1, parseInt(PARAMS["maxOtherParam"], 10) || 999);

  // --- Nivel máximo actores ---
  var _Game_Actor_maxLevel = Game_Actor.prototype.maxLevel;
  Game_Actor.prototype.maxLevel = function() {
    var dataMax = _Game_Actor_maxLevel ? _Game_Actor_maxLevel.call(this) : (this.actor().maxLevel || 99);
    return Math.min(dataMax, MAX_ACTOR_LEVEL);
  };

  // --- Cantidad máxima de ítems por tipo ---
  Game_Party.prototype.maxItems = function(item) {
    return MAX_ITEMS_PER_STACK;
  };

  // --- Parámetros máximos (HP, MP, Atk, Def, etc.) ---
  var _Game_BattlerBase_paramMax = Game_BattlerBase.prototype.paramMax;
  Game_BattlerBase.prototype.paramMax = function(paramId) {
    if (paramId === 0) return MAX_MHP;
    if (paramId === 1) return MAX_MMP;
    return MAX_OTHER_PARAM;
  };

  // Actor usa el mismo límite de MHP; el resto viene de BattlerBase (MMP y otros)
  Game_Actor.prototype.paramMax = function(paramId) {
    if (paramId === 0) return MAX_MHP;
    return _Game_BattlerBase_paramMax.call(this, paramId);
  };

})();

/*:
 * @plugindesc (Onyx) Skill: Rango - EXP al matar con arma a distancia equipada
 * @name SkillRango
 * @author Onyx
 * @version 1.0.0.0
 * @orderAfter Onyx_CombatSkillCore
 *
 * @param varSkillLevel
 * @text Variable: Nivel
 * @type variable
 * @default 61
 *
 * @param varExpActual
 * @text Variable: EXP en nivel
 * @type variable
 * @default 62
 *
 * @param varExpSiguiente
 * @text Variable: EXP siguiente
 * @type variable
 * @default 63
 *
 * @param varMaxSkillLevel
 * @text Variable: Nivel maximo
 * @type variable
 * @default 64
 *
 * @help
 * Requiere Onyx_CombatSkillCore + WeaponSkillTypes.json (skill_id 7 en SkillList).
 * Plugin command: SkillRango Init
 */

(function() {
  "use strict";
  var P = PluginManager.parameters("SkillRango");
  Onyx.CombatSkill.installSkill({
    key: "Rango",
    id: 7,
    name: "Rango",
    combatType: "range",
    varSkillLevel: Number(P.varSkillLevel || 61),
    varExpActual: Number(P.varExpActual || 62),
    varExpSiguiente: Number(P.varExpSiguiente || 63),
    varMaxSkillLevel: Number(P.varMaxSkillLevel || 64)
  });

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command !== "SkillRango") return;
    if (args && args[0] === "Init" && Onyx.Skill.Rango.init) Onyx.Skill.Rango.init();
  };

  var _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    if (Onyx.Skill.Rango && Onyx.Skill.Rango.syncVariablesToGame) Onyx.Skill.Rango.syncVariablesToGame();
  };

  var _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    if (Onyx.Skill.Rango && Onyx.Skill.Rango.syncVariablesToGame) Onyx.Skill.Rango.syncVariablesToGame();
  };
})();

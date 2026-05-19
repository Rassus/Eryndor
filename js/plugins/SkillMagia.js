/*:
 * @plugindesc (Onyx) Skill: Magia - EXP al matar con arma magica (vara) equipada
 * @name SkillMagia
 * @author Onyx
 * @version 1.0.0.0
 * @orderAfter Onyx_CombatSkillCore
 *
 * @param varSkillLevel
 * @text Variable: Nivel
 * @type variable
 * @default 65
 *
 * @param varExpActual
 * @text Variable: EXP en nivel
 * @type variable
 * @default 66
 *
 * @param varExpSiguiente
 * @text Variable: EXP siguiente
 * @type variable
 * @default 67
 *
 * @param varMaxSkillLevel
 * @text Variable: Nivel maximo
 * @type variable
 * @default 68
 *
 * @help
 * Requiere Onyx_CombatSkillCore + WeaponSkillTypes.json (skill_id 8 en SkillList).
 * Por defecto armas wtype Vara = magic. Plugin command: SkillMagia Init
 */

(function() {
  "use strict";
  var P = PluginManager.parameters("SkillMagia");
  Onyx.CombatSkill.installSkill({
    key: "Magia",
    id: 8,
    name: "Magia",
    combatType: "magic",
    varSkillLevel: Number(P.varSkillLevel || 65),
    varExpActual: Number(P.varExpActual || 66),
    varExpSiguiente: Number(P.varExpSiguiente || 67),
    varMaxSkillLevel: Number(P.varMaxSkillLevel || 68)
  });

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command !== "SkillMagia") return;
    if (args && args[0] === "Init" && Onyx.Skill.Magia.init) Onyx.Skill.Magia.init();
  };

  var _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    if (Onyx.Skill.Magia && Onyx.Skill.Magia.syncVariablesToGame) Onyx.Skill.Magia.syncVariablesToGame();
  };

  var _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    if (Onyx.Skill.Magia && Onyx.Skill.Magia.syncVariablesToGame) Onyx.Skill.Magia.syncVariablesToGame();
  };
})();

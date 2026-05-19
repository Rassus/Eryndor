/*:
 * @plugindesc (Onyx) Skill: Mele - EXP al matar enemigos con arma melee equipada
 * @name SkillMele
 * @author Onyx
 * @version 1.0.0.0
 * @orderAfter Onyx_CombatSkillCore
 *
 * @param varSkillLevel
 * @text Variable: Nivel
 * @type variable
 * @default 57
 *
 * @param varExpActual
 * @text Variable: EXP en nivel
 * @type variable
 * @default 58
 *
 * @param varExpSiguiente
 * @text Variable: EXP siguiente
 * @type variable
 * @default 59
 *
 * @param varMaxSkillLevel
 * @text Variable: Nivel maximo
 * @type variable
 * @default 60
 *
 * @help
 * Requiere: Onyx_CombatSkillCore, WeaponSkillTypes.json (por wtype_id), ExpTable, SkillList (skill_id 6).
 * EXP: al derrotar un enemigo, si el actor que actuo lleva arma tipo melee y la skill esta activa.
 *
 * Plugin command: SkillMele Init
 * Script: Onyx.Skill.Mele.init(), .state(), .addExp(n), .isActive()
 */

(function() {
  "use strict";
  var P = PluginManager.parameters("SkillMele");
  Onyx.CombatSkill.installSkill({
    key: "Mele",
    id: 6,
    name: "Mele",
    combatType: "melee",
    varSkillLevel: Number(P.varSkillLevel || 57),
    varExpActual: Number(P.varExpActual || 58),
    varExpSiguiente: Number(P.varExpSiguiente || 59),
    varMaxSkillLevel: Number(P.varMaxSkillLevel || 60)
  });

  if (Onyx.Skill.Mele) Onyx.Skill.Melee = Onyx.Skill.Mele;

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command !== "SkillMele") return;
    if (args && args[0] === "Init" && Onyx.Skill.Mele.init) Onyx.Skill.Mele.init();
  };

  var _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    if (Onyx.Skill.Mele && Onyx.Skill.Mele.syncVariablesToGame) Onyx.Skill.Mele.syncVariablesToGame();
  };

  var _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    if (Onyx.Skill.Mele && Onyx.Skill.Mele.syncVariablesToGame) Onyx.Skill.Mele.syncVariablesToGame();
  };
})();

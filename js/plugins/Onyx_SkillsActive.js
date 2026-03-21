/*:
 * @plugindesc (Onyx) Sistema de skills activas/aprendidas. Solo se muestran las skills que el jugador ha aprendido.
 * @author Onyx
 * @version 1.0.0
 *
 * @help
 * API:
 *   Onyx.SkillsActive.isActive(skillId)  -> true si la skill está aprendida/activa
 *   Onyx.SkillsActive.setActive(skillId, active) -> marca skill como activa/inactiva
 *   Onyx.SkillsActive.activate(skillId)  -> marca como activa
 *   Onyx.SkillsActive.deactivate(skillId)-> marca como inactiva
 *
 * Cuando el jugador aprende una skill (ej. Tala), llamar Onyx.Skill.Tala.init()
 * que internamente llama Onyx.SkillsActive.activate(1).
 */

(function() {
  "use strict";

  window.Onyx = window.Onyx || {};
  window.Onyx.SkillsActive = window.Onyx.SkillsActive || {};

  function ensureActiveStore() {
    if (!$gameSystem) return null;
    $gameSystem._onyxSkillsActive = $gameSystem._onyxSkillsActive || {};
    return $gameSystem._onyxSkillsActive;
  }

  Onyx.SkillsActive.isActive = function(skillId) {
    var store = ensureActiveStore();
    if (!store) return false;
    return store[Number(skillId)] === true;
  };

  Onyx.SkillsActive.setActive = function(skillId, active) {
    var store = ensureActiveStore();
    if (!store) return;
    var id = Number(skillId);
    if (active) {
      store[id] = true;
    } else {
      delete store[id];
    }
  };

  Onyx.SkillsActive.activate = function(skillId) {
    Onyx.SkillsActive.setActive(skillId, true);
  };

  Onyx.SkillsActive.deactivate = function(skillId) {
    Onyx.SkillsActive.setActive(skillId, false);
  };

  var _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    ensureActiveStore();
  };

  var _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    ensureActiveStore();
  };

})();

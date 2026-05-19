/*:
 * @plugindesc (Onyx) Nucleo: clasificacion de armas y EXP de combate por tipo (melee/range/magic)
 * @author Onyx
 * @version 1.0.0.0
 *
 * @help
 * Requiere WeaponSkillTypes.json: una fila por wtype_id (tipo de arma del sistema),
 * no por cada arma. combat_type: melee | range | magic | none
 * Cargar ANTES de SkillMele / SkillRango / SkillMagia.
 *
 * API:
 *   Onyx.CombatSkill.wtypeCombatType(wtypeId)
 *   Onyx.CombatSkill.weaponCombatType(weaponId)
 *   Onyx.CombatSkill.actorCombatType(actor)
 */

(function() {
  "use strict";

  window.Onyx = window.Onyx || {};
  Onyx.CombatSkill = Onyx.CombatSkill || {};

  function wtypeCombatList() {
    return window.$dataCustom && $dataCustom.WeaponSkillTypes;
  }

  function normalizeCombatType(raw) {
    var t = String(raw || "").toLowerCase();
    if (t === "melee" || t === "range" || t === "magic") return t;
    if (t === "none" || t === "null" || t === "-" || t === "") return null;
    return null;
  }

  function buildWtypeCombatMap() {
    var map = {};
    var list = wtypeCombatList();
    if (!list || !list.length) return map;
    var i, row, wt, t;
    for (i = 0; i < list.length; i++) {
      row = list[i];
      if (!row) continue;
      wt = Number(row.wtype_id);
      if (!wt && row.wtype_id !== 0) continue;
      t = normalizeCombatType(row.combat_type);
      map[wt] = t;
    }
    return map;
  }

  var _wtypeCombatMap = null;

  function getWtypeCombatMap() {
    if (!_wtypeCombatMap) _wtypeCombatMap = buildWtypeCombatMap();
    return _wtypeCombatMap;
  }

  Onyx.CombatSkill.reloadWeaponTypes = function() {
    _wtypeCombatMap = null;
    return getWtypeCombatMap();
  };

  Onyx.CombatSkill.wtypeCombatType = function(wtypeId) {
    var wt = Number(wtypeId) || 0;
    var map = getWtypeCombatMap();
    if (map.hasOwnProperty(wt)) return map[wt];
    if (wt === 7 || wt === 8 || wt === 9) return "range";
    if (wt === 6) return null;
    if (wt > 0) return "melee";
    return null;
  };

  Onyx.CombatSkill.weaponCombatType = function(weaponId) {
    var id = Number(weaponId) || 0;
    if (!id) return null;
    var w = $dataWeapons && $dataWeapons[id];
    if (!w) return null;
    return Onyx.CombatSkill.wtypeCombatType(w.wtypeId);
  };

  Onyx.CombatSkill.actorCombatType = function(actor) {
    if (!actor || !actor.weapons) return null;
    var weapons = actor.weapons();
    if (!weapons || !weapons.length) return null;
    var w = weapons[0];
    if (!w) return null;
    return Onyx.CombatSkill.weaponCombatType(w.id);
  };

  Onyx.CombatSkill.skillApiForCombatType = function(combatType) {
    var t = String(combatType || "").toLowerCase();
    if (!window.Onyx || !Onyx.Skill) return null;
    if (t === "melee") return Onyx.Skill.Mele;
    if (t === "range") return Onyx.Skill.Rango;
    if (t === "magic") return Onyx.Skill.Magia;
    return null;
  };

  Onyx.CombatSkill.onEnemyKilled = function(enemy, subject) {
    if (!enemy || !subject || !subject.isActor || !subject.isActor()) return;
    var exp = Math.floor(Number(enemy.exp && enemy.exp()) || 0);
    if (exp <= 0) return;
    var combatType = Onyx.CombatSkill.actorCombatType(subject);
    if (!combatType) return;
    var api = Onyx.CombatSkill.skillApiForCombatType(combatType);
    if (!api || !api.isActive || !api.addExp) return;
    if (!api.isActive()) return;
    api.addExp(exp);
  };

  var _Game_Enemy_performCollapse = Game_Enemy.prototype.performCollapse;
  Game_Enemy.prototype.performCollapse = function() {
    var subject = BattleManager._subject;
    _Game_Enemy_performCollapse.call(this);
    if (this.isDead && this.isDead()) {
      Onyx.CombatSkill.onEnemyKilled(this, subject);
    }
  };

  var ONYX_GLOBAL_MAX_TOTAL_EXP_STR = "2289796205681772328910848";
  var ONYX_GLOBAL_MAX_TOTAL_EXP = Number(ONYX_GLOBAL_MAX_TOTAL_EXP_STR);

  function clampTotalExp(n) {
    var x = Number(n) || 0;
    if (x < 0) x = 0;
    if (isFinite(ONYX_GLOBAL_MAX_TOTAL_EXP) && x > ONYX_GLOBAL_MAX_TOTAL_EXP) x = ONYX_GLOBAL_MAX_TOTAL_EXP;
    return x;
  }

  function getExpTable() {
    return window.$dataCustom && $dataCustom.ExpTable;
  }

  function expTotalForLevel(level) {
    var n = Math.floor(Number(level)) || 1;
    if (n < 1) return 0;
    var t = getExpTable();
    if (!t) return n <= 5 ? [0, 83, 174, 276, 388][n] || 83 * n : 83 * n;
    var row = t[n];
    if (row == null) row = t[String(n)];
    if (row == null) row = t[n - 1];
    if (row == null) return null;
    if (typeof row === "object" && row !== null && !Array.isArray(row)) {
      var v = row[n];
      if (v == null) v = row[String(n)];
      if (v == null && row[Object.keys(row)[0]] != null) v = row[Object.keys(row)[0]];
      return v != null ? Number(v) || 0 : null;
    }
    return Number(row) || 0;
  }

  function getSkillCapFromList(skillId) {
    var list = window.$dataCustom && $dataCustom.SkillList;
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      if (row && Number(row.skill_id) === Number(skillId)) return Number(row.skill_max_level) || null;
    }
    return null;
  }

  /**
   * Registra Onyx.Skill[key] con nivel/EXP independiente (skill_id en SkillList).
   * cfg: { key, id, name, combatType, varSkillLevel, varExpActual, varExpSiguiente, varMaxSkillLevel }
   */
  Onyx.CombatSkill.installSkill = function(cfg) {
    cfg = cfg || {};
    var key = String(cfg.key || "");
    var skillId = Number(cfg.id) || 0;
    if (!key || !skillId) return null;

    var VAR_SKILL_LEVEL = Number(cfg.varSkillLevel) || 0;
    var VAR_EXP_ACTUAL = Number(cfg.varExpActual) || 0;
    var VAR_EXP_SIGUIENTE = Number(cfg.varExpSiguiente) || 0;
    var VAR_MAX_SKILL_LEVEL = Number(cfg.varMaxSkillLevel) || 0;
    var combatType = String(cfg.combatType || "").toLowerCase();

    Onyx.Skill = Onyx.Skill || {};
    var api = Onyx.Skill[key] = Onyx.Skill[key] || {};

    function getCap() {
      return getSkillCapFromList(skillId) || 99;
    }

    function ensureStore() {
      if (!$gameSystem) return null;
      $gameSystem._onyxSkills = $gameSystem._onyxSkills || {};
      $gameSystem._onyxSkills[skillId] = $gameSystem._onyxSkills[skillId] || {
        skill_lvl: 1,
        skill_total_exp: 0,
        bonus: {},
        stats: { kills: 0 }
      };
      if (!$gameSystem._onyxSkills[skillId].stats) $gameSystem._onyxSkills[skillId].stats = {};
      if ($gameSystem._onyxSkills[skillId].stats.kills == null) $gameSystem._onyxSkills[skillId].stats.kills = 0;
      $gameSystem._onyxSkills[skillId].skill_total_exp = clampTotalExp($gameSystem._onyxSkills[skillId].skill_total_exp);
      return $gameSystem._onyxSkills[skillId];
    }

    function recalcLevelFromTotalExp(totalExp, currentLvl) {
      var cap = getCap();
      var lvl = Math.max(1, Number(currentLvl) || 1);
      var total = Math.max(0, Number(totalExp) || 0);
      while (lvl < cap) {
        var nextTotal = expTotalForLevel(lvl + 1);
        if (nextTotal == null || total < nextTotal) break;
        lvl += 1;
      }
      return lvl;
    }

    function syncVariablesToGame() {
      if (!$gameVariables) return;
      var st = api.state();
      if (VAR_SKILL_LEVEL > 0) $gameVariables.setValue(VAR_SKILL_LEVEL, st.lvl > 0 ? st.lvl : 1);
      if (VAR_EXP_ACTUAL > 0) $gameVariables.setValue(VAR_EXP_ACTUAL, st.expIntoLevel != null ? st.expIntoLevel : 0);
      if (VAR_EXP_SIGUIENTE > 0) $gameVariables.setValue(VAR_EXP_SIGUIENTE, st.nextLevelTotalExp != null ? st.nextLevelTotalExp : 0);
      if (VAR_MAX_SKILL_LEVEL > 0) $gameVariables.setValue(VAR_MAX_SKILL_LEVEL, st.cap || getCap());
    }

    api.SKILL_ID = skillId;
    api.COMBAT_TYPE = combatType;
    api.syncVariablesToGame = syncVariablesToGame;

    api.state = function() {
      var st = ensureStore();
      var cap = getCap();
      if (!st) return { id: skillId, name: cfg.name, lvl: 1, totalExp: 0, cap: cap };
      var lvl = Math.max(1, Number(st.skill_lvl) || 1);
      var total = clampTotalExp(st.skill_total_exp);
      st.skill_total_exp = total;
      lvl = recalcLevelFromTotalExp(total, lvl);
      st.skill_lvl = lvl;
      var curLvlTotal = expTotalForLevel(lvl) || 0;
      var nextLvlTotal = lvl < cap ? expTotalForLevel(lvl + 1) : null;
      return {
        id: skillId,
        name: cfg.name,
        lvl: lvl,
        cap: cap,
        totalExp: total,
        curLvlTotal: curLvlTotal,
        expIntoLevel: Math.max(0, total - curLvlTotal),
        nextLevelTotalExp: nextLvlTotal,
        remaining: nextLvlTotal != null ? Math.max(0, nextLvlTotal - total) : 0
      };
    };

    api.addExp = function(amount) {
      var st = ensureStore();
      if (!st) return { ok: false, leveledUp: false };
      var add = Number(amount) || 0;
      if (add <= 0) return { ok: true, added: 0, leveledUp: false, state: api.state() };
      var beforeLvl = Math.max(1, Number(st.skill_lvl) || 1);
      var beforeTotal = clampTotalExp(st.skill_total_exp);
      var afterTotal = clampTotalExp(beforeTotal + add);
      st.skill_total_exp = afterTotal;
      st.skill_lvl = recalcLevelFromTotalExp(afterTotal, beforeLvl);
      if (st.stats) st.stats.kills = (Number(st.stats.kills) || 0) + 1;
      syncVariablesToGame();
      return {
        ok: true,
        added: afterTotal - beforeTotal,
        leveledUp: st.skill_lvl > beforeLvl,
        levelUps: Math.max(0, st.skill_lvl - beforeLvl),
        state: api.state()
      };
    };

    api.init = function() {
      if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.activate) Onyx.SkillsActive.activate(skillId);
      var st = ensureStore();
      if (!st) return false;
      st.skill_lvl = 1;
      st.skill_total_exp = 0;
      if (st.stats) st.stats.kills = 0;
      syncVariablesToGame();
      return true;
    };

    api.isActive = function() {
      if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.isActive) return Onyx.SkillsActive.isActive(skillId);
      return true;
    };

    api.reset = function() {
      var st = ensureStore();
      if (!st) return false;
      st.skill_lvl = 1;
      st.skill_total_exp = 0;
      if (st.stats) st.stats.kills = 0;
      syncVariablesToGame();
      return true;
    };

    api.setLevel = function(level) {
      var st = ensureStore();
      if (!st) return false;
      var cap = getCap();
      var lvl = Math.max(1, Math.min(cap, Math.floor(Number(level)) || 1));
      st.skill_lvl = lvl;
      st.skill_total_exp = clampTotalExp(expTotalForLevel(lvl) || 0);
      syncVariablesToGame();
      return true;
    };

    api.hasValidWeaponEquipped = function(actor) {
      actor = actor || ($gameParty && $gameParty.leader && $gameParty.leader());
      if (!actor) return false;
      return Onyx.CombatSkill.actorCombatType(actor) === combatType;
    };

    return api;
  };

})();

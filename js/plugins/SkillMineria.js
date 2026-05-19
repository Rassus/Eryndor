/*:
 * @plugindesc (Onyx) v1.0.0.0 - Skill: Minería - variables, EXP por MaterialRewards (igual que Tala)
 * @name SkillMineria
 * @author Onyx
 * @version 1.0.0.0
 *
 * @param varSkillLevel
 * @text Variable: Nivel de Skill
 * @type variable
 * @default 46
 *
 * @param varExpActual
 * @text Variable: EXP actual (dentro del nivel)
 * @type variable
 * @default 47
 *
 * @param varExpSiguiente
 * @text Variable: EXP siguiente (total del nivel actual)
 * @type variable
 * @default 48
 *
 * @param varMaterialId
 * @text Variable: material_id (para addExpFromMaterialVar)
 * @type variable
 * @default 38
 *
 * @param varMaxSkillLevel
 * @text Variable: Nivel máximo de Skill
 * @type variable
 * @default 49
 *
 * @param gemItemId
 * @text Ítem: gema al minar (bonus)
 * @type item
 * @default 0
 * @desc 0 = desactivado (la tirada de gemas no da nada). SkillUnlocks suma mining_gem_chance_base.
 *
 * @help
 * skill_id 2 en SkillList.json. Herramientas: picos en Armors 114–126 (ToolLevelList skill_id 2).
 * Requiere: ExpTable, SkillList, MaterialRewards (material_id de vetas/mineral en MaterialRewards).
 *
 * Bonos (SkillUnlocks skill_id 2, update *_base → acumula en bonus): triple mineral (tiradas ×3 en
 * giveMiningOreChunks), probabilidad de gema (parámetro gemItemId), mena sin daño (no baja c_hp).
 *
 * API (paridad con SkillTala):
 *   Onyx.Skill.Mineria.state()
 *   Onyx.Skill.Mineria.addExp(n), addExpFromMaterial(materialId), addExpFromMaterialVar()
 *   Onyx.Skill.Mineria.setLevel, reset, init, isActive
 *   getMiningHitChance, getMiningCritChance, getPickaxeBreakChance, getOreExtraChance
 *   refreshBonusFromUnlocks(), getMiningGemChance(), hasTripleOre(), hasPreserveMiningNode(), tryRollGemDrop() → itemId o 0
 */

(function() {
  "use strict";
  var SKILL_MINERIA_VERSION = "1.0.0.0";

  var ONYX_GLOBAL_MAX_TOTAL_EXP_STR = "2289796205681772328910848";
  var ONYX_GLOBAL_MAX_TOTAL_EXP = Number(ONYX_GLOBAL_MAX_TOTAL_EXP_STR);

  function clampTotalExp(n) {
    var x = Number(n) || 0;
    if (x < 0) x = 0;
    if (isFinite(ONYX_GLOBAL_MAX_TOTAL_EXP) && x > ONYX_GLOBAL_MAX_TOTAL_EXP) x = ONYX_GLOBAL_MAX_TOTAL_EXP;
    return x;
  }

  var PARAMS = PluginManager.parameters("SkillMineria");
  var VAR_SKILL_LEVEL = Number(PARAMS["varSkillLevel"] || 46);
  var VAR_EXP_ACTUAL = Number(PARAMS["varExpActual"] || 47);
  var VAR_EXP_SIGUIENTE = Number(PARAMS["varExpSiguiente"] || 48);
  var VAR_MATERIAL_ID = Number(PARAMS["varMaterialId"] || 38);
  var VAR_MAX_SKILL_LEVEL = Number(PARAMS["varMaxSkillLevel"] || 49);
  function parseGemItemParam() {
    var v = PARAMS["gemItemId"];
    if (v == null || v === "") return 0;
    var n = Number(v);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
  }
  var GEM_ITEM_ID = parseGemItemParam();

  window.Onyx = window.Onyx || {};
  Onyx.Skill = Onyx.Skill || {};
  Onyx.Skill.Mineria = Onyx.Skill.Mineria || {};

  var C = {
    ID: 2,
    NAME: "Minería",
    mining_hit_chance_base: 75,
    mining_crit_chance_base: 10,
    break_pickaxe_base_chance: 0.025,
    ore_extra_chance_base: 15,
    mining_gem_chance_base: 0
  };

  var MINING_BONUS_KEYS = [
    "mining_hit_chance",
    "mining_crit_chance",
    "break_pickaxe_chance",
    "ore_extra_chance",
    "mining_triple_ore",
    "mining_gem_chance",
    "mining_preserve_node"
  ];

  function bonusKeyFromSkillUnlockUpdate(upd) {
    if (!upd) return null;
    var s = String(upd);
    if (s.length > 5 && s.slice(-5) === "_base") return s.slice(0, -5);
    return s;
  }

  function mergeMiningBonusDefaults(st) {
    if (!st) return;
    if (!st.bonus) st.bonus = {};
    for (var i = 0; i < MINING_BONUS_KEYS.length; i++) {
      var k = MINING_BONUS_KEYS[i];
      if (st.bonus[k] == null) st.bonus[k] = 0;
    }
  }
  var MINING_TABLE_VAR_ID = 1002;
  var MINING_SLOTS_PER_MATERIAL = 1000;

  function getExpTable() {
    return window.$dataCustom && window.$dataCustom.ExpTable;
  }

  var _expTableWarned = false;
  function expTotalForLevelFallback(level) {
    var fallback = { 1: 0, 2: 83, 3: 174, 4: 276, 5: 388 };
    var val = fallback[level];
    if (val != null) return val;
    if (level < 1) return 0;
    return 83 * level;
  }

  function expTotalForLevel(level) {
    var n = Math.floor(Number(level)) || 1;
    if (n < 1) return 0;
    var t = getExpTable();
    if (!t) {
      if (!_expTableWarned) {
        _expTableWarned = true;
        console.warn("[SkillMineria] ExpTable no cargado. Usando fallback.");
      }
      return expTotalForLevelFallback(n);
    }
    var row = t[n];
    if (row == null) row = t[String(n)];
    if (row == null) row = t[n - 1];
    if (row == null) return null;
    if (typeof row === "object" && row !== null && !Array.isArray(row)) {
      var v = row[n];
      if (v == null) v = row[String(n)];
      if (v == null && typeof row.n !== "undefined") v = row.n;
      if (v == null) {
        var keys = Object.keys(row);
        if (keys.length > 0) v = row[keys[0]];
      }
      if (v == null) return null;
      return Number(v) || 0;
    }
    return Number(row) || 0;
  }

  function getSkillCapFromList(skillId) {
    var list = window.$dataCustom && window.$dataCustom.SkillList;
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      if (row && Number(row.skill_id) === Number(skillId)) {
        return Number(row.skill_max_level) || null;
      }
    }
    return null;
  }

  function getCap() {
    return getSkillCapFromList(C.ID) || 99;
  }

  // ============================================================
  // 3) STORAGE (persistente en save)
  // ============================================================
  function ensureStore() {
    if (!$gameSystem) return null;

    $gameSystem._onyxSkills = $gameSystem._onyxSkills || {};
    $gameSystem._onyxSkills[C.ID] = $gameSystem._onyxSkills[C.ID] || {
      skill_lvl: 1,
      skill_total_exp: 0,
      skill_exp_mul: 1,
      skill_lvl_virtual: 0,

      //Bonus
      bonus: {
        mining_hit_chance: 0,
        mining_crit_chance: 0,
        break_pickaxe_chance: 0,
        ore_extra_chance: 0,
        mining_triple_ore: 0,
        mining_gem_chance: 0,
        mining_preserve_node: 0
      },

      // (Opcional) estadísticas del grupo
      stats: {
        rocks_mined: 0,
        pickaxes_broken: 0
      }

    };
    // Asegurar clamp del tope global de EXP
    $gameSystem._onyxSkills[C.ID].skill_total_exp = clampTotalExp($gameSystem._onyxSkills[C.ID].skill_total_exp);
    return $gameSystem._onyxSkills[C.ID];
  }

  function ensureMiningBonusesFresh() {
    if (Onyx.Skill.Mineria.refreshBonusFromUnlocks) Onyx.Skill.Mineria.refreshBonusFromUnlocks();
  }

  Onyx.Skill.Mineria.refreshBonusFromUnlocks = function() {
    var st = ensureStore();
    if (!st) return;
    var cap = getCap();
    var lvl = Math.max(1, Number(st.skill_lvl) || 1);
    var total = clampTotalExp(st.skill_total_exp);
    st.skill_total_exp = total;
    lvl = recalcLevelFromTotalExp(total, lvl);
    if (lvl > cap) lvl = cap;
    st.skill_lvl = lvl;
    mergeMiningBonusDefaults(st);
    var list = window.$dataCustom && window.$dataCustom.SkillUnlocks;
    var accum = {};
    for (var a = 0; a < MINING_BONUS_KEYS.length; a++) accum[MINING_BONUS_KEYS[a]] = 0;
    if (list && Array.isArray(list)) {
      var lvl = Math.max(1, Number(st.skill_lvl) || 1);
      for (var i = 0; i < list.length; i++) {
        var row = list[i];
        if (!row || Number(row.skill_id) !== C.ID) continue;
        if (Number(row.lvl) > lvl) continue;
        if (!row.update || row.value == null) continue;
        var key = bonusKeyFromSkillUnlockUpdate(row.update);
        if (accum[key] === undefined) continue;
        accum[key] += Number(row.value) || 0;
      }
    }
    for (var k in accum) st.bonus[k] = accum[k];
  };

  function recalcLevelFromTotalExp(totalExp, currentLvl) {
    var cap = getCap();
    var lvl = Math.max(1, Number(currentLvl) || 1);
    var total = Math.max(0, Number(totalExp) || 0);
    while (lvl < cap) {
      var nextTotal = expTotalForLevel(lvl + 1);
      if (nextTotal == null) break;
      if (total < nextTotal) break;
      lvl += 1;
    }
    return lvl;
  }

  function syncVariablesToGame() {
    if (!$gameVariables) return;
    var st = Onyx.Skill.Mineria.state();
    if (VAR_SKILL_LEVEL > 0) {
      $gameVariables.setValue(VAR_SKILL_LEVEL, st.lvl > 0 ? st.lvl : 1);
    }
    if (VAR_EXP_ACTUAL > 0) {
      var expAct = st.expIntoLevel;
      if (expAct == null) expAct = 0;
      $gameVariables.setValue(VAR_EXP_ACTUAL, expAct);
    }
    if (VAR_EXP_SIGUIENTE > 0) {
      var nextVal = st.nextLevelTotalExp != null ? st.nextLevelTotalExp : st.curLvlTotal;
      if (nextVal == null) nextVal = 0;
      $gameVariables.setValue(VAR_EXP_SIGUIENTE, nextVal);
    }
  }

  Onyx.Skill.Mineria.constants = function() {
    return JSON.parse(JSON.stringify(C));
  };

  Onyx.Skill.Mineria.getMiningHitChance = function() {
    ensureMiningBonusesFresh();
    var st = ensureStore();
    var base = Number(C.mining_hit_chance_base) || 75;
    var bonus = st && st.bonus ? Number(st.bonus.mining_hit_chance) || 0 : 0;
    return Math.min(100, Math.max(0, base + bonus));
  };

  Onyx.Skill.Mineria.getMiningCritChance = function() {
    ensureMiningBonusesFresh();
    var st = ensureStore();
    var base = Number(C.mining_crit_chance_base) || 10;
    var bonus = st && st.bonus ? Number(st.bonus.mining_crit_chance) || 0 : 0;
    return Math.min(100, Math.max(0, base + bonus));
  };

  /** Probabilidad 0–1 de romper pico en crítico (paridad con getWoodHatchetBreakChance / SkillTala). */
  Onyx.Skill.Mineria.getPickaxeBreakChance = function() {
    ensureMiningBonusesFresh();
    var st = ensureStore();
    var base = Number(C.break_pickaxe_base_chance) || 0.025;
    var rawBonus = st && st.bonus ? Number(st.bonus.break_pickaxe_chance) || 0 : 0;
    var bonusPercent = rawBonus > 0 && rawBonus <= 1 ? rawBonus * 100 : rawBonus;
    var percent = Math.min(100, Math.max(0, base + bonusPercent));
    return percent / 100;
  };

  Onyx.Skill.Mineria.getOreExtraChance = function() {
    ensureMiningBonusesFresh();
    var st = ensureStore();
    var base = Number(C.ore_extra_chance_base) || 15;
    var bonus = st && st.bonus ? Number(st.bonus.ore_extra_chance) || 0 : 0;
    return Math.min(100, Math.max(0, base + bonus));
  };

  Onyx.Skill.Mineria.getMiningGemChance = function() {
    ensureMiningBonusesFresh();
    var st = ensureStore();
    var base = Number(C.mining_gem_chance_base) || 0;
    var bonus = st && st.bonus ? Number(st.bonus.mining_gem_chance) || 0 : 0;
    return Math.min(100, Math.max(0, base + bonus));
  };

  Onyx.Skill.Mineria.hasTripleOre = function() {
    ensureMiningBonusesFresh();
    var st = ensureStore();
    return st && st.bonus && Number(st.bonus.mining_triple_ore) > 0;
  };

  Onyx.Skill.Mineria.hasPreserveMiningNode = function() {
    ensureMiningBonusesFresh();
    var st = ensureStore();
    return st && st.bonus && Number(st.bonus.mining_preserve_node) > 0;
  };

  /**
   * Una tirada por golpe exitoso. Requiere gemItemId > 0 en parámetros del plugin.
   * @returns {number} id del ítem de gema si se entregó una unidad, 0 si no
   */
  Onyx.Skill.Mineria.tryRollGemDrop = function() {
    var id = GEM_ITEM_ID;
    if (!(id > 0)) return 0;
    var pct = Onyx.Skill.Mineria.getMiningGemChance();
    if (!(pct > 0)) return 0;
    if (Math.random() * 100 >= pct) return 0;
    var item = $dataItems && $dataItems[id];
    if (!item) return 0;
    $gameParty.gainItem(item, 1);
    return id;
  };

  Onyx.Skill.Mineria.state = function() {
    var st = ensureStore();
    var cap = getCap();
    if (!st) {
      return { id: C.ID, name: C.NAME, lvl: 1, totalExp: 0, cap: cap };
    }
    var lvl = Math.max(1, Number(st.skill_lvl) || 1);
    var total = clampTotalExp(st.skill_total_exp);
    st.skill_total_exp = total;
    lvl = recalcLevelFromTotalExp(total, lvl);
    st.skill_lvl = lvl;
    var curLvlTotal = expTotalForLevel(lvl) || 0;
    var nextLvlTotal = lvl < cap ? expTotalForLevel(lvl + 1) : null;
    var expIntoLevel = Math.max(0, total - curLvlTotal);
    var remaining = nextLvlTotal != null ? Math.max(0, nextLvlTotal - total) : 0;
    return {
      id: C.ID,
      name: C.NAME,
      lvl: lvl,
      cap: cap,
      totalExp: total,
      curLvlTotal: curLvlTotal,
      expIntoLevel: expIntoLevel,
      nextLevelTotalExp: nextLvlTotal,
      remaining: remaining
    };
  };

  Onyx.Skill.Mineria.addExp = function(amount) {
    var st = ensureStore();
    if (!st) return { ok: false, reason: "no_gamesystem", leveledUp: false };
    var add = Number(amount) || 0;
    if (add <= 0) {
      return { ok: true, added: 0, levelUps: 0, leveledUp: false, state: Onyx.Skill.Mineria.state() };
    }
    var cap = getCap();
    var beforeLvl = Math.max(1, Number(st.skill_lvl) || 1);
    var beforeTotal = clampTotalExp(st.skill_total_exp);
    var afterTotal = clampTotalExp(beforeTotal + add);
    st.skill_total_exp = afterTotal;
    var afterLvl = recalcLevelFromTotalExp(st.skill_total_exp, beforeLvl);
    if (afterLvl > cap) afterLvl = cap;
    st.skill_lvl = afterLvl;
    syncVariablesToGame();
    var levelUps = Math.max(0, afterLvl - beforeLvl);
    if (Onyx.Skill.Mineria.refreshBonusFromUnlocks) Onyx.Skill.Mineria.refreshBonusFromUnlocks();
    return {
      ok: true,
      added: Math.max(0, afterTotal - beforeTotal),
      levelUps: levelUps,
      leveledUp: levelUps > 0,
      state: Onyx.Skill.Mineria.state()
    };
  };

  function getMaterialEntry(materialId) {
    var list = window.$dataCustom && window.$dataCustom.MaterialRewards;
    if (!list || !Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      if (row && Number(row.material_id) === Number(materialId)) return row;
    }
    return null;
  }

  Onyx.Skill.Mineria.addExpFromMaterial = function(materialId) {
    var entry = getMaterialEntry(materialId);
    if (!entry || entry.exp == null || Number(entry.exp) <= 0) {
      return { ok: true, added: 0, levelUps: 0, leveledUp: false, state: Onyx.Skill.Mineria.state() };
    }
    return Onyx.Skill.Mineria.addExp(Number(entry.exp) || 0);
  };

  Onyx.Skill.Mineria.addExpFromMaterialVar = function() {
    var materialId = $gameVariables ? $gameVariables.value(VAR_MATERIAL_ID) : 0;
    return Onyx.Skill.Mineria.addExpFromMaterial(materialId);
  };

  Onyx.Skill.Mineria.setLevel = function(level) {
    var st = ensureStore();
    if (!st) return false;
    var cap = getCap();
    var lvl = Math.floor(Number(level) || 1);
    if (lvl < 1) lvl = 1;
    if (lvl > cap) lvl = cap;
    var minTotal = expTotalForLevel(lvl);
    if (minTotal == null) minTotal = 0;
    st.skill_lvl = lvl;
    st.skill_total_exp = clampTotalExp(Number(minTotal) || 0);
    syncVariablesToGame();
    if (Onyx.Skill.Mineria.refreshBonusFromUnlocks) Onyx.Skill.Mineria.refreshBonusFromUnlocks();
    return true;
  };

  Onyx.Skill.Mineria.reset = function() {
    var st = ensureStore();
    if (!st) return false;
    st.skill_lvl = 1;
    st.skill_total_exp = 0;
    syncVariablesToGame();
    if (Onyx.Skill.Mineria.refreshBonusFromUnlocks) Onyx.Skill.Mineria.refreshBonusFromUnlocks();
    return true;
  };

  Onyx.Skill.Mineria.isActive = function() {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.isActive) {
      return Onyx.SkillsActive.isActive(C.ID);
    }
    return true;
  };

  Onyx.Skill.Mineria.getEffectiveBonusValues = function() {
    ensureMiningBonusesFresh();
    var st = ensureStore();
    var bonus = st && st.bonus ? st.bonus : {};
    var base = {
      mining_hit_chance: C.mining_hit_chance_base || 75,
      mining_crit_chance: C.mining_crit_chance_base || 10,
      break_pickaxe_chance: (C.break_pickaxe_base_chance || 0.025) * 100,
      ore_extra_chance: C.ore_extra_chance_base || 15,
      mining_gem_chance: C.mining_gem_chance_base || 0,
      mining_triple_ore: 0,
      mining_preserve_node: 0
    };
    var labels = {
      mining_hit_chance: "Precisión (minera)",
      mining_crit_chance: "Crítico (minera)",
      break_pickaxe_chance: "Romper pico (crít.)",
      ore_extra_chance: "Mineral extra / golpe",
      mining_gem_chance: "Gema al minar (%)",
      mining_triple_ore: "Triple mineral (tiradas)",
      mining_preserve_node: "Mena sin daño (activo)"
    };
    var out = {};
    var k;
    for (k in base) {
      var b = Number(bonus[k]) || 0;
      if (k === "break_pickaxe_chance") b = b > 0 && b <= 1 ? b * 100 : b;
      if (k === "mining_triple_ore") {
        out[k] = { label: labels[k], value: Number(bonus.mining_triple_ore) > 0 ? 1 : 0 };
        continue;
      }
      if (k === "mining_preserve_node") {
        out[k] = { label: labels[k], value: Number(bonus.mining_preserve_node) > 0 ? 1 : 0 };
        continue;
      }
      out[k] = { label: labels[k] || k, value: base[k] + b };
    }
    return out;
  };

  function miningMaterialOrder() {
    var list = [];
    var m;
    for (m = 73; m <= 83; m++) list.push(m);
    return list;
  }

function miningNodeLevelSequenceFromNeed() {
  var out = [];
  var need = window.$dataCustom && window.$dataCustom.SkillNodeLevelNeed;
  if (!need || !Array.isArray(need)) return out;
  for (var i = 0; i < need.length; i++) {
    var row = need[i];
    if (!row) continue;
    if (Number(row.skill_id) !== Number(C.ID)) continue;
    var nl = Number(row.node_lvl) || 0;
    if (nl <= 0) continue;
    out.push(nl);
  }
  return out;
}

  function miningParamsForMaterial(ma_id) {
    var m = Number(ma_id) || 73;
    var idx = m - 73; // 0..10
  var tool_lvl = idx <= 8 ? idx + 1 : 9;
    var no_lvl = tool_lvl;
    return { no_lvl: no_lvl, tool_lvl: tool_lvl };
  }

  function buildMiningNodeTable1002() {
    var table = {};
    var node_hp = [null, 15, 25, 35, 45, 55, 65, 75, 85, 95, 105];
    var order = miningMaterialOrder();
  var needSeq = miningNodeLevelSequenceFromNeed();
    var i, from, to, id, p;
    for (i = 0; i < order.length; i++) {
      from = i * MINING_SLOTS_PER_MATERIAL + 1;
      to = from + MINING_SLOTS_PER_MATERIAL - 1;
    p = miningParamsForMaterial(order[i]);
    // Prioriza SkillNodeLevelNeed (skill_id 2) para node_lvl por material.
    // Si faltan filas, mantiene fallback histórico.
    if (needSeq && needSeq.length > 0) {
      var seqLvl = Number(needSeq[i]) || 0;
      if (seqLvl <= 0 && needSeq.length > 0) seqLvl = Number(needSeq[needSeq.length - 1]) || 0;
      if (seqLvl > 0) {
        p.no_lvl = seqLvl;
        p.tool_lvl = seqLvl;
      }
    }
    var hpLvl = Number(p.no_lvl) || 1;
    if (hpLvl < 1) hpLvl = 1;
    if (hpLvl >= node_hp.length) hpLvl = node_hp.length - 1;
      for (id = from; id <= to; id++) {
        table[id] = {
          ma_id: order[i],
        c_hp: node_hp[hpLvl],
        max_hp: node_hp[hpLvl],
          no_lvl: p.no_lvl,
          tool_lvl: p.tool_lvl,
          active: 1
        };
      }
    }
    return table;
  }

  function needsMiningTable1002Init() {
    var v = $gameVariables ? $gameVariables.value(MINING_TABLE_VAR_ID) : null;
    if (!v || typeof v !== "object" || Array.isArray(v)) return true;
    var keys = Object.keys(v);
    if (keys.length === 0) return true;

    var first = v[1];
    if (!first || Number(first.ma_id) !== 73) return true;
    if (Number(first.c_hp) <= 0) return true;

    var order = miningMaterialOrder();
    var lastId = order.length * MINING_SLOTS_PER_MATERIAL;
    var last = v[lastId];
    if (!last || Number(last.ma_id) !== order[order.length - 1]) return true;
    if (Number(last.c_hp) <= 0) return true;

    return false;
  }

  Onyx.Skill.Mineria.MINING_TABLE_VAR_ID = MINING_TABLE_VAR_ID;
  Onyx.Skill.Mineria.MINING_SLOTS_PER_MATERIAL = MINING_SLOTS_PER_MATERIAL;
  Onyx.Skill.Mineria.miningMaterialOrder = miningMaterialOrder;
  Onyx.Skill.Mineria.buildMiningNodeTable1002 = buildMiningNodeTable1002;
  Onyx.Skill.Mineria.ensureMiningTableVar1002 = function() {
    if (!$gameVariables) return;
    if (needsMiningTable1002Init()) {
      $gameVariables.setValue(MINING_TABLE_VAR_ID, buildMiningNodeTable1002());
    }
  };

  Onyx.Skill.Mineria.init = function() {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.activate) {
      Onyx.SkillsActive.activate(C.ID);
    }
    var skill_list = window.$dataCustom && window.$dataCustom.SkillList;
    var max_lvl = 150;
    if (skill_list) {
      for (var i = 0; i < skill_list.length; i++) {
        var row = skill_list[i];
        if (row && Number(row.skill_id) === C.ID) {
          max_lvl = Number(row.skill_max_level) || 150;
          break;
        }
      }
    }
    var ok = Onyx.Skill.Mineria.reset();
    if (!ok) return false;
    var st = ensureStore();
    if (st) {
      st.skill_lvl = 1;
      st.skill_total_exp = 0;
    }
    if ($gameVariables && VAR_SKILL_LEVEL > 0) {
      $gameVariables.setValue(VAR_SKILL_LEVEL, 1);
    }
    syncVariablesToGame();
    if ($gameVariables && VAR_MAX_SKILL_LEVEL > 0) {
      $gameVariables.setValue(VAR_MAX_SKILL_LEVEL, max_lvl);
    }
    if (Onyx.Skill.Mineria.refreshBonusFromUnlocks) Onyx.Skill.Mineria.refreshBonusFromUnlocks();
    return true;
  };

  var _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    ensureStore();
    syncVariablesToGame();
  };

  var _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    ensureStore();
    if (Onyx.Skill.Mineria.refreshBonusFromUnlocks) Onyx.Skill.Mineria.refreshBonusFromUnlocks();
    syncVariablesToGame();
    if (Onyx.Skill.Mineria.ensureMiningTableVar1002) {
      Onyx.Skill.Mineria.ensureMiningTableVar1002();
    }
  };

  var _Scene_Map_start = Scene_Map.prototype.start;
  Scene_Map.prototype.start = function() {
    _Scene_Map_start.call(this);
    if (Onyx.Skill.Mineria.ensureMiningTableVar1002) {
      Onyx.Skill.Mineria.ensureMiningTableVar1002();
    }
  };

  var _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    if ($gameVariables && Number($gameVariables.value(33)) === C.ID) {
      syncVariablesToGame();
    }
  };
})();

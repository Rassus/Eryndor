/*:
 * @plugindesc (Onyx) v1.0.0.0 - Skill: Tala - variables, constantes y EXP por tabla (RPG Maker MV)
 * @name SkillTala
 * @author Onyx
 * @version 1.0.0.0
 *
 * @param varSkillLevel
 * @text Variable: Nivel de Skill
 * @type variable
 * @default 21
 *
 * @param varExpActual
 * @text Variable: EXP actual (dentro del nivel)
 * @type variable
 * @default 25
 *
 * @param varExpSiguiente
 * @text Variable: EXP siguiente (total del nivel actual)
 * @type variable
 * @default 43
 * @desc Según ExpTable: EXP total para estar en este nivel (nivel 1=0, 2=83, 3=174, 4=276...).
 *
 * @param varMaterialId
 * @text Variable: material_id (para addExpFromMaterialVar)
 * @type variable
 * @default 38
 *
 * @param varMaxSkillLevel
 * @text Variable: Nivel máximo de Skill
 * @type variable
 * @default 29
 *
 * @help
 * Requiere:
 *  - $dataCustom.ExpTable    (ExpTable.json)
 *  - $dataCustom.SkillList   (SkillList.json)
 *  - $dataCustom.MaterialRewards (MaterialRewards.json)
 *
 * Variables de juego (configurables): el plugin actualiza automáticamente
 * las variables cuando usas addExp(), setLevel() o reset(). Usa 0 para desactivar.
 *
 * Importante: los eventos [SYSTEM] Var Init y [SKILL] Level Up copian Var 43 = Var 37.
 * SkillTala también escribe Var 37 para que esa copia no sobrescriba con 0.
 *
 * API:
 *   Onyx.Skill.Tala.state()        -> { lvl, totalExp, expIntoLevel, nextLevelTotalExp, remaining, cap }
 *   Onyx.Skill.Tala.addExp(10)     -> { ok, added, levelUps, leveledUp, state } + actualiza variables
 *   Onyx.Skill.Tala.addExpFromMaterial(materialId) -> busca exp en MaterialRewards, llama addExp
 *   Onyx.Skill.Tala.addExpFromMaterialVar() -> usa variable configurada (varMaterialId) como material_id
 *   Onyx.Skill.Tala.setLevel(5)    -> fuerza nivel + actualiza variables
 *   Onyx.Skill.Tala.reset()        -> reset + actualiza variables
 *   Onyx.Skill.Tala.init()         -> inicializa la skill (nivel 1, 0 EXP, actualiza variables). Llámalo cuando el jugador aprende Talar.
 */

(function() {
  "use strict";
  var SKILL_TALA_VERSION = "1.0.0.0";

  // Tope GLOBAL de EXP total (no se puede acumular más que esto, independiente de nivel/skill)
  var ONYX_GLOBAL_MAX_TOTAL_EXP_STR = "2289796205681772328910848";
  var ONYX_GLOBAL_MAX_TOTAL_EXP = Number(ONYX_GLOBAL_MAX_TOTAL_EXP_STR);

  function clampTotalExp(n) {
    var x = Number(n) || 0;
    if (x < 0) x = 0;
    if (isFinite(ONYX_GLOBAL_MAX_TOTAL_EXP) && x > ONYX_GLOBAL_MAX_TOTAL_EXP) x = ONYX_GLOBAL_MAX_TOTAL_EXP;
    return x;
  }

  // Parámetros del plugin (Variables de juego)
  var PARAMS = PluginManager.parameters("SkillTala");
  var VAR_SKILL_LEVEL = Number(PARAMS["varSkillLevel"] || 21);
  var VAR_EXP_ACTUAL = Number(PARAMS["varExpActual"] || 25);
  var VAR_EXP_SIGUIENTE = Number(PARAMS["varExpSiguiente"] || 43);
  var VAR_MATERIAL_ID = Number(PARAMS["varMaterialId"] || 38);
  var VAR_MAX_SKILL_LEVEL = Number(PARAMS["varMaxSkillLevel"] || 29);

  // Namespace
  window.Onyx = window.Onyx || {};
  Onyx.Skill = Onyx.Skill || {};
  Onyx.Skill.Tala = Onyx.Skill.Tala || {};

  // ============================================================
  // 1) CONSTANTES (TU DATA)
  // ============================================================
  var C = {
    ID: 1,
    NAME: "Tala",

    // Valores Base de la Skill
    doble_reward_min_lvl: 1,
    bird_nest_reward_min_lvl: 1,
    bird_nest_egg_reward_min_lvl: 35,
    bird_nest_treasure_reward_min_lvl: 70,

    bird_nest_reward_base_chance: 8.5,
    bird_nest_egg_reward_base_chance: 0.75,
    bird_nest_treasure_reward_base_chance: 0.000026,

    doble_reward_chance_base: 15,

    // Troncos extra por cada 1 HP de daño (chance %)
    tree_extra_log_chance_base: 15,

    // Hacha: base para hit y crit (pociones u otros efectos suman bonus)
    wood_hit_chance_base: 75,
    wood_crit_chance_base: 10,

    // Recoleccion
    tree_seed_reward_min_lvl_drop: 5,
    tree_root_reward_min_lvl_drop: 25,
    tree_crust_reward_min_lvl_drop: 60,
    tree_sap_reward_min_lvl_drop: 40,

    tree_seed_reward_base_chance: 2,
    tree_root_reward_base_chance: 10,
    tree_crust_reward_base_chance: 1.45,
    tree_sap_reward_base_chance: 2.9,  

    // Entomologia
    buggy_reward_min_lvl: 5,
    buggy_egg_reward_min_lvl: 55,
    buggy_combat_min_lvl: 20,
    buggy_reward_base_chance: 4,
    buggy_combat_base_chance: 8,
    buggy_egg_reward_base_chance: 0.018,

    // Micologia
    mushroom_reward_min_lvl: 25,
    mushroom_spore_reward_min_lvl: 40,
    mushroom_reward_base_chance: 5,
    mushroom_to_sick_base_chance: 65,
    mushroom_combat_base_chance: 12,
    mushroom_spore_reward_base_chance: 1.15,

    // Combate
    combat_random_monster_lvl_min: 0.01,
    combat_bird_monster_base_chance: 0.125,
    combat_evil_tree_event_base_chance: 0.00025,

    // Eventos al talar un arbol
    break_hatche_base_chance: 0.025,
    wise_old_tree_base_chance: 0.00065,
    nature_spirit_base_chance: 0.044,
    sap_rain_base_chance: 0.16,
    living_root_base_chance: 0.0000036,
    termites_war_base_chance: 0.00465
  };

  // ============================================================
  // 2) Helpers: acceso a tablas
  // ============================================================
  function getExpTable() {
    // Esperado: $dataCustom.ExpTable (obj con keys "1","2",.. o numbers)
    return window.$dataCustom && window.$dataCustom.ExpTable;
  }

  var _expTableWarned = false;
  function expTotalForLevel(level) {
    var n = Math.floor(Number(level)) || 1;
    if (n < 1) return 0;
    var t = getExpTable();
    if (!t) {
      if (!_expTableWarned) {
        _expTableWarned = true;
        console.warn("[SkillTala] ExpTable no cargado aún ($dataCustom.ExpTable). Usando fallback para nivel 1–5.");
      }
      return expTotalForLevelFallback(n);
    }
    // Array: índice 0 = null, índice 1 = nivel 1, ... o índice 0 = nivel 1 (sin null)
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

  function expTotalForLevelFallback(level) {
    var fallback = { 1: 0, 2: 83, 3: 174, 4: 276, 5: 388 };
    var val = fallback[level];
    if (val != null) return val;
    if (level < 1) return 0;
    return 83 * level;
  }

  function getSkillCapFromList(skillId) {
    var list = window.$dataCustom && window.$dataCustom.SkillList;
    if (!list) return null;

    // SkillList.json viene como array con objetos {skill_id,...}
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      if (row && Number(row.skill_id) === Number(skillId)) {
        return Number(row.skill_max_level) || null;
      }
    }
    return null;
  }

  function getCap() {
    return getSkillCapFromList(C.ID) || 99; // fallback
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
        doble_reward_chance: 0,
        bird_nest_chance: 0,
        bird_nest_egg_chance: 0,
        bird_nest_treasure_chance: 0,
        mushroom_reward_chance: 0,
        tree_seed_reward_chance: 0,
        tree_root_reward_chance: 0,
        tree_crust_reward_chance: 0,
        tree_sap_reward_chance: 0,
        tree_extra_log_chance: 0,
        wood_hit_chance: 0,
        wood_crit_chance: 0,
        buggy_reward_chance: 0,
        buggy_combat_chance: 0,
        combat_evil_tree_chance: 0,

        break_hatche_chance: 0,
        wise_old_tree_chance: 0,
        nature_spirit_chance: 0,
        sap_rain_chance: 0,
        living_root_chance: 0,
        termites_war_chance: 0
      },

      // (Opcional) estadísticas del grupo
      stats: {
        trees_cut: 0,
        hatchets_broken: 0,
        nest_drop: 0,
        buggy_combat: 0,
        mushroom_combat: 0,
        termite_war: 0
      }

    };
    // Asegurar clamp del tope global de EXP
    $gameSystem._onyxSkills[C.ID].skill_total_exp = clampTotalExp($gameSystem._onyxSkills[C.ID].skill_total_exp);
    return $gameSystem._onyxSkills[C.ID];
  }

  // Recalcula lvl a partir de totalExp usando la tabla (sube mientras alcance el total del siguiente lvl)
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
    if (!$gameVariables) {
      return;
    }
  
    var st = Onyx.Skill.Tala.state();
  
    if (VAR_SKILL_LEVEL > 0) {
      var skillLevelValue;
      if (st.lvl > 0) {
        skillLevelValue = st.lvl;
      } else {
        skillLevelValue = 1;
      }
      $gameVariables.setValue(VAR_SKILL_LEVEL, skillLevelValue);
    }
  
    if (VAR_EXP_ACTUAL > 0) {
      var expAct = st.expIntoLevel;
      if (expAct == null) {
        expAct = 0;
      }
      $gameVariables.setValue(VAR_EXP_ACTUAL, expAct);
    }
  
    if (VAR_EXP_SIGUIENTE > 0) {
      var nextValForConfiguredVar;
      if (st.nextLevelTotalExp != null) {
        nextValForConfiguredVar = st.nextLevelTotalExp;
      } else {
        nextValForConfiguredVar = st.curLvlTotal;
      }
  
      if (nextValForConfiguredVar == null) {
        nextValForConfiguredVar = 0;
      }
  
      $gameVariables.setValue(VAR_EXP_SIGUIENTE, nextValForConfiguredVar);
    }
  
    // Var 37 y 43 = EXP total del siguiente nivel (umbral, ej. 83 para subir a nivel 2)
    var nextVal = null;
  
    if (st.nextLevelTotalExp != null) {
      nextVal = st.nextLevelTotalExp;
    } else {
      nextVal = st.curLvlTotal;
    }
  
    if (nextVal == null) {
      nextVal = 0;
    }
  
    $gameVariables.setValue(37, nextVal);
    $gameVariables.setValue(43, nextVal);
  }

  // ============================================================
  // 4) API
  // ============================================================
  Onyx.Skill.Tala.constants = function() {
    return JSON.parse(JSON.stringify(C));
  };

  Onyx.Skill.Tala.getTreeExtraLogChance = function() {
    var st = ensureStore();
    if (!st || !st.bonus) return C.tree_extra_log_chance_base || 0;
    var base = Number(C.tree_extra_log_chance_base) || 0;
    var bonus = Number(st.bonus.tree_extra_log_chance) || 0;
    return Math.min(100, Math.max(0, base + bonus));
  };

  Onyx.Skill.Tala.getWoodHitChance = function() {
    var st = ensureStore();
    if (!st || !st.bonus) return C.wood_hit_chance_base || 75;
    var base = Number(C.wood_hit_chance_base) || 75;
    var bonus = Number(st.bonus.wood_hit_chance) || 0;
    return Math.min(100, Math.max(0, base + bonus));
  };

  Onyx.Skill.Tala.getWoodCritChance = function() {
    var st = ensureStore();
    if (!st || !st.bonus) return C.wood_crit_chance_base || 10;
    var base = Number(C.wood_crit_chance_base) || 10;
    var bonus = Number(st.bonus.wood_crit_chance) || 0;
    return Math.min(100, Math.max(0, base + bonus));
  };

  /** Chance % nido vacío. Solo aplica si nivel >= bird_nest_reward_min_lvl (1). */
  Onyx.Skill.Tala.getBirdNestChance = function() {
    var st = ensureStore();
    var lvl = (st && st.skill_lvl) ? Math.max(1, Number(st.skill_lvl) || 1) : 1;
    if (lvl < (C.bird_nest_reward_min_lvl || 1)) return 0;
    var base = Number(C.bird_nest_reward_base_chance) || 8.5;
    var bonus = (st && st.bonus) ? Number(st.bonus.bird_nest_chance) || 0 : 0;
    return Math.min(100, Math.max(0, base + bonus));
  };

  /** Chance % nido con huevo. Solo aplica si nivel >= bird_nest_egg_reward_min_lvl (35). */
  Onyx.Skill.Tala.getBirdNestEggChance = function() {
    var st = ensureStore();
    var lvl = (st && st.skill_lvl) ? Math.max(1, Number(st.skill_lvl) || 1) : 1;
    if (lvl < (C.bird_nest_egg_reward_min_lvl || 35)) return 0;
    var base = Number(C.bird_nest_egg_reward_base_chance) || 0.75;
    var bonus = (st && st.bonus) ? Number(st.bonus.bird_nest_egg_chance) || 0 : 0;
    return Math.min(100, Math.max(0, base + bonus));
  };

  /** Chance % nido con tesoro. Solo aplica si nivel >= bird_nest_treasure_reward_min_lvl (70). */
  Onyx.Skill.Tala.getBirdNestTreasureChance = function() {
    var st = ensureStore();
    var lvl = (st && st.skill_lvl) ? Math.max(1, Number(st.skill_lvl) || 1) : 1;
    if (lvl < (C.bird_nest_treasure_reward_min_lvl || 70)) return 0;
    var base = Number(C.bird_nest_treasure_reward_base_chance) || 0.000026;
    var bonus = (st && st.bonus) ? Number(st.bonus.bird_nest_treasure_chance) || 0 : 0;
    var percent = base + bonus;
    return Math.max(0, percent);
  };

  /** Probabilidad (0–1) de que el hacha se rompa en un golpe crítico. base 0.025 = 0.025%. bonus: 0-100 = %, o 0-1 = fracción (1 = 100%). */
  Onyx.Skill.Tala.getWoodHatchetBreakChance = function() {
    var st = ensureStore();
    var base = Number(C.break_hatche_base_chance) || 0.025;
    var rawBonus = (st && st.bonus) ? Number(st.bonus.break_hatche_chance) || 0 : 0;
    var bonusPercent = (rawBonus > 0 && rawBonus <= 1) ? rawBonus * 100 : rawBonus;
    var percent = Math.min(100, Math.max(0, base + bonusPercent));
    return percent / 100;
  };

  Onyx.Skill.Tala.state = function() {
    var st = ensureStore();
    var cap = getCap();

    if (!st) {
      return { id: C.ID, name: C.NAME, lvl: 1, totalExp: 0, cap: cap };
    }

    var lvl = Math.max(1, Number(st.skill_lvl) || 1);
    var total = clampTotalExp(st.skill_total_exp);
    st.skill_total_exp = total;

    // asegurar coherencia por si tocaste exp manual
    lvl = recalcLevelFromTotalExp(total, lvl);
    st.skill_lvl = lvl;

    var curLvlTotal = expTotalForLevel(lvl) || 0;
    var nextLvlTotal = null;
    if (lvl < cap) nextLvlTotal = expTotalForLevel(lvl + 1);

    var expIntoLevel = Math.max(0, total - curLvlTotal);
    var remaining = 0;
    if (nextLvlTotal != null) remaining = Math.max(0, nextLvlTotal - total);

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

  Onyx.Skill.Tala.addExp = function(amount) {
    var st = ensureStore();
    if (!st) return { ok: false, reason: "no_gamesystem", leveledUp: false };

    var add = Number(amount) || 0;
    if (add <= 0) return { ok: true, added: 0, levelUps: 0, leveledUp: false, state: Onyx.Skill.Tala.state() };

    var cap = getCap();
    var beforeLvl = Math.max(1, Number(st.skill_lvl) || 1);

    var beforeTotal = clampTotalExp(st.skill_total_exp);
    var afterTotal = clampTotalExp(beforeTotal + add);
    st.skill_total_exp = afterTotal;
    var addedEffective = Math.max(0, afterTotal - beforeTotal);

    // recalcular nivel
    var afterLvl = recalcLevelFromTotalExp(st.skill_total_exp, beforeLvl);
    if (afterLvl > cap) afterLvl = cap;
    st.skill_lvl = afterLvl;

    syncVariablesToGame();
    var levelUps = Math.max(0, afterLvl - beforeLvl);
    return {
      ok: true,
      added: addedEffective,
      levelUps: levelUps,
      leveledUp: levelUps > 0,
      state: Onyx.Skill.Tala.state()
    };
  };

  function getMaterialEntry(materialId) {
    var list = window.$dataCustom && window.$dataCustom.MaterialRewards;
    if (!list || !Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      if (row && Number(row.material_id) === Number(materialId)) {
        return row;
      }
    }
    return null;
  }

  Onyx.Skill.Tala.addExpFromMaterial = function(materialId) {
    var entry = getMaterialEntry(materialId);
    if (!entry || (entry.exp == null || Number(entry.exp) <= 0)) {
      return { ok: true, added: 0, levelUps: 0, leveledUp: false, state: Onyx.Skill.Tala.state() };
    }
    return Onyx.Skill.Tala.addExp(Number(entry.exp) || 0);
  };

  Onyx.Skill.Tala.addExpFromMaterialVar = function() {
    var materialId = 0;
    if ($gameVariables) materialId = $gameVariables.value(VAR_MATERIAL_ID);
    return Onyx.Skill.Tala.addExpFromMaterial(materialId);
  };

  Onyx.Skill.Tala.setLevel = function(level) {
    var st = ensureStore();
    if (!st) return false;

    var cap = getCap();
    var lvl = Math.floor(Number(level) || 1);
    if (lvl < 1) lvl = 1;
    if (lvl > cap) lvl = cap;

    var minTotal = expTotalForLevel(lvl);
    if (minTotal == null) minTotal = 0;

    st.skill_lvl = lvl;
    // dejamos la exp total al mínimo del lvl (y no inventamos números)
    st.skill_total_exp = clampTotalExp(Number(minTotal) || 0);
    syncVariablesToGame();
    return true;
  };

  Onyx.Skill.Tala.reset = function() {
    var st = ensureStore();
    if (!st) return false;
    st.skill_lvl = 1;
    st.skill_total_exp = 0;
    syncVariablesToGame();
    return true;
  };

  Onyx.Skill.Tala.isActive = function() {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.isActive) {
      return Onyx.SkillsActive.isActive(C.ID);
    }
    return true;
  };

  Onyx.Skill.Tala.getEffectiveBonusValues = function() {
    var out = {};
    var st = ensureStore();
    if (!st || !st.bonus) return out;
    var base = {
      doble_reward_chance: C.doble_reward_chance_base || 0,
      bird_nest_chance: C.bird_nest_reward_base_chance || 0,
      bird_nest_egg_chance: C.bird_nest_egg_reward_base_chance || 0,
      bird_nest_treasure_chance: C.bird_nest_treasure_reward_base_chance || 0,
      mushroom_reward_chance: C.mushroom_reward_base_chance || 0,
      tree_seed_reward_chance: C.tree_seed_reward_base_chance || 0,
      tree_root_reward_chance: C.tree_root_reward_base_chance || 0,
      tree_crust_reward_chance: C.tree_crust_reward_base_chance || 0,
      tree_sap_reward_chance: C.tree_sap_reward_base_chance || 0,
      tree_extra_log_chance: C.tree_extra_log_chance_base || 0,
      wood_hit_chance: C.wood_hit_chance_base || 75,
      wood_crit_chance: C.wood_crit_chance_base || 10,
      buggy_reward_chance: C.buggy_reward_base_chance || 0,
      buggy_combat_chance: C.buggy_combat_base_chance || 0,
      combat_evil_tree_chance: C.combat_evil_tree_event_base_chance || 0,
      break_hatche_chance: (C.break_hatche_base_chance || 0) * 100,
      wise_old_tree_chance: (C.wise_old_tree_base_chance || 0) * 100,
      nature_spirit_chance: (C.nature_spirit_base_chance || 0) * 100,
      sap_rain_chance: (C.sap_rain_base_chance || 0) * 100,
      living_root_chance: (C.living_root_base_chance || 0) * 100,
      termites_war_chance: (C.termites_war_base_chance || 0) * 100
    };
    var labels = {
      doble_reward_chance: "Doble recompensa", bird_nest_chance: "Nido",
      bird_nest_egg_chance: "Nido huevo", bird_nest_treasure_chance: "Nido tesoro",
      mushroom_reward_chance: "Hongos", tree_seed_reward_chance: "Semillas",
      tree_root_reward_chance: "Raíces", tree_crust_reward_chance: "Corteza",
      tree_sap_reward_chance: "Savia", tree_extra_log_chance: "Troncos extra",
      wood_hit_chance: "Precisión", wood_crit_chance: "Crítico",
      buggy_reward_chance: "Insectos", buggy_combat_chance: "Combate insectos",
      combat_evil_tree_chance: "Árbol maldito", break_hatche_chance: "Romper hacha",
      wise_old_tree_chance: "Árbol ancestral", nature_spirit_chance: "Espíritu naturaleza",
      sap_rain_chance: "Lluvia savia", living_root_chance: "Raíz viviente",
      termites_war_chance: "Guerra termitas"
    };
    for (var k in base) {
      var bonus = Number(st.bonus[k]) || 0;
      if (k.indexOf("break_") === 0 || k.indexOf("wise_") === 0 || k.indexOf("nature_") === 0 ||
          k.indexOf("sap_rain") === 0 || k.indexOf("living_") === 0 || k.indexOf("termites_") === 0) {
        bonus = (bonus > 0 && bonus <= 1) ? bonus * 100 : bonus;
      }
      out[k] = { label: labels[k] || k, value: base[k] + bonus };
    }
    return out;
  };

  Onyx.Skill.Tala.init = function() {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.activate) {
      Onyx.SkillsActive.activate(C.ID);
    }
    var skill_list = window.$dataCustom && window.$dataCustom.SkillList;
    var max_lvl = 0;
    if (!skill_list) {
      console.warn("[SkillTala] init() falló: skill_list no existe");
      return false;
    }
    for (var i = 0; i < skill_list.length; i++) {
      var row = skill_list[i];
      if (row && Number(row.skill_id) === Number(C.ID)) {
        max_lvl = Number(row.skill_max_level) || 99;
        break;
      }
    }
    var ok = Onyx.Skill.Tala.reset();
    if (!ok) {
      console.warn("[SkillTala] init() falló: ensureStore() devolvió null (¿$gameSystem existe?)");
      return false;
    }
    // Asegurar nivel 1 en store (por si state() recalc devolviera otra cosa) y en variable de juego
    var st = ensureStore();
    if (st) {
      st.skill_lvl = 1;
      st.skill_total_exp = 0;
    }
    if ($gameVariables && VAR_SKILL_LEVEL > 0) {
      $gameVariables.setValue(VAR_SKILL_LEVEL, 1);
    }
    syncVariablesToGame();
    st = Onyx.Skill.Tala.state();
    var expAct = st.expIntoLevel;
    if (expAct == null) expAct = 0;
      var nextExp;
    if (st.nextLevelTotalExp != null) {
      nextExp = st.nextLevelTotalExp;
    } else {
      nextExp = st.curLvlTotal;
    }
    if (nextExp == null) nextExp = 0;
    if ($gameVariables && VAR_MAX_SKILL_LEVEL > 0) {
      $gameVariables.setValue(VAR_MAX_SKILL_LEVEL, max_lvl);
    }
    return true;
  };

  // ============================================================
  // 5) Hooks
  // ============================================================
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
    syncVariablesToGame();
  };

  // [SKILL] Exp Calculator sobrescribe Var 37 cada frame; los eventos copian Var 43 = Var 37.
  // Cuando la skill activa es Tala (Var 33 = 1), mantenemos Var 37 y 43 con los valores de SkillTala.
  var _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    if ($gameVariables && Number($gameVariables.value(33)) === C.ID) {
      syncVariablesToGame();
    }
  };

})();

/*:
 * @plugindesc (Onyx) v1.1.1.0 - Skill: Recolección - barra sobre el jugador, bonus recolección
 * @name SkillRecoleccion
 * @author Onyx
 * @version 1.1.1.0
 *
 * @param varSkillLevel
 * @text Variable: Nivel de Skill
 * @type variable
 * @default 41
 *
 * @param varExpActual
 * @text Variable: EXP actual (dentro del nivel)
 * @type variable
 * @default 42
 *
 * @param varExpSiguiente
 * @text Variable: EXP siguiente (total del nivel actual)
 * @type variable
 * @default 44
 *
 * @param varMaterialId
 * @text Variable: material_id (para addExpFromMaterialVar)
 * @type variable
 * @default 38
 *
 * @param varMaxSkillLevel
 * @text Variable: Nivel máximo de Skill
 * @type variable
 * @default 45
 *
 * @param baseTimeSeconds
 * @text Tiempo base (segundos) si el nodo no tiene time
 * @type number
 * @decimals 1
 * @default 4
 *
 * @param timeHierbasSec
 * @text Segundos: hierbas (material 20–37)
 * @desc Tiempo base de barra antes de dividir por velocidad del guante.
 * @type number
 * @decimals 1
 * @default 6
 *
 * @param timeHongosSec
 * @text Segundos: hongos (material 38–57)
 * @type number
 * @decimals 1
 * @default 12
 *
 * @param timeBayasSec
 * @text Segundos: bayas (material 58–72)
 * @type number
 * @decimals 1
 * @default 6
 *
 * @param itemInsectId
 * @text Ítem insecto (bonus)
 * @type item
 * @default 0
 * @desc 0 = desactivado.
 *
 * @param itemSeedId
 * @text Ítem semilla (hierbas 20–37)
 * @type item
 * @default 0
 *
 * @param itemSporeId
 * @text Ítem espora (hongos 38–57)
 * @type item
 * @default 0
 *
 * @param itemSproutId
 * @text Ítem brote (bayas 58–72)
 * @type item
 * @default 0
 *
 * @param thornDamagePercentMhp
 * @text Daño espina (% vida máx)
 * @type number
 * @min 0
 * @max 100
 * @default 4
 * @desc No puede dejar el HP en 0 (mínimo 1).
 *
 * @param gatherBarOffsetY
 * @text Barra recolección: offset Y sobre el jugador
 * @type number
 * @min -200
 * @max 200
 * @default 78
 * @desc Píxeles hacia arriba desde los pies del sprite (mayor = más arriba).
 *
 * @param gatherBarOffsetX
 * @text Barra recolección: offset X
 * @type number
 * @min -200
 * @max 200
 * @default 0
 *
 * @help
 * Requiere:
 *  - $dataCustom.ExpTable, SkillList, MaterialRewards, ToolLevelList, SkillNodeLevelNeed
 *  - getBestPartyToolForSkill, getEquippedToolSpeed, onyxCanUseToolsOnNode, onyxSetNodeCanHarvestVar
 *
 * Las herramientas usan "speed" en ToolLevelList (no damage). Mayor speed = menos tiempo.
 * Tiempos por tipo (parámetros) se guardan en cada nodo (var 1001, campo time) ÷ velocidad del guante.
 *
 * Bonos (base en código + suma de SkillUnlocks skill_id 4, update *_base): planta extra, insecto,
 * semilla/espora/brote según tipo de material (hierbas/hongos/bayas), espina (% vida máx, no mata).
 * Configura ítems de bonus en parámetros del plugin (0 = off).
 *
 * Var 1001: un nodo por tipo de material, IDs 1…53 (orden 20–37, 38–47, 48–57, 58–72).
 *   Onyx.Skill.Recoleccion.gatheringNodeCount() → 53
 *
 * API:
 *   Onyx.Skill.Recoleccion.state()
 *   Onyx.Skill.Recoleccion.addExp(n), addExpFromMaterial(materialId [, cantidad]), addExpFromMaterialVar()
 *   EXP por material = MaterialRewards.exp * cantidad (en recolección, cantidad = ítems obtenidos).
 *   Onyx.Skill.Recoleccion.getGatheringTimeSeconds() -> segundos para llenar la barra
 *   Onyx.Skill.Recoleccion.init() -> activa la skill y resetea
 *   Onyx.Skill.Recoleccion.isActive()
 *   refreshBonusFromUnlocks(), getEffectiveBonusValues(), getThornDamagePercentMhp()
 *   getGatherExtraPlantChance / Insect / Seed / Spore / Sprout / Thorn -> porcentaje
 *
 * Plugin Command: SkillRecoleccion StartGathering [nodeId] [tableVarId]
 *   Barra "Recolectando..." sobre el jugador en el mapa (no cambia de escena). Parámetros gatherBarOffset*.
 */

(function() {
  "use strict";
  var SKILL_RECOLECCION_VERSION = "1.1.1.0";

  var ONYX_GLOBAL_MAX_TOTAL_EXP_STR = "2289796205681772328910848";
  var ONYX_GLOBAL_MAX_TOTAL_EXP = Number(ONYX_GLOBAL_MAX_TOTAL_EXP_STR);

  function clampTotalExp(n) {
    var x = Number(n) || 0;
    if (x < 0) x = 0;
    if (isFinite(ONYX_GLOBAL_MAX_TOTAL_EXP) && x > ONYX_GLOBAL_MAX_TOTAL_EXP) x = ONYX_GLOBAL_MAX_TOTAL_EXP;
    return x;
  }

  var PARAMS = PluginManager.parameters("SkillRecoleccion");
  var VAR_SKILL_LEVEL = Number(PARAMS["varSkillLevel"] || 41);
  var VAR_EXP_ACTUAL = Number(PARAMS["varExpActual"] || 42);
  var VAR_EXP_SIGUIENTE = Number(PARAMS["varExpSiguiente"] || 44);
  var VAR_MATERIAL_ID = Number(PARAMS["varMaterialId"] || 38);
  var VAR_MAX_SKILL_LEVEL = Number(PARAMS["varMaxSkillLevel"] || 45);
  var BASE_TIME_SECONDS = Number(PARAMS["baseTimeSeconds"] || 4);
  function parseTimeSec(key, fallback) {
    var n = Number(PARAMS[key]);
    if (!isFinite(n) || n <= 0) n = fallback;
    return Math.max(0.5, n);
  }
  var TIME_HIERBAS_SEC = parseTimeSec("timeHierbasSec", 6);
  var TIME_HONGOS_SEC = parseTimeSec("timeHongosSec", 12);
  var TIME_BAYAS_SEC = parseTimeSec("timeBayasSec", 6);

  function parseItemParam(key) {
    var v = PARAMS[key];
    if (v == null || v === "") return 0;
    var n = Number(v);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
  }
  var ITEM_INSECT = parseItemParam("itemInsectId");
  var ITEM_SEED = parseItemParam("itemSeedId");
  var ITEM_SPORE = parseItemParam("itemSporeId");
  var ITEM_SPROUT = parseItemParam("itemSproutId");
  var THORN_DAMAGE_PCT_MHP = Number(PARAMS["thornDamagePercentMhp"]);
  if (!isFinite(THORN_DAMAGE_PCT_MHP) || THORN_DAMAGE_PCT_MHP < 0) THORN_DAMAGE_PCT_MHP = 4;
  var GATHER_BAR_OFFSET_Y = Number(PARAMS["gatherBarOffsetY"]);
  if (!isFinite(GATHER_BAR_OFFSET_Y)) GATHER_BAR_OFFSET_Y = 78;
  var GATHER_BAR_OFFSET_X = Number(PARAMS["gatherBarOffsetX"]);
  if (!isFinite(GATHER_BAR_OFFSET_X)) GATHER_BAR_OFFSET_X = 0;
  var GATHER_BAR_W = 280;
  var GATHER_BAR_H = 80;

  window.Onyx = window.Onyx || {};
  Onyx.Skill = Onyx.Skill || {};
  Onyx.Skill.Recoleccion = Onyx.Skill.Recoleccion || {};

  var C = {
    ID: 4,
    NAME: "Recolección",
    gather_extra_plant_chance_base: 12,
    gather_insect_chance_base: 4,
    gather_seed_chance_base: 2,
    gather_spore_chance_base: 2,
    gather_sprout_chance_base: 2,
    gather_thorn_chance_base: 6
  };

  var GATHER_BONUS_KEYS = [
    "gather_extra_plant_chance",
    "gather_insect_chance",
    "gather_seed_chance",
    "gather_spore_chance",
    "gather_sprout_chance",
    "gather_thorn_chance"
  ];

  function mergeRecoleccionBonusDefaults(st) {
    if (!st) return;
    if (!st.bonus) st.bonus = {};
    for (var i = 0; i < GATHER_BONUS_KEYS.length; i++) {
      var k = GATHER_BONUS_KEYS[i];
      if (st.bonus[k] == null) st.bonus[k] = 0;
    }
    if (!st.stats) st.stats = {};
    var sk = ["plants_gathered", "gather_extra_plants", "gather_insects", "gather_seeds", "gather_spores", "gather_sprouts", "gather_thorns"];
    for (var j = 0; j < sk.length; j++) {
      if (st.stats[sk[j]] == null) st.stats[sk[j]] = 0;
    }
  }

  function bonusKeyFromSkillUnlockUpdate(upd) {
    if (!upd) return null;
    var s = String(upd);
    if (s.length > 5 && s.slice(-5) === "_base") return s.slice(0, -5);
    return s;
  }

  Onyx.Skill.Recoleccion.refreshBonusFromUnlocks = function() {
    Onyx.Skill.Recoleccion.state();
    var st = ensureStore();
    if (!st) return;
    mergeRecoleccionBonusDefaults(st);
    var list = window.$dataCustom && window.$dataCustom.SkillUnlocks;
    var accum = {};
    for (var a = 0; a < GATHER_BONUS_KEYS.length; a++) accum[GATHER_BONUS_KEYS[a]] = 0;
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

  function getBonusSlice(key) {
    var st = ensureStore();
    if (!st || !st.bonus) return 0;
    return Number(st.bonus[key]) || 0;
  }

  function chanceFromBaseBonus(baseKey, bonusKey) {
    var base = Number(C[baseKey]) || 0;
    var b = getBonusSlice(bonusKey);
    return Math.min(100, Math.max(0, base + b));
  }

  Onyx.Skill.Recoleccion.getGatherExtraPlantChance = function() {
    return chanceFromBaseBonus("gather_extra_plant_chance_base", "gather_extra_plant_chance");
  };
  Onyx.Skill.Recoleccion.getGatherInsectChance = function() {
    return chanceFromBaseBonus("gather_insect_chance_base", "gather_insect_chance");
  };
  Onyx.Skill.Recoleccion.getGatherSeedChance = function() {
    return chanceFromBaseBonus("gather_seed_chance_base", "gather_seed_chance");
  };
  Onyx.Skill.Recoleccion.getGatherSporeChance = function() {
    return chanceFromBaseBonus("gather_spore_chance_base", "gather_spore_chance");
  };
  Onyx.Skill.Recoleccion.getGatherSproutChance = function() {
    return chanceFromBaseBonus("gather_sprout_chance_base", "gather_sprout_chance");
  };
  Onyx.Skill.Recoleccion.getGatherThornChance = function() {
    return chanceFromBaseBonus("gather_thorn_chance_base", "gather_thorn_chance");
  };

  Onyx.Skill.Recoleccion.constants = function() {
    return JSON.parse(JSON.stringify(C));
  };

  /** Bonos efectivos (base + desbloqueos) para UI. Refresca bonus desde SkillUnlocks. */
  Onyx.Skill.Recoleccion.getEffectiveBonusValues = function() {
    if (Onyx.Skill.Recoleccion.refreshBonusFromUnlocks)
      Onyx.Skill.Recoleccion.refreshBonusFromUnlocks();
    return {
      gather_extra_plant_chance: { label: "Planta extra", value: Onyx.Skill.Recoleccion.getGatherExtraPlantChance() },
      gather_insect_chance: { label: "Insecto", value: Onyx.Skill.Recoleccion.getGatherInsectChance() },
      gather_seed_chance: { label: "Semilla (hierba)", value: Onyx.Skill.Recoleccion.getGatherSeedChance() },
      gather_spore_chance: { label: "Espora (hongo)", value: Onyx.Skill.Recoleccion.getGatherSporeChance() },
      gather_sprout_chance: { label: "Brote (baya)", value: Onyx.Skill.Recoleccion.getGatherSproutChance() },
      gather_thorn_chance: { label: "Espina", value: Onyx.Skill.Recoleccion.getGatherThornChance() }
    };
  };

  Onyx.Skill.Recoleccion.getThornDamagePercentMhp = function() {
    return THORN_DAMAGE_PCT_MHP;
  };

  function getExpTable() {
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
        console.warn("[SkillRecoleccion] ExpTable no cargado.");
      }
      return n <= 5 ? [0, 83, 174, 276, 388][n] || 83 * n : 83 * n;
    }
    var row = t[n];
    if (row == null) row = t[String(n)];
    if (row == null) row = t[n - 1];
    if (row == null) return null;
    if (typeof row === "object" && row !== null && !Array.isArray(row)) {
      var v = row[n];
      if (v == null) v = row[String(n)];
      if (v == null) {
        var keys = Object.keys(row);
        if (keys.length) v = row[keys[0]];
      }
      return v != null ? Number(v) || 0 : null;
    }
    return Number(row) || 0;
  }

  function getSkillCapFromList(skillId) {
    var list = window.$dataCustom && window.$dataCustom.SkillList;
    if (!list) return null;
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      if (row && Number(row.skill_id) === Number(skillId))
        return Number(row.skill_max_level) || null;
    }
    return null;
  }

  function getCap() {
    return getSkillCapFromList(C.ID) || 99;
  }

  function ensureStore() {
    if (!$gameSystem) return null;
    $gameSystem._onyxSkills = $gameSystem._onyxSkills || {};
    $gameSystem._onyxSkills[C.ID] = $gameSystem._onyxSkills[C.ID] || {
      skill_lvl: 1,
      skill_total_exp: 0,
      bonus: {
        gather_extra_plant_chance: 0,
        gather_insect_chance: 0,
        gather_seed_chance: 0,
        gather_spore_chance: 0,
        gather_sprout_chance: 0,
        gather_thorn_chance: 0
      },
      stats: {
        plants_gathered: 0,
        gather_extra_plants: 0,
        gather_insects: 0,
        gather_seeds: 0,
        gather_spores: 0,
        gather_sprouts: 0,
        gather_thorns: 0
      }
    };
    mergeRecoleccionBonusDefaults($gameSystem._onyxSkills[C.ID]);
    $gameSystem._onyxSkills[C.ID].skill_total_exp = clampTotalExp($gameSystem._onyxSkills[C.ID].skill_total_exp);
    return $gameSystem._onyxSkills[C.ID];
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
    var st = Onyx.Skill.Recoleccion.state();
    if (VAR_SKILL_LEVEL > 0)
      $gameVariables.setValue(VAR_SKILL_LEVEL, st.lvl > 0 ? st.lvl : 1);
    if (VAR_EXP_ACTUAL > 0)
      $gameVariables.setValue(VAR_EXP_ACTUAL, st.expIntoLevel != null ? st.expIntoLevel : 0);
    var nextVal = st.nextLevelTotalExp != null ? st.nextLevelTotalExp : (st.curLvlTotal || 0);
    if (VAR_EXP_SIGUIENTE > 0)
      $gameVariables.setValue(VAR_EXP_SIGUIENTE, nextVal || 0);
  }

  Onyx.Skill.Recoleccion.state = function() {
    var st = ensureStore();
    var cap = getCap();
    if (!st)
      return { id: C.ID, name: C.NAME, lvl: 1, totalExp: 0, cap: cap };
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

  Onyx.Skill.Recoleccion.addExp = function(amount) {
    var st = ensureStore();
    if (!st) return { ok: false, leveledUp: false };
    var add = Number(amount) || 0;
    if (add <= 0) return { ok: true, added: 0, levelUps: 0, leveledUp: false, state: Onyx.Skill.Recoleccion.state() };
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
    if (Onyx.Skill.Recoleccion.refreshBonusFromUnlocks)
      Onyx.Skill.Recoleccion.refreshBonusFromUnlocks();
    return {
      ok: true,
      added: afterTotal - beforeTotal,
      levelUps: levelUps,
      leveledUp: levelUps > 0,
      state: Onyx.Skill.Recoleccion.state()
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

  function gatheringCategoryForMaterial(ma_id) {
    var m = Number(ma_id) || 0;
    if (m >= 20 && m <= 37) return "herb";
    if (m >= 38 && m <= 57) return "mushroom";
    if (m >= 58 && m <= 72) return "berry";
    return null;
  }

  function rollGatheringChance(pct) {
    var p = Number(pct);
    if (!isFinite(p) || p <= 0) return false;
    if (p >= 100) return true;
    return Math.random() * 100 < p;
  }

  function giveOneMaterialItem(materialId) {
    var row = getMaterialEntry(materialId);
    if (!row || !row.item_id) return false;
    var item = $dataItems[row.item_id];
    if (!item) return false;
    $gameParty.gainItem(item, 1);
    return true;
  }

  function gainBonusItem(itemId) {
    var id = Number(itemId) || 0;
    if (id <= 0) return false;
    var item = $dataItems[id];
    if (!item) return false;
    $gameParty.gainItem(item, 1);
    return true;
  }

  function applyGatheringThornDamage() {
    var actor = $gameParty.leader();
    if (!actor || !actor.isAlive()) return 0;
    var pct = THORN_DAMAGE_PCT_MHP;
    if (!isFinite(pct) || pct <= 0) return 0;
    var raw = Math.floor(actor.mhp * (pct / 100));
    var maxLose = Math.max(0, actor.hp - 1);
    var dmg = Math.min(raw, maxLose);
    if (dmg <= 0) return 0;
    actor.setHp(actor.hp - dmg);
    return dmg;
  }

  function bumpGatherStat(name) {
    var st = ensureStore();
    if (!st || !st.stats) return;
    st.stats[name] = (Number(st.stats[name]) || 0) + 1;
  }

  /** mainSuccess = giveMaterialReward entregó ítem. La espina puede activarse siempre al terminar la barra. */
  function applyGatheringBonuses(materialId, mainSuccess) {
    var out = { extraPlant: false };
    Onyx.Skill.Recoleccion.refreshBonusFromUnlocks();

    if (mainSuccess) {
      bumpGatherStat("plants_gathered");
      if (rollGatheringChance(Onyx.Skill.Recoleccion.getGatherExtraPlantChance())) {
        if (giveOneMaterialItem(materialId)) {
          out.extraPlant = true;
          bumpGatherStat("gather_extra_plants");
          if (typeof showFloatingMessage === "function")
            showFloatingMessage("¡Planta extra!", 90, 0, "arriba", true);
        }
      }
      if (ITEM_INSECT > 0 && rollGatheringChance(Onyx.Skill.Recoleccion.getGatherInsectChance())) {
        if (gainBonusItem(ITEM_INSECT)) {
          bumpGatherStat("gather_insects");
          if (typeof showFloatingMessage === "function")
            showFloatingMessage("¡Un insecto!", 90, 0, "arriba", true);
        }
      }
      var cat = gatheringCategoryForMaterial(materialId);
      if (cat === "herb" && ITEM_SEED > 0 && rollGatheringChance(Onyx.Skill.Recoleccion.getGatherSeedChance())) {
        if (gainBonusItem(ITEM_SEED)) {
          bumpGatherStat("gather_seeds");
          if (typeof showFloatingMessage === "function")
            showFloatingMessage("¡Semilla!", 90, 0, "arriba", true);
        }
      } else if (cat === "mushroom" && ITEM_SPORE > 0 && rollGatheringChance(Onyx.Skill.Recoleccion.getGatherSporeChance())) {
        if (gainBonusItem(ITEM_SPORE)) {
          bumpGatherStat("gather_spores");
          if (typeof showFloatingMessage === "function")
            showFloatingMessage("¡Espora!", 90, 0, "arriba", true);
        }
      } else if (cat === "berry" && ITEM_SPROUT > 0 && rollGatheringChance(Onyx.Skill.Recoleccion.getGatherSproutChance())) {
        if (gainBonusItem(ITEM_SPROUT)) {
          bumpGatherStat("gather_sprouts");
          if (typeof showFloatingMessage === "function")
            showFloatingMessage("¡Brote!", 90, 0, "arriba", true);
        }
      }
    }

    if (rollGatheringChance(Onyx.Skill.Recoleccion.getGatherThornChance())) {
      var dmg = applyGatheringThornDamage();
      if (dmg > 0) {
        bumpGatherStat("gather_thorns");
        if (typeof showFloatingMessage === "function")
          showFloatingMessage("Te pinchaste una espina... (-" + dmg + " HP)", 120);
      }
    }
    return out;
  }

  Onyx.Skill.Recoleccion.addExpFromMaterial = function(materialId, quantityMultiplier) {
    var entry = getMaterialEntry(materialId);
    if (!entry || (entry.exp == null || Number(entry.exp) <= 0))
      return { ok: true, added: 0, levelUps: 0, leveledUp: false, state: Onyx.Skill.Recoleccion.state() };
    var mult = 1;
    if (quantityMultiplier !== undefined && quantityMultiplier !== null)
      mult = Math.max(0, Math.floor(Number(quantityMultiplier)));
    if (mult <= 0)
      return { ok: true, added: 0, levelUps: 0, leveledUp: false, state: Onyx.Skill.Recoleccion.state() };
    var per = Number(entry.exp) || 0;
    return Onyx.Skill.Recoleccion.addExp(per * mult);
  };

  Onyx.Skill.Recoleccion.addExpFromMaterialVar = function() {
    var materialId = $gameVariables ? $gameVariables.value(VAR_MATERIAL_ID) : 0;
    return Onyx.Skill.Recoleccion.addExpFromMaterial(materialId);
  };

  Onyx.Skill.Recoleccion.setLevel = function(level) {
    var st = ensureStore();
    if (!st) return false;
    var cap = getCap();
    var lvl = Math.max(1, Math.min(cap, Math.floor(Number(level) || 1)));
    var minTotal = expTotalForLevel(lvl) || 0;
    st.skill_lvl = lvl;
    st.skill_total_exp = clampTotalExp(minTotal);
    syncVariablesToGame();
    if (Onyx.Skill.Recoleccion.refreshBonusFromUnlocks)
      Onyx.Skill.Recoleccion.refreshBonusFromUnlocks();
    return true;
  };

  Onyx.Skill.Recoleccion.reset = function() {
    var st = ensureStore();
    if (!st) return false;
    st.skill_lvl = 1;
    st.skill_total_exp = 0;
    syncVariablesToGame();
    if (Onyx.Skill.Recoleccion.refreshBonusFromUnlocks)
      Onyx.Skill.Recoleccion.refreshBonusFromUnlocks();
    return true;
  };

  Onyx.Skill.Recoleccion.isActive = function() {
    return (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.isActive)
      ? Onyx.SkillsActive.isActive(C.ID) : true;
  };

  Onyx.Skill.Recoleccion.getGatheringTimeSeconds = function() {
    var speed = (typeof getEquippedToolSpeed === "function") ? getEquippedToolSpeed(C.ID) : 1;
    if (!speed || speed < 0.5) speed = 0.5;
    return Math.max(0.5, BASE_TIME_SECONDS / speed);
  };

  Onyx.Skill.Recoleccion.init = function() {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.activate)
      Onyx.SkillsActive.activate(C.ID);
    var skill_list = window.$dataCustom && window.$dataCustom.SkillList;
    var max_lvl = 99;
    if (skill_list) {
      for (var i = 0; i < skill_list.length; i++) {
        var row = skill_list[i];
        if (row && Number(row.skill_id) === C.ID) {
          max_lvl = Number(row.skill_max_level) || 99;
          break;
        }
      }
    }
    var ok = Onyx.Skill.Recoleccion.reset();
    if (!ok) return false;
    if ($gameVariables) {
      $gameVariables.setValue(VAR_SKILL_LEVEL, 1);
      if (VAR_MAX_SKILL_LEVEL > 0) $gameVariables.setValue(VAR_MAX_SKILL_LEVEL, max_lvl);
    }
    syncVariablesToGame();
    return true;
  };

  var _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    ensureStore();
    syncVariablesToGame();
    if (Onyx.Skill.Recoleccion.refreshBonusFromUnlocks)
      Onyx.Skill.Recoleccion.refreshBonusFromUnlocks();
  };

  var _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    ensureStore();
    syncVariablesToGame();
    if (Onyx.Skill.Recoleccion.refreshBonusFromUnlocks)
      Onyx.Skill.Recoleccion.refreshBonusFromUnlocks();
  };

  var _Scene_Map_start = Scene_Map.prototype.start;
  Scene_Map.prototype.start = function() {
    _Scene_Map_start.call(this);
    if (Onyx.Skill.Recoleccion.ensureGatheringTableVar1001)
      Onyx.Skill.Recoleccion.ensureGatheringTableVar1001();
    if (this._onyxGatheringWindow && (!$gameTemp._onyxGathering || $gameTemp._onyxGathering.finishApplied)) {
      var ow = this._onyxGatheringWindow;
      if (ow.parent) ow.parent.removeChild(ow);
      this._onyxGatheringWindow = null;
    }
  };

  /**
   * Var 1001: nodos 1…53 (un nodo por material, sin sub-rangos por tipo).
   * Orden: 20–37, 38–47, 48–57, 58–72 (bayas; el ma_id 73 queda solo en MaterialRewards si lo usas en otro flujo).
   * no_lvl y tool_lvl coinciden; onyxSetNodeCanHarvestVar usa no_lvl vs SkillNodeLevelNeed (skill_id 4).
   * La primera fila por node_lvl en ese JSON fija el skill_lvl requerido; SkillUnlocks debe desbloquear
   * la hoz con tool_lvl N a nivel <= ese skill_lvl (nodos con tool_lvl 9 requieren skill 130; hoces 10+ son mejora).
   */
  var GATHERING_SLOTS_PER_MATERIAL = 1;

  function gatheringMaterialOrder() {
    var list = [];
    var m;
    for (m = 20; m <= 37; m++) list.push(m);
    for (m = 38; m <= 47; m++) list.push(m);
    for (m = 48; m <= 57; m++) list.push(m);
    for (m = 58; m <= 72; m++) list.push(m);
    return list;
  }

  function gatheringParamsForMaterial(ma_id) {
    var m = Number(ma_id) || 0;
    var time;
    var no_lvl;
    var tool_lvl;
    if (m >= 20 && m <= 28) {
      time = TIME_HIERBAS_SEC;
      tool_lvl = no_lvl = 1 + (m - 20);
    } else if (m >= 29 && m <= 37) {
      time = TIME_HIERBAS_SEC;
      tool_lvl = no_lvl = 1 + (m - 9 - 20);
    } else if (m >= 38 && m <= 47) {
      time = TIME_HONGOS_SEC;
      var idxP = m - 38;
      tool_lvl = no_lvl = idxP <= 7 ? idxP + 1 : 9;
    } else if (m >= 48 && m <= 57) {
      time = TIME_HONGOS_SEC;
      var idxH = m - 48;
      tool_lvl = no_lvl = idxH <= 7 ? idxH + 1 : 9;
    } else if (m >= 58 && m <= 72) {
      time = TIME_BAYAS_SEC;
      var idxB = m - 58;
      tool_lvl = no_lvl = idxB <= 7 ? idxB + 1 : 9;
    } else {
      time = TIME_HIERBAS_SEC;
      tool_lvl = no_lvl = 1;
    }
    return { time: time, no_lvl: no_lvl, tool_lvl: tool_lvl };
  }

  function buildGatheringNodeTable1001() {
    var table = {};
    var order = gatheringMaterialOrder();
    var i;
    var from;
    var to;
    var p;
    var id;
    var a;

    function fillRange(fromR, toR, time, ma_id, no_lvl, tool_lvl, active) {
      a = active !== undefined ? active : 1;
      for (id = fromR; id <= toR; id++) {
        table[id] = {
          time: time,
          ma_id: ma_id,
          no_lvl: no_lvl,
          tool_lvl: tool_lvl,
          active: a
        };
      }
    }

    for (i = 0; i < order.length; i++) {
      from = i + 1;
      to = i + 1;
      p = gatheringParamsForMaterial(order[i]);
      fillRange(from, to, p.time, order[i], p.no_lvl, p.tool_lvl, 1);
    }
    return table;
  }

  function needsGatheringTable1001Init() {
    var v = $gameVariables ? $gameVariables.value(1001) : null;
    if (!v || typeof v !== "object" || Array.isArray(v)) return true;
    var keys = Object.keys(v);
    if (keys.length === 0) return true;
    var first = v[1];
    if (!first || first.ma_id !== 20) return true;
    var order = gatheringMaterialOrder();
    var lastId = order.length;
    var lastMa = order[order.length - 1];
    var last = v[lastId];
    if (!last || last.ma_id !== lastMa) return true;
    return false;
  }

  Onyx.Skill.Recoleccion.gatheringMaterialOrder = gatheringMaterialOrder;
  Onyx.Skill.Recoleccion.gatheringParamsForMaterial = gatheringParamsForMaterial;
  Onyx.Skill.Recoleccion.GATHERING_SLOTS_PER_MATERIAL = GATHERING_SLOTS_PER_MATERIAL;
  Onyx.Skill.Recoleccion.gatheringNodeCount = function() {
    return gatheringMaterialOrder().length;
  };

  Onyx.Skill.Recoleccion.buildGatheringNodeTable1001 = buildGatheringNodeTable1001;
  Onyx.Skill.Recoleccion.ensureGatheringTableVar1001 = function() {
    if (!$gameVariables) return;
    if (needsGatheringTable1001Init())
      $gameVariables.setValue(1001, buildGatheringNodeTable1001());
  };

  function computeGatheringTotalSeconds(nodeId, tableVarId) {
    var tbl = $gameVariables ? $gameVariables.value(tableVarId) : {};
    var nodeData = tbl && tbl[nodeId] ? tbl[nodeId] : {};
    var baseTime = Number(nodeData.time);
    if (!baseTime || baseTime <= 0) baseTime = BASE_TIME_SECONDS;
    var speed = (typeof getEquippedToolSpeed === "function") ? getEquippedToolSpeed(C.ID) : 1;
    if (!speed || speed < 0.5) speed = 0.5;
    return Math.max(0.5, baseTime / speed);
  }

  function finishGatheringOnMap() {
    var g = $gameTemp._onyxGathering;
    if (!g || g.finishApplied) return;
    g.finishApplied = true;
    var nodeId = g.nodeId;
    var tableVarId = g.tableVarId;
    var scene = SceneManager._scene;
    if (scene instanceof Scene_Map && scene._onyxGatheringWindow) {
      var ow = scene._onyxGatheringWindow;
      if (ow.parent) ow.parent.removeChild(ow);
      scene._onyxGatheringWindow = null;
    }
    $gameTemp._onyxGathering = null;

    var table = $gameVariables ? $gameVariables.value(tableVarId) : {};
    var nodeData = table[nodeId] || {};
    var materialId = Number(nodeData.ma_id) || 0;
    if ($gameVariables && VAR_MATERIAL_ID > 0)
      $gameVariables.setValue(VAR_MATERIAL_ID, materialId);
    var rewardRes = null;
    var expQty = 0;
    var mainSuccess = false;
    if (typeof giveMaterialReward === "function") {
      rewardRes = giveMaterialReward(materialId, 0);
      if (rewardRes && rewardRes.success && rewardRes.qty != null) {
        expQty = Math.max(0, Math.floor(Number(rewardRes.qty)));
        mainSuccess = true;
      }
    } else {
      expQty = 1;
      mainSuccess = true;
    }
    var bonusOut = applyGatheringBonuses(materialId, mainSuccess);
    if (bonusOut && bonusOut.extraPlant) expQty += 1;
    Onyx.Skill.Recoleccion.addExpFromMaterial(materialId, expQty);
    if (typeof window.onyxSetNodeOff === "function")
      window.onyxSetNodeOff(nodeId, tableVarId);
    if ($gamePlayer) $gamePlayer.requestAnimation(131);
    if (!$gameTemp._onyxGatheringSuppressLocalSwitch) {
      var evid = Number($gameVariables.value(4)) || 0;
      if (evid > 0 && $gameMap && $gameSelfSwitches) {
        $gameSelfSwitches.setValue([$gameMap.mapId(), evid, "A"], true);
      }
    }
    $gameTemp._onyxGatheringSuppressLocalSwitch = false;
  }

  function Window_OnyxGatheringProgress(x, y, width, height) {
    this._progress = 0;
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.opacity = 255;
    this.backOpacity = 160;
    this.refresh();
  }
  Window_OnyxGatheringProgress.prototype = Object.create(Window_Base.prototype);
  Window_OnyxGatheringProgress.prototype.constructor = Window_OnyxGatheringProgress;

  Window_OnyxGatheringProgress.prototype.positionOverPlayer = function() {
    var px = $gamePlayer.screenX();
    var py = $gamePlayer.screenY();
    this.x = Math.round(px - this.width / 2 + GATHER_BAR_OFFSET_X);
    this.y = Math.round(py - this.height - GATHER_BAR_OFFSET_Y);
    this.x = Math.max(0, Math.min(Graphics.boxWidth - this.width, this.x));
    this.y = Math.max(0, Math.min(Graphics.boxHeight - this.height, this.y));
  };

  Window_OnyxGatheringProgress.prototype.setProgress = function(rate) {
    rate = Math.min(1, Math.max(0, Number(rate) || 0));
    if (this._progress !== rate) {
      this._progress = rate;
      this.refresh();
    }
  };

  Window_OnyxGatheringProgress.prototype.refresh = function() {
    this.contents.clear();
    this.drawText("Recolectando...", 0, 8, this.contents.width, "center");
    var barW = this.contents.width - 24;
    var barH = 20;
    var barX = 12;
    var barY = 36;
    this.contents.fillRect(barX, barY, barW, barH, this.gaugeBackColor());
    var fillW = Math.floor(barW * this._progress);
    if (fillW > 0) {
      this.contents.gradientFillRect(barX, barY, fillW, barH, this.hpGaugeColor1(), this.hpGaugeColor2());
    }
  };

  Scene_Map.prototype.ensureOnyxGatheringWindow = function() {
    if (this._onyxGatheringWindow) return;
    this._onyxGatheringWindow = new Window_OnyxGatheringProgress(0, 0, GATHER_BAR_W, GATHER_BAR_H);
    this._onyxGatheringWindow.openness = 255;
    this.addWindow(this._onyxGatheringWindow);
  };

  Scene_Map.prototype.updateOnyxGatheringOverlay = function() {
    var g = $gameTemp._onyxGathering;
    if (!g || g.finishApplied) return;
    this.ensureOnyxGatheringWindow();
    var win = this._onyxGatheringWindow;
    if (!win) return;
    win.positionOverPlayer();
    g.elapsed += 1 / 60;
    win.setProgress(g.elapsed / g.totalSeconds);
    if (g.elapsed >= g.totalSeconds) finishGatheringOnMap();
  };

  var _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    if ($gameTemp._onyxGathering && !$gameTemp._onyxGathering.finishApplied)
      this.updateOnyxGatheringOverlay();
    if ($gameVariables && Number($gameVariables.value(33)) === C.ID)
      syncVariablesToGame();
  };

  var _Game_Player_canMove = Game_Player.prototype.canMove;
  Game_Player.prototype.canMove = function() {
    if ($gameTemp._onyxGathering && !$gameTemp._onyxGathering.finishApplied) return false;
    return _Game_Player_canMove.call(this);
  };

  window.onyxStartGathering = function(nodeId, tableVarId) {
    nodeId = nodeId != null ? nodeId : ($gameVariables ? $gameVariables.value(89) : 0);
    tableVarId = Number(tableVarId) || 1001;
    if (!nodeId) return;
    if (!SceneManager._scene || !(SceneManager._scene instanceof Scene_Map)) {
      console.warn("[SkillRecoleccion] onyxStartGathering solo en el mapa.");
      return;
    }
    var totalSeconds = computeGatheringTotalSeconds(nodeId, tableVarId);
    $gameTemp._onyxGatheringNodeId = nodeId;
    $gameTemp._onyxGatheringTableVarId = tableVarId;
    $gameTemp._onyxGathering = {
      nodeId: nodeId,
      tableVarId: tableVarId,
      elapsed: 0,
      totalSeconds: totalSeconds,
      finishApplied: false
    };
    SceneManager._scene.ensureOnyxGatheringWindow();
    SceneManager._scene._onyxGatheringWindow.positionOverPlayer();
  };

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === "SkillRecoleccion" && args && args[0] === "StartGathering") {
      var nodeId = args[1] != null && args[1] !== "" ? Number(args[1]) : null;
      var tableVarId = args[2] != null && args[2] !== "" ? Number(args[2]) : 1001;
      if (nodeId == null && $gameVariables) nodeId = $gameVariables.value(89);
      onyxStartGathering(nodeId, tableVarId);
    }
  };

})();

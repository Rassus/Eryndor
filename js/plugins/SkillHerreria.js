/*:
 * @plugindesc (Onyx) v1.0.0.0 - Skill: Herrería - escena de crafteo (forja/yunque u otro recipe_type)
 * @name SkillHerreria
 * @author Onyx
 * @version 1.0.0.0
 *
 * @param varSkillLevel
 * @text Variable: Nivel de Skill
 * @type variable
 * @default 50
 *
 * @param varExpActual
 * @text Variable: EXP actual (dentro del nivel)
 * @type variable
 * @default 51
 *
 * @param varExpSiguiente
 * @text Variable: EXP siguiente (total del nivel actual)
 * @type variable
 * @default 52
 *
 * @param varMaterialId
 * @text Variable: material_id (reservado / addExpFromMaterialVar)
 * @type variable
 * @default 38
 *
 * @param varMaxSkillLevel
 * @text Variable: Nivel máximo de Skill
 * @type variable
 * @default 53
 *
 * @param forgeSecondsPerUnit
 * @text Segundos por unidad (forja)
 * @type number
 * @decimals 2
 * @default 1.0
 *
 * @param anvilSecondsPerUnit
 * @text Segundos por unidad (yunque)
 * @type number
 * @decimals 2
 * @default 1.5
 *
 * @param expPerCraftUnit
 * @text EXP por unidad fabricada (0 = off)
 * @type number
 * @default 0
 *
 * @help
 * skill_id 5 en SkillList.json. Requiere $dataCustom.Recipes (Recipes.json). Sin argumento tras Open,
 * solo se listan recetas "forja" y "yunque". Con argumento, solo ese recipe_type (ej. mesa crafteo, inventario).
 *
 * Convención de recetas:
 *  - forja: todos los input_material son del fuego (1 o 2 entradas). Yunque vacío.
 *  - yunque: input_material[0] = ítem del yunque (lingote). El resto (máx. 2) = forja.
 *
 * Plugin command:
 *   SkillHerreria Open
 *   SkillHerreria Open <tipo>
 *   El tipo es el recipe_type en minúsculas (como en Recipes.json). Si omites el tipo,
 *   se muestran solo recetas "forja" y "yunque" (comportamiento anterior).
 *   Ejemplos: SkillHerreria Open forja | SkillHerreria Open yunque | SkillHerreria Open mesa crafteo
 *   (en el editor de eventos, todo tras "Open" forma un solo tipo; "mesa crafteo" = dos argumentos unidos).
 *
 * Script (opcional):
 *   Onyx.Skill.Herreria.openCraftScene("mesa crafteo");
 *
 * Controles (escena):
 *  - Foco inicial en la lista de recetas (forja + yunque). Los materiales se consumen del inventario
 *    total (no hace falta asignar slots).
 *  - Inventario: solo referencia; opacidad baja en ítems que no entran en la receta seleccionada.
 *  - Recetas: flechas para elegir; ← → cantidad; OK fabricar (barra global). Cancel / Esc: salir.
 *  - No durante la barra de craft se puede cancelar.
 *
 * API (paridad con otras skills):
 *   Onyx.Skill.Herreria.state(), addExp(n), init(), isActive, reset, setLevel, openCraftScene(tipo)
 */

(function() {
  "use strict";
  var SKILL_HERRERIA_VERSION = "1.0.0.0";
  var ONYX_GLOBAL_MAX_TOTAL_EXP_STR = "2289796205681772328910848";
  var ONYX_GLOBAL_MAX_TOTAL_EXP = Number(ONYX_GLOBAL_MAX_TOTAL_EXP_STR);

  function clampTotalExp(n) {
    var x = Number(n) || 0;
    if (x < 0) x = 0;
    if (isFinite(ONYX_GLOBAL_MAX_TOTAL_EXP) && x > ONYX_GLOBAL_MAX_TOTAL_EXP) x = ONYX_GLOBAL_MAX_TOTAL_EXP;
    return x;
  }

  var PARAMS = PluginManager.parameters("SkillHerreria");
  var VAR_SKILL_LEVEL = Number(PARAMS["varSkillLevel"] || 50);
  var VAR_EXP_ACTUAL = Number(PARAMS["varExpActual"] || 51);
  var VAR_EXP_SIGUIENTE = Number(PARAMS["varExpSiguiente"] || 52);
  var VAR_MATERIAL_ID = Number(PARAMS["varMaterialId"] || 38);
  var VAR_MAX_SKILL_LEVEL = Number(PARAMS["varMaxSkillLevel"] || 53);
  var VAR_LEARNED_RECIPES = 1010; // [{ recipe_id, is_learn }]
  var FORGE_SEC = Math.max(0.05, Number(PARAMS["forgeSecondsPerUnit"]) || 1);
  var ANVIL_SEC = Math.max(0.05, Number(PARAMS["anvilSecondsPerUnit"]) || 1.5);
  var EXP_PER_CRAFT = Math.max(0, Number(PARAMS["expPerCraftUnit"]) || 0);
  var _pendingHerreriaCraftSessionType = null;

  window.Onyx = window.Onyx || {};
  Onyx.Skill = Onyx.Skill || {};

  var C = {
    ID: 5,
    NAME: "Herrería"
  };

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
        console.warn("[SkillHerreria] ExpTable no cargado. Usando fallback.");
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
    return getSkillCapFromList(C.ID) || 120;
  }

  function ensureStore() {
    if (!$gameSystem) return null;
    $gameSystem._onyxSkills = $gameSystem._onyxSkills || {};
    $gameSystem._onyxSkills[C.ID] = $gameSystem._onyxSkills[C.ID] || {
      skill_lvl: 1,
      skill_total_exp: 0,
      skill_exp_mul: 1,
      skill_lvl_virtual: 0,
      bonus: {},
      stats: { crafts_done: 0 },
      learned_recipes: {}
    };
    if (!$gameSystem._onyxSkills[C.ID].learned_recipes) {
      $gameSystem._onyxSkills[C.ID].learned_recipes = {};
    }
    $gameSystem._onyxSkills[C.ID].skill_total_exp = clampTotalExp($gameSystem._onyxSkills[C.ID].skill_total_exp);
    return $gameSystem._onyxSkills[C.ID];
  }

  function normalizeLearnedRecipesArray(raw) {
    var arr = Array.isArray(raw) ? raw : [];
    var out = [];
    var seen = {};
    for (var i = 0; i < arr.length; i++) {
      var r = arr[i];
      if (!r) continue;
      var rid = Number(r.recipe_id) || 0;
      if (!(rid > 0) || seen[rid]) continue;
      seen[rid] = true;
      var isLearn = false;
      if (typeof r.is_learn === "string") {
        var s = r.is_learn.toLowerCase().trim();
        isLearn = s === "true" || s === "1" || s === "si" || s === "yes";
      } else {
        isLearn = !!r.is_learn;
      }
      out.push({ recipe_id: rid, is_learn: isLearn ? 1 : 0 });
    }
    return out;
  }

  function getLearnedRecipesArrayFromVar() {
    if (!$gameVariables) return [];
    return normalizeLearnedRecipesArray($gameVariables.value(VAR_LEARNED_RECIPES));
  }

  function setLearnedRecipesArrayToVar(arr) {
    if (!$gameVariables) return;
    $gameVariables.setValue(VAR_LEARNED_RECIPES, normalizeLearnedRecipesArray(arr));
  }

  function setRecipeLearnStateInVar(recipeId, isLearn) {
    var rid = Number(recipeId) || 0;
    if (!(rid > 0)) return false;
    var arr = getLearnedRecipesArrayFromVar();
    var found = false;
    for (var i = 0; i < arr.length; i++) {
      if (Number(arr[i].recipe_id) === rid) {
        arr[i].is_learn = isLearn ? 1 : 0;
        found = true;
        break;
      }
    }
    if (!found) arr.push({ recipe_id: rid, is_learn: isLearn ? 1 : 0 });
    setLearnedRecipesArrayToVar(arr);
    return true;
  }

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
    var st = Onyx.Skill.Herreria.state();
    if (VAR_SKILL_LEVEL > 0) $gameVariables.setValue(VAR_SKILL_LEVEL, st.lvl > 0 ? st.lvl : 1);
    if (VAR_EXP_ACTUAL > 0) $gameVariables.setValue(VAR_EXP_ACTUAL, st.expIntoLevel != null ? st.expIntoLevel : 0);
    if (VAR_EXP_SIGUIENTE > 0) {
      var nextVal = st.nextLevelTotalExp != null ? st.nextLevelTotalExp : st.curLvlTotal;
      if (nextVal == null) nextVal = 0;
      $gameVariables.setValue(VAR_EXP_SIGUIENTE, nextVal);
    }
  }

  Onyx.Skill.Herreria = Onyx.Skill.Herreria || {};

  Onyx.Skill.Herreria.state = function() {
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
    return {
      id: C.ID,
      name: C.NAME,
      lvl: lvl,
      cap: cap,
      totalExp: total,
      curLvlTotal: curLvlTotal,
      expIntoLevel: expIntoLevel,
      nextLevelTotalExp: nextLvlTotal,
      remaining: nextLvlTotal != null ? Math.max(0, nextLvlTotal - total) : 0
    };
  };

  Onyx.Skill.Herreria.addExp = function(amount) {
    var st = ensureStore();
    if (!st) return { ok: false, reason: "no_gamesystem", leveledUp: false };
    var add = Number(amount) || 0;
    if (add <= 0) {
      return { ok: true, added: 0, levelUps: 0, leveledUp: false, state: Onyx.Skill.Herreria.state() };
    }
    var cap = getCap();
    var beforeLvl = Math.max(1, Number(st.skill_lvl) || 1);
    var beforeTotal = clampTotalExp(st.skill_total_exp);
    var afterTotal = clampTotalExp(beforeTotal + add);
    st.skill_total_exp = afterTotal;
    var afterLvl = recalcLevelFromTotalExp(st.skill_total_exp, beforeLvl);
    if (afterLvl > cap) afterLvl = cap;
    st.skill_lvl = afterLvl;
    autoLearnRecipesByLevel();
    syncVariablesToGame();
    var levelUps = Math.max(0, afterLvl - beforeLvl);
    return {
      ok: true,
      added: Math.max(0, afterTotal - beforeTotal),
      levelUps: levelUps,
      leveledUp: levelUps > 0,
      state: Onyx.Skill.Herreria.state()
    };
  };

  Onyx.Skill.Herreria.addExpFromMaterialVar = function() {
    var materialId = $gameVariables ? $gameVariables.value(VAR_MATERIAL_ID) : 0;
    var list = window.$dataCustom && window.$dataCustom.MaterialRewards;
    if (!list || !Array.isArray(list)) {
      return Onyx.Skill.Herreria.addExp(0);
    }
    var entry = null;
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      if (row && Number(row.material_id) === Number(materialId)) {
        entry = row;
        break;
      }
    }
    if (!entry || entry.exp == null || Number(entry.exp) <= 0) {
      return { ok: true, added: 0, levelUps: 0, leveledUp: false, state: Onyx.Skill.Herreria.state() };
    }
    return Onyx.Skill.Herreria.addExp(Number(entry.exp) || 0);
  };

  Onyx.Skill.Herreria.setLevel = function(level) {
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
    autoLearnRecipesByLevel();
    syncVariablesToGame();
    return true;
  };

  Onyx.Skill.Herreria.reset = function() {
    var st = ensureStore();
    if (!st) return false;
    st.skill_lvl = 1;
    st.skill_total_exp = 0;
    autoLearnRecipesByLevel();
    syncVariablesToGame();
    return true;
  };

  Onyx.Skill.Herreria.isActive = function() {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.isActive) {
      return Onyx.SkillsActive.isActive(C.ID);
    }
    return true;
  };

  Onyx.Skill.Herreria.init = function() {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.activate) {
      Onyx.SkillsActive.activate(C.ID);
    }
    var skill_list = window.$dataCustom && window.$dataCustom.SkillList;
    var max_lvl = 120;
    if (skill_list) {
      for (var i = 0; i < skill_list.length; i++) {
        var row = skill_list[i];
        if (row && Number(row.skill_id) === C.ID) {
          max_lvl = Number(row.skill_max_level) || 120;
          break;
        }
      }
    }
    Onyx.Skill.Herreria.reset();
    autoLearnRecipesByLevel();
    if ($gameVariables && VAR_MAX_SKILL_LEVEL > 0) {
      $gameVariables.setValue(VAR_MAX_SKILL_LEVEL, max_lvl);
    }
    syncVariablesToGame();
    return true;
  };

  Onyx.Skill.Herreria.refreshBonusFromUnlocks = function() {
    var st = ensureStore();
    if (!st) return;
    var cap = getCap();
    var lvl = Math.max(1, Number(st.skill_lvl) || 1);
    var total = clampTotalExp(st.skill_total_exp);
    st.skill_total_exp = total;
    lvl = recalcLevelFromTotalExp(total, lvl);
    if (lvl > cap) lvl = cap;
    st.skill_lvl = lvl;
    syncVariablesToGame();
  };

  Onyx.Skill.Herreria.learnRecipe = function(recipeId) {
    var rid = Number(recipeId) || 0;
    return setRecipeLearnStateInVar(rid, true);
  };

  Onyx.Skill.Herreria.unlearnRecipe = function(recipeId) {
    var rid = Number(recipeId) || 0;
    return setRecipeLearnStateInVar(rid, false);
  };

  Onyx.Skill.Herreria.isRecipeLearned = function(recipeId) {
    return isRecipeLearnedInStore(recipeId);
  };

  Onyx.Skill.Herreria.openCraftScene = function(craftType) {
    openHerreriaScene(craftType);
  };

  // ---------------------------------------------------------------------------
  // Recipes helpers (tipo de estación / recipe_type)
  // ---------------------------------------------------------------------------
  function getRecipesArray() {
    var d = window.$dataCustom && window.$dataCustom.Recipes;
    if (!d) return [];
    var arr = d.recipes;
    if (!arr && Array.isArray(d)) arr = d;
    return Array.isArray(arr) ? arr : [];
  }

  function normalizeCraftSessionType(s) {
    if (s == null) return "";
    var t = String(s).toLowerCase().replace(/\s+/g, " ").trim();
    return t;
  }

  /** Sin tipo explícito: solo forja + yunque (compatibilidad). Con tipo: coincide con recipe_type. */
  function isLegacyDefaultCraftSession(sessionTypeNorm) {
    return !sessionTypeNorm;
  }

  function recipeTypeNormalized(r) {
    if (!r) return "";
    return String(r.recipe_type || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function recipeMatchesCraftSession(r, sessionTypeNorm) {
    if (!r) return false;
    var t = recipeTypeNormalized(r);
    if (isLegacyDefaultCraftSession(sessionTypeNorm)) {
      return t === "forja" || t === "yunque";
    }
    return t === sessionTypeNorm;
  }

function recipeSkillId(recipe) {
  var sid = Number(recipe && recipe.skill_id);
  if (!sid || sid <= 0) sid = C.ID;
  return sid;
}

function recipeRequiredLevel(recipe) {
  if (!recipe) return 1;
  var v = recipe.nivel;
  if (v == null) v = recipe.skill_level;
  var n = Math.floor(Number(v) || 1);
  if (n < 1) n = 1;
  return n;
}

function currentSkillLevel(skillId) {
  var sid = Number(skillId) || 0;
  if (sid === C.ID && window.Onyx && Onyx.Skill && Onyx.Skill.Herreria && Onyx.Skill.Herreria.state) {
    var st = Onyx.Skill.Herreria.state();
    return Math.max(1, Number(st && st.lvl) || 1);
  }
  var store = $gameSystem && $gameSystem._onyxSkills;
  if (store && store[sid]) {
    return Math.max(1, Number(store[sid].skill_lvl) || 1);
  }
  return 1;
}

function canUseRecipeByLevel(recipe) {
  var sid = recipeSkillId(recipe);
  var req = recipeRequiredLevel(recipe);
  return currentSkillLevel(sid) >= req;
}

function recipeHasBeenLearnedFlag(recipe) {
  if (!recipe) return true;
  var v = recipe.has_been_learned;
  if (v == null) return false;
  if (typeof v === "string") {
    var s = v.toLowerCase().trim();
    if (s === "false" || s === "0" || s === "no") return false;
    if (s === "true" || s === "1" || s === "si" || s === "yes") return true;
  }
  return !!v;
}

function isRecipeLearnedInStore(recipeId) {
  var rid = Number(recipeId) || 0;
  if (!(rid > 0)) return false;
  var arr = getLearnedRecipesArrayFromVar();
  for (var i = 0; i < arr.length; i++) {
    if (Number(arr[i].recipe_id) === rid) return !!arr[i].is_learn;
  }
  return false;
}

function recipeNeedsManualLearning(recipe) {
  if (!recipe) return false;
  var raw = recipe.must_be_learned;
  if (raw == null) raw = recipe.requires_learning;
  if (raw == null) return false;
  if (typeof raw === "string") {
    var s = raw.toLowerCase().trim();
    return s === "true" || s === "1" || s === "si" || s === "yes";
  }
  return !!raw;
}

function canUseRecipeByLearnState(recipe) {
  if (!recipe) return false;
  // Regla de diseño:
  // has_been_learned = false => receta por nivel (auto-disponible al cumplir nivel)
  // has_been_learned = true  => requiere aprendizaje manual (receta item/evento)
  var manualByFlag = recipeHasBeenLearnedFlag(recipe);
  // Compat: allow explicit legacy flags too.
  var manualLegacy = recipeNeedsManualLearning(recipe);
  if (!(manualByFlag || manualLegacy)) {
    // Aprendizaje automático por nivel: registrar en var 1010.
    if (canUseRecipeByLevel(recipe)) {
      setRecipeLearnStateInVar(recipe.recipe_id, true);
      return true;
    }
    return false;
  }
  return isRecipeLearnedInStore(recipe.recipe_id);
}

function canUseRecipe(recipe) {
  return canUseRecipeByLevel(recipe) && canUseRecipeByLearnState(recipe);
}

function autoLearnRecipesByLevel() {
  var list = getRecipesArray();
  var lvl = currentSkillLevel(C.ID);
  for (var i = 0; i < list.length; i++) {
    var r = list[i];
    if (!r) continue;
    if (recipeSkillId(r) !== C.ID) continue;
    var manualByFlag = recipeHasBeenLearnedFlag(r);
    var manualLegacy = recipeNeedsManualLearning(r);
    if (manualByFlag || manualLegacy) continue;
    if (recipeRequiredLevel(r) <= lvl) {
      setRecipeLearnStateInVar(r.recipe_id, true);
    }
  }
}

  function dbObjectFromInput(inp) {
    if (!inp) return null;
    var typ = String(inp.type || "item").toLowerCase();
    var id = Number(inp.data_id) || 0;
    if (id <= 0) return null;
    if (typ === "weapon") return $dataWeapons[id];
    if (typ === "armor") return $dataArmors[id];
    return $dataItems[id];
  }

  function slotItemObject(slotIndex) {
    if (slotIndex == null || slotIndex < 0) return null;
    var slots = window.OnyxInv && OnyxInv.slots ? OnyxInv.slots() : null;
    if (!slots) return null;
    var s = slots[slotIndex];
    if (!s || !s.kind || !s.id) return null;
    var id = Number(s.id);
    if (s.kind === "weapon") return $dataWeapons[id];
    if (s.kind === "armor") return $dataArmors[id];
    if (s.kind === "item") return $dataItems[id];
    return null;
  }

  function listRecipesForCraftSession(sessionTypeNorm) {
    var norm = normalizeCraftSessionType(sessionTypeNorm);
    var out = [];
    var list = getRecipesArray();
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (!recipeMatchesCraftSession(r, norm)) continue;
      if (recipeSkillId(r) !== C.ID) continue;
      out.push(r);
    }
    return out;
  }

  function maxCraftForRecipe(recipe) {
 if (!canUseRecipe(recipe)) return 0;
    var ins = recipe.input_material || [];
    if (!ins.length) return 0;
    var n = Infinity;
    for (var i = 0; i < ins.length; i++) {
      var obj = dbObjectFromInput(ins[i]);
      if (!obj) return 0;
      var need = Math.max(1, Math.floor(Number(ins[i].count) || 1));
      var have = $gameParty.numItems(obj);
      n = Math.min(n, Math.floor(have / need));
    }
    if (!isFinite(n) || n < 0) return 0;
    return n;
  }

  function secondsPerUnitForRecipe(recipe) {
    if (!recipe) return FORGE_SEC;
    var t = String(recipe.recipe_type || "").toLowerCase();
    return t === "yunque" ? ANVIL_SEC : FORGE_SEC;
  }

  function applyCraft(recipe, qty) {
 if (!canUseRecipe(recipe)) return false;
    var ins = recipe.input_material || [];
    for (var i = 0; i < ins.length; i++) {
      var obj = dbObjectFromInput(ins[i]);
      if (!obj) return false;
      var need = Math.max(1, Math.floor(Number(ins[i].count) || 1)) * qty;
      if ($gameParty.numItems(obj) < need) return false;
    }
    for (var j = 0; j < ins.length; j++) {
      var o2 = dbObjectFromInput(ins[j]);
      var nd = Math.max(1, Math.floor(Number(ins[j].count) || 1)) * qty;
      $gameParty.loseItem(o2, nd);
    }
    var outType = String(recipe.output_type || "item").toLowerCase();
    var oid = Number(recipe.output_id) || 0;
    var oc = Math.max(1, Math.floor(Number(recipe.output_count) || 1)) * qty;
    if (outType === "weapon") {
      $gameParty.gainItem($dataWeapons[oid], oc);
    } else if (outType === "armor") {
      $gameParty.gainItem($dataArmors[oid], oc);
    } else {
      $gameParty.gainItem($dataItems[oid], oc);
    }
    var st = ensureStore();
    if (st && st.stats) st.stats.crafts_done = (Number(st.stats.crafts_done) || 0) + qty;
  var expPerUnit = Number(recipe && recipe.exp);
  if (!isFinite(expPerUnit) || expPerUnit < 0) expPerUnit = EXP_PER_CRAFT;
  if (expPerUnit > 0) Onyx.Skill.Herreria.addExp(expPerUnit * qty);
    return true;
  }

  function canApplyCraft(recipe, qty) {
 if (!canUseRecipe(recipe)) return false;
    var ins = recipe.input_material || [];
    for (var i = 0; i < ins.length; i++) {
      var obj = dbObjectFromInput(ins[i]);
      if (!obj) return false;
      var need = Math.max(1, Math.floor(Number(ins[i].count) || 1)) * qty;
      if ($gameParty.numItems(obj) < need) return false;
    }
    return true;
  }

function iconIndexForInput(inp) {
  var obj = dbObjectFromInput(inp);
  return obj && obj.iconIndex != null ? Number(obj.iconIndex) || 0 : 0;
}

function iconIndexForRecipeOutput(recipe) {
  if (!recipe) return 0;
  var outType = String(recipe.output_type || "item").toLowerCase();
  var id = Number(recipe.output_id) || 0;
  if (outType === "weapon" && $dataWeapons[id]) return Number($dataWeapons[id].iconIndex) || 0;
  if (outType === "armor" && $dataArmors[id]) return Number($dataArmors[id].iconIndex) || 0;
  if ($dataItems[id]) return Number($dataItems[id].iconIndex) || 0;
  return 0;
}

  // ---------------------------------------------------------------------------
  // Inventario: opacidad según receta seleccionada
  // ---------------------------------------------------------------------------
  function invSlotDimmed(scene, slotIndex) {
    var recipe = scene._selectedRecipe;
    if (!recipe) return false;
    var obj = slotItemObject(slotIndex);
    if (!obj) return false;
    var kind = DataManager.isItem(obj) ? "item" : DataManager.isWeapon(obj) ? "weapon" : "armor";
    var dataId = Number(obj.id);
    var ins = recipe.input_material || [];
    var map = { item: "item", weapon: "weapon", armor: "armor" };
    for (var i = 0; i < ins.length; i++) {
      var inp = ins[i];
      if (!inp) continue;
      var typ = String(inp.type || "item").toLowerCase();
      var want = map[typ] || "item";
      if (want === kind && (Number(inp.data_id) || 0) === dataId) return false;
    }
    return true;
  }

  // ---------------------------------------------------------------------------
  // Windows
  // ---------------------------------------------------------------------------
  function Window_HerreriaStationPanel(x, y, w, h) {
    this.initialize.apply(this, arguments);
  }
  Window_HerreriaStationPanel.prototype = Object.create(Window_Base.prototype);
  Window_HerreriaStationPanel.prototype.constructor = Window_HerreriaStationPanel;
  Window_HerreriaStationPanel.prototype.initialize = function(x, y, w, h) {
    Window_Base.prototype.initialize.call(this, x, y, w, h);
  };
  Window_HerreriaStationPanel.prototype.setScene = function(scene) {
    this._hScene = scene;
  };
  Window_HerreriaStationPanel.prototype.refresh = function() {
    this.contents.clear();
    if (!this._hScene) return;
    var sc = this._hScene;
    var lh = this.lineHeight();
  var y = 0;
  var progressBlockH = lh + 14;
  var progressTop = Math.max(0, this.contentsHeight() - progressBlockH);
    var recipe = sc._selectedRecipe;
    if (recipe) {
      var ins = recipe.input_material || [];
    var outIcon = iconIndexForRecipeOutput(recipe);
    this.changeTextColor(this.systemColor());
    this.drawText("Resultado", 0, y, this.contentsWidth(), "left");
    this.resetTextColor();
    y += lh;
    if (outIcon > 0) this.drawIcon(outIcon, 0, y);
    var outCount = Math.max(1, Math.floor(Number(recipe.output_count) || 1));
    this.drawText("x" + outCount, 38, y + 4, 80, "left");
    y += 42;
    this.changeTextColor(this.systemColor());
    this.drawText("Materiales", 0, y, this.contentsWidth(), "left");
    this.resetTextColor();
    y += lh;
    var rowH = 36;
    var maxLines = Math.max(0, Math.floor((progressTop - y) / rowH));
    for (var i = 0; i < ins.length && i < maxLines; i++) {
        var inp = ins[i];
      var icon = iconIndexForInput(inp);
      var need = Math.max(1, Math.floor(Number(inp && inp.count) || 1));
      var obj = dbObjectFromInput(inp);
      var have = obj ? $gameParty.numItems(obj) : 0;
      var ok = have >= need;
      this.changePaintOpacity(ok ? 1 : 0.4);
      if (icon > 0) this.drawIcon(icon, 0, y - 2);
      this.changePaintOpacity(1);
      this.changeTextColor(ok ? this.normalColor() : this.deathColor());
      this.drawText(have + "/" + need, 38, y + 2, 90, "right");
      this.resetTextColor();
      y += rowH;
      }
      if (ins.length > maxLines) {
      this.changeTextColor(this.systemColor());
      this.drawText("+" + (ins.length - maxLines), 0, y, 40, "left");
      this.resetTextColor();
        y += lh - 2;
      }
    } else {
    this.drawText("Elige receta", 0, y, this.contentsWidth(), "left");
      y += lh * 2;
    }
  var barY = progressTop;
  this.drawText("Progreso", 0, barY, 110, "left");
    var bw = this.contentsWidth() - 8;
    var bh = 12;
    this.contents.fillRect(0, barY + lh - 6, bw, bh, this.gaugeBackColor());
    var ratio = sc._craftTotalSec > 0 ? Math.min(1, sc._craftElapsedSec / sc._craftTotalSec) : 0;
    this.contents.fillRect(0, barY + lh - 6, Math.floor(bw * ratio), bh, this.hpGaugeColor1());
  };

  function Window_HerreriaInv(x, y, w, h) {
    this.initialize.apply(this, arguments);
  }
  Window_HerreriaInv.prototype = Object.create(Window_Selectable.prototype);
  Window_HerreriaInv.prototype.constructor = Window_HerreriaInv;
  Window_HerreriaInv.prototype.initialize = function(x, y, w, h) {
    Window_Selectable.prototype.initialize.call(this, x, y, w, h);
    this._hScene = null;
    this.refresh();
  };
  Window_HerreriaInv.prototype.setScene = function(s) {
    this._hScene = s;
  };
  Window_HerreriaInv.prototype.maxItems = function() {
    return window.OnyxInv && OnyxInv.slotCount ? OnyxInv.slotCount() : 28;
  };
  Window_HerreriaInv.prototype.maxCols = function() {
    return 4;
  };
  Window_HerreriaInv.prototype.itemHeight = function() {
    return Window_Selectable.prototype.itemHeight.call(this) + 8;
  };
  Window_HerreriaInv.prototype.drawItem = function(index) {
    var rect = this.itemRect(index);
    var slots = window.OnyxInv && OnyxInv.slots ? OnyxInv.slots() : [];
    var s = slots[index];
    this.changePaintOpacity(1);
    if (this._hScene && s && invSlotDimmed(this._hScene, index)) {
      this.changePaintOpacity(0.35);
    }
    if (!s || !s.kind) {
      this.changePaintOpacity(1);
      return;
    }
    var obj = slotItemObject(index);
    if (!obj) {
      this.changePaintOpacity(1);
      return;
    }
  var icon = Number(obj.iconIndex) || 0;
  if (icon > 0) {
    var ix = rect.x + Math.max(0, Math.floor((rect.width - Window_Base._iconWidth) / 2));
    var iy = rect.y + 2;
    this.drawIcon(icon, ix, iy);
  }
  var amt = Number(s.amount) || 0;
  if (amt > 1 || s.kind === "item") {
    this.drawText(String(amt), rect.x, rect.y + rect.height - 22, rect.width - 4, "right");
    }
    this.changePaintOpacity(1);
  };
  Window_HerreriaInv.prototype.isOkEnabled = function() {
    return true;
  };
  Window_HerreriaInv.prototype.processOk = function() {
    if (!this._hScene || this._hScene._craftTotalSec > 0) return;
    Window_Selectable.prototype.processOk.call(this);
  };
  Window_HerreriaInv.prototype.cursorDown = function(wrap) {
    Window_Selectable.prototype.cursorDown.call(this, wrap);
    if (this._hScene) this._hScene.onInvCursorChange();
  };
  Window_HerreriaInv.prototype.cursorUp = function(wrap) {
    Window_Selectable.prototype.cursorUp.call(this, wrap);
    if (this._hScene) this._hScene.onInvCursorChange();
  };
  Window_HerreriaInv.prototype.cursorRight = function(wrap) {
    Window_Selectable.prototype.cursorRight.call(this, wrap);
    if (this._hScene) this._hScene.onInvCursorChange();
  };
  Window_HerreriaInv.prototype.cursorLeft = function(wrap) {
    Window_Selectable.prototype.cursorLeft.call(this, wrap);
    if (this._hScene) this._hScene.onInvCursorChange();
  };

  function Window_HerreriaRecipes(x, y, w, h) {
    this.initialize.apply(this, arguments);
  }
  Window_HerreriaRecipes.prototype = Object.create(Window_Selectable.prototype);
  Window_HerreriaRecipes.prototype.constructor = Window_HerreriaRecipes;
  Window_HerreriaRecipes.prototype.initialize = function(x, y, w, h) {
  // maxItems() puede ser consultado durante initialize del padre.
  this._list = [];
  this._hScene = null;
    Window_Selectable.prototype.initialize.call(this, x, y, w, h);
  };
  Window_HerreriaRecipes.prototype.setScene = function(s) {
    this._hScene = s;
  };
  Window_HerreriaRecipes.prototype.setList = function(arr, selectIndex) {
    this._list = arr || [];
    this.setTopRow(0);
    var idx = 0;
    if (this._list.length > 0) {
      if (selectIndex != null && isFinite(selectIndex)) {
        idx = Math.max(0, Math.floor(Number(selectIndex)));
        if (idx >= this._list.length) idx = this._list.length - 1;
      }
      this.select(idx);
    } else {
      this.select(0);
    }
    this.refresh();
  };
  Window_HerreriaRecipes.prototype.maxItems = function() {
  return this._list ? this._list.length : 0;
  };
  Window_HerreriaRecipes.prototype.drawItem = function(index) {
    var r = this._list[index];
    var rect = this.itemRect(index);
    if (!r) return;
  var craftable = maxCraftForRecipe(r) > 0;
  this.changePaintOpacity(craftable ? 1 : 0.35);
  var icon = iconIndexForRecipeOutput(r);
  if (icon > 0) {
    var ix = rect.x + 4;
    var iy = rect.y + Math.max(0, Math.floor((rect.height - Window_Base._iconHeight) / 2));
    this.drawIcon(icon, ix, iy);
  }
  var name = r.output_name || r.recipe_name || "Receta";
  this.drawText(name, rect.x + 42, rect.y, Math.max(48, rect.width - 46), "left");
  this.changePaintOpacity(1);
  };
  Window_HerreriaRecipes.prototype.isOkEnabled = function() {
    return this._list.length > 0;
  };
  Window_HerreriaRecipes.prototype.processOk = function() {
    if (!this._hScene || this._hScene._craftTotalSec > 0) return;
    Window_Selectable.prototype.processOk.call(this);
  };
  Window_HerreriaRecipes.prototype.cursorLeft = function(wrap) {
    return;
  };
  Window_HerreriaRecipes.prototype.cursorRight = function(wrap) {
    return;
  };

  // ---------------------------------------------------------------------------
  // Scene
  // ---------------------------------------------------------------------------
  function Scene_SkillHerreria() {
    this.initialize.apply(this, arguments);
  }
  Scene_SkillHerreria.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_SkillHerreria.prototype.constructor = Scene_SkillHerreria;

  Scene_SkillHerreria.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
    var pen = _pendingHerreriaCraftSessionType;
    _pendingHerreriaCraftSessionType = null;
    this._sessionRecipeType = pen != null ? pen : "";
    this._focusRecipes = true;
    this._selectedRecipe = null;
    this._craftQty = 1;
    this._craftTotalSec = 0;
    this._craftElapsedSec = 0;
    this._craftPendingRecipe = null;
    this._craftPendingQty = 0;
    this._lastRecipeHover = null;
    this._filteredRecipes = [];
  };

  Scene_SkillHerreria.prototype.rebuildRecipeList = function() {
  autoLearnRecipesByLevel();
    var prevId = null;
    if (this._recipeWindow && this._filteredRecipes && this._filteredRecipes.length) {
      var ix = this._recipeWindow.index();
      if (ix >= 0 && ix < this._filteredRecipes.length && this._filteredRecipes[ix]) {
        prevId = this._filteredRecipes[ix].recipe_id;
      }
    } else if (this._selectedRecipe && this._selectedRecipe.recipe_id != null) {
      prevId = this._selectedRecipe.recipe_id;
    }
    this._filteredRecipes = listRecipesForCraftSession(this._sessionRecipeType);
    var prefer = 0;
    if (prevId != null) {
      for (var i = 0; i < this._filteredRecipes.length; i++) {
        if (Number(this._filteredRecipes[i].recipe_id) === Number(prevId)) {
          prefer = i;
          break;
        }
      }
    }
    if (this._recipeWindow) {
      this._recipeWindow.setList(this._filteredRecipes, prefer);
    }
    if (this._filteredRecipes.length > 0) {
      this._selectedRecipe = this._filteredRecipes[prefer];
      this._lastRecipeHover = this._selectedRecipe;
    } else {
      this._selectedRecipe = null;
      this._lastRecipeHover = null;
    }
    this._craftQty = 1;
  if (this._stationWindow) this._stationWindow.refresh();
    this.refreshQtyHelp();
  };

  Scene_SkillHerreria.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this.createHelpWindow();
    if (this._helpWindow) {
      var hint = isLegacyDefaultCraftSession(this._sessionRecipeType)
        ? "Herrería: forja y yunque."
        : ("Herrería: recetas tipo \"" + this._sessionRecipeType + "\".");
      this._helpWindow.setText(hint + " ← → cantidad. OK fabricar. Esc salir.");
      this._helpWindow.visible = true;
    }
    var wx = 0;
    var wy = this._helpWindow ? this._helpWindow.height : 0;
    var leftW = 340;
    var rightX = leftW + 8;
    var rightW = Graphics.boxWidth - rightX;
  var panelH = Graphics.boxHeight - wy - 8;
    this._stationWindow = new Window_HerreriaStationPanel(wx, wy, leftW, panelH);
    this._stationWindow.setScene(this);
    this.addWindow(this._stationWindow);
    var rwy = wy;
  var rwh = Graphics.boxHeight - rwy - 36;
    this._recipeWindow = new Window_HerreriaRecipes(rightX, rwy, rightW, rwh);
    this._recipeWindow.setHandler("ok", this.onRecipeOk.bind(this));
    this._recipeWindow.setHandler("cancel", this.onRecipeCancel.bind(this));
    this._recipeWindow.setScene(this);
    this.addWindow(this._recipeWindow);
  this._qtyWindow = new Window_Help(0, Graphics.boxHeight - 28, Graphics.boxWidth, 28);
    this.addWindow(this._qtyWindow);
    this.rebuildRecipeList();
    this.activateRecipeFocus();
  };

  Scene_SkillHerreria.prototype.start = function() {
    Scene_MenuBase.prototype.start.call(this);
    this._craftTotalSec = 0;
    this._craftElapsedSec = 0;
  };

  Scene_SkillHerreria.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    if (this._craftTotalSec > 0) {
      this._craftElapsedSec += 1 / 60;
      if (this._craftElapsedSec >= this._craftTotalSec) {
        this.finishCraft();
      }
      if (this._stationWindow) this._stationWindow.refresh();
      return;
    }
    if (this._focusRecipes && this._recipeWindow && this._recipeWindow.active && this._selectedRecipe) {
      if (Input.isRepeated("left") || Input.isTriggered("left")) {
        this._craftQty = Math.max(1, this._craftQty - (Input.isPressed("shift") ? 10 : 1));
        this.refreshQtyHelp();
      }
      if (Input.isRepeated("right") || Input.isTriggered("right")) {
        var maxq = this.maxQtyForSelected();
        this._craftQty = Math.min(Math.max(1, maxq), this._craftQty + (Input.isPressed("shift") ? 10 : 1));
        this.refreshQtyHelp();
      }
    }
  };

  Scene_SkillHerreria.prototype.activateRecipeFocus = function() {
    this._focusRecipes = true;
    if (this._recipeWindow) {
      this._recipeWindow.activate();
      if (this._recipeWindow.maxItems() > 0) {
        var ix = this._recipeWindow.index();
        if (ix < 0 || ix >= this._filteredRecipes.length) ix = 0;
        this._recipeWindow.select(ix);
        this._selectedRecipe = this._filteredRecipes[ix];
        this._craftQty = 1;
      } else {
        this._selectedRecipe = null;
      }
    }
    if (this._stationWindow) this._stationWindow.refresh();
    this.refreshQtyHelp();
  };

  Scene_SkillHerreria.prototype.onInvCursorChange = function() {
  return;
  };

  Scene_SkillHerreria.prototype.onRecipeOk = function() {
    var i = this._recipeWindow.index();
    this._selectedRecipe = this._filteredRecipes[i];
    if (!this._selectedRecipe) return;
    var maxq = this.maxQtyForSelected();
    if (maxq <= 0) {
      SoundManager.playBuzzer();
      return;
    }
    this._craftQty = Math.min(this._craftQty, maxq);
    this.startCraft(this._selectedRecipe, this._craftQty);
  };

  Scene_SkillHerreria.prototype.onRecipeCancel = function() {
    this.popScene();
  };

  Scene_SkillHerreria.prototype.maxQtyForSelected = function() {
    if (!this._selectedRecipe) return 0;
    return maxCraftForRecipe(this._selectedRecipe);
  };

  Scene_SkillHerreria.prototype.refreshQtyHelp = function() {
    if (!this._qtyWindow) return;
    if (this._focusRecipes && this._selectedRecipe) {
      var mx = this.maxQtyForSelected();
      this._qtyWindow.setText("Cantidad: " + this._craftQty + " / " + mx + "   (← → ajustar, OK fabricar)");
    } else if (this._recipeWindow && this._recipeWindow.active) {
      var r = this._filteredRecipes[this._recipeWindow.index()];
      this._selectedRecipe = r;
      var m2 = r ? maxCraftForRecipe(r) : 0;
      this._craftQty = Math.min(Math.max(1, this._craftQty), Math.max(1, m2));
    this._qtyWindow.setText(r ? "Max: " + m2 : "");
    } else {
      this._qtyWindow.setText("");
    }
  };

  Scene_SkillHerreria.prototype.startCraft = function(recipe, qty) {
    if (!canApplyCraft(recipe, qty)) {
      SoundManager.playBuzzer();
      this.rebuildRecipeList();
      return;
    }
    var per = secondsPerUnitForRecipe(recipe);
    this._craftPendingRecipe = recipe;
    this._craftPendingQty = qty;
    this._craftTotalSec = per * qty;
    this._craftElapsedSec = 0;
  // RPG Maker MV no tiene SoundManager.playUse()
  SoundManager.playOk();
    if (this._recipeWindow) this._recipeWindow.deactivate();
    if (this._stationWindow) this._stationWindow.refresh();
  };

  Scene_SkillHerreria.prototype.finishCraft = function() {
    var rec = this._craftPendingRecipe;
    var qty = this._craftPendingQty;
    this._craftTotalSec = 0;
    this._craftElapsedSec = 0;
    this._craftPendingRecipe = null;
    this._craftPendingQty = 0;
    if (rec && qty > 0) {
      if (!applyCraft(rec, qty)) {
        SoundManager.playBuzzer();
      } else {
        SoundManager.playShop();
      }
    }
    this.rebuildRecipeList();
    this.activateRecipeFocus();
  };

  Scene_SkillHerreria.prototype.popScene = function() {
    if (this._craftTotalSec > 0) return;
    Scene_MenuBase.prototype.popScene.call(this);
  };

  Window_HerreriaRecipes.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    if (this.active && this._hScene) {
      var r = this._list[this.index()];
      if (r !== this._hScene._lastRecipeHover) {
        this._hScene._lastRecipeHover = r;
        this._hScene._selectedRecipe = r;
        this._hScene._craftQty = 1;
        this._hScene.refreshQtyHelp();
        if (this._hScene._stationWindow) this._hScene._stationWindow.refresh();
      }
    }
  };

  window.Scene_SkillHerreria = Scene_SkillHerreria;

  function openHerreriaScene(craftTypeRaw) {
    if (!window.OnyxInv || !OnyxInv.slots) {
      console.warn("[SkillHerreria] Requiere Onyx_InventorySlots.");
      return;
    }
    if (!window.$dataCustomLoaded || !$dataCustomLoaded.Recipes) {
      console.warn("[SkillHerreria] Recipes.json no cargado (Onyx_CustomDataManual).");
    }
    _pendingHerreriaCraftSessionType = normalizeCraftSessionType(craftTypeRaw);
    SceneManager.push(Scene_SkillHerreria);
  }

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === "SkillHerreria" && args && args[0] === "Open") {
      var mode = args.length > 1 ? args.slice(1).join(" ") : "";
      openHerreriaScene(mode);
    }
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
    Onyx.Skill.Herreria.refreshBonusFromUnlocks();
    syncVariablesToGame();
  };

  var _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    if ($gameVariables && Number($gameVariables.value(33)) === C.ID) {
      syncVariablesToGame();
    }
  };

  console.log("[SkillHerreria] v" + SKILL_HERRERIA_VERSION + " listo.");
})();

/*:
 * @plugindesc (Onyx) v1.0.0.0 - Skill: Pesca - minijuego de banco de peces con barra de tension
 * @name SkillPesca
 * @author Onyx
 * @version 1.0.0.0
 *
 * @param varSkillLevel
 * @text Variable: Nivel de Skill
 * @type variable
 * @default 24
 *
 * @param varExpActual
 * @text Variable: EXP actual
 * @type variable
 * @default 28
 *
 * @param varExpSiguiente
 * @text Variable: EXP siguiente
 * @type variable
 * @default 46
 *
 * @param varMaxSkillLevel
 * @text Variable: Nivel maximo
 * @type variable
 * @default 32
 *
 * @param barWidth
 * @text Ancho barra pesca
 * @type number
 * @default 520
 *
 * @param barHeight
 * @text Alto barra pesca
 * @type number
 * @default 36
 *
 * @param hookWidth
 * @text Ancho barra anzuelo
 * @type number
 * @default 22
 *
 * @param overlapSeconds
 * @text Segundos para capturar
 * @type number
 * @decimals 1
 * @default 3.0
 *
 * @param hookRightSpeed
 * @text Velocidad derecha
 * @type number
 * @default 150
 *
 * @param hookLeftSpeed
 * @text Velocidad izquierda
 * @type number
 * @default 240
 *
 * @param debugLog
 * @text Log depuracion (consola F8)
 * @type boolean
 * @default true
 *
 * @param hudFontSize
 * @text Tamano letra HUD pesca
 * @type number
 * @min 12
 * @max 28
 * @default 18
 *
 * @help
 * Requiere:
 *  - $dataCustom.FishingFish
 *  - $dataCustom.FishingBanks
 *  - $dataCustom.ToolLevelList
 *  - $dataCustom.SkillNodeLevelNeed
 *
 * Herramientas (Armaduras / ToolLevelList skill_id 3):
 *  - Redes 140-143: peces pequenos (fish_id 1-2, items crudos 121-126).
 *  - Canias 144-154: peces medianos y grandes (fish_id 3-14, items 127-162).
 *  - Cajas trampa 155-157: crustaceos (fish_id 15-20, items 163-180).
 *  - Harpones 158-159: presas muy grandes (fish_id 21-23, items 181-189).
 *  Cada pez en FishingBanks define required_tool_ids y tool_lvl.
 *
 * Controles:
 *  - La barra de anzuelo avanza sola hacia la derecha.
 *  - Mantener Z / OK mueve el anzuelo hacia la izquierda.
 *  - Si el anzuelo solapa la tension durante overlapSeconds, S captura el pez.
 *  - Al agotar peces del nodo/banco la escena se cierra sola (~1,5 s).
 *  - ESC / menu: salir antes.
 *
 * Nodos (variable de juego 1003, como Tala 1000 / Recoleccion 1001 / Mineria 1002), ids 1-10:
 *   type/types: red (1-2), caña (2-10), trampa (5-8), arpón (9-10)
 *   max_fish / fish_left: 1-12 al crear o resetear nodo
 *   node_lvl: 1-10 (igual que id de nodo)
 *   Dificultad tension (px): 1=55, 2=50, 3=40, 4=30, 5=15
 *
 * Plugin command:
 *   SkillPesca Open 3
 *   SkillPesca ResetNode 3
 *   SkillPesca ResetBank 3
 *   SkillPesca InitNodes
 *   SkillPesca Debug 1   (solo diagnostico en consola F8 + mensaje en pantalla)
 *
 * Script:
 *   Onyx.Skill.Pesca.openFishingScene(3)
 *   Onyx.Skill.Pesca.resetNode(3)
 */

(function() {
  "use strict";

  var PARAMS = PluginManager.parameters("SkillPesca");
  var ONYX_GLOBAL_MAX_TOTAL_EXP_STR = "2289796205681772328910848";
  var ONYX_GLOBAL_MAX_TOTAL_EXP = Number(ONYX_GLOBAL_MAX_TOTAL_EXP_STR);

  var VAR_SKILL_LEVEL = Number(PARAMS.varSkillLevel || 24);
  var VAR_EXP_ACTUAL = Number(PARAMS.varExpActual || 28);
  var VAR_EXP_SIGUIENTE = Number(PARAMS.varExpSiguiente || 46);
  var VAR_MAX_SKILL_LEVEL = Number(PARAMS.varMaxSkillLevel || 32);
  var BAR_W = Math.max(180, Number(PARAMS.barWidth || 520));
  var BAR_H = Math.max(18, Number(PARAMS.barHeight || 36));
  var HOOK_W = Math.max(8, Number(PARAMS.hookWidth || 22));
  var OVERLAP_SECONDS = Math.max(0.5, Number(PARAMS.overlapSeconds || 3));
  var HOOK_RIGHT_SPEED = Math.max(20, Number(PARAMS.hookRightSpeed || 150));
  var HOOK_LEFT_SPEED = Math.max(20, Number(PARAMS.hookLeftSpeed || 240));
  var DEBUG_LOG = String(PARAMS.debugLog || "true") !== "false";
  var HUD_FONT_SIZE = Math.max(12, Math.min(28, Number(PARAMS.hudFontSize || 18)));
  var FISHING_CATCH_KEY = "onyxFishingCatch";

  Input.keyMapper[83] = FISHING_CATCH_KEY; // S

  window.Onyx = window.Onyx || {};
  Onyx.Skill = Onyx.Skill || {};
  Onyx.Skill.Pesca = Onyx.Skill.Pesca || {};

  var C = {
    ID: 3,
    NAME: "Pesca"
  };

  var FISHING_TABLE_VAR_ID = 1003;
  var FISHING_TABLE_VAR_ID_LEGACY = 100;
  var FISHING_NODE_COUNT = 10;

  /** Ancho fijo (px) de la barra verde de tension por dificultad 1-5. */
  var TENSION_WIDTH_BY_DIFFICULTY = {
    1: 55,
    2: 50,
    3: 40,
    4: 30,
    5: 15
  };

  function clampTotalExp(n) {
    var x = Number(n) || 0;
    if (x < 0) x = 0;
    if (isFinite(ONYX_GLOBAL_MAX_TOTAL_EXP) && x > ONYX_GLOBAL_MAX_TOTAL_EXP) x = ONYX_GLOBAL_MAX_TOTAL_EXP;
    return x;
  }

  function getExpTable() {
    return window.$dataCustom && window.$dataCustom.ExpTable;
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
      if (row && Number(row.skill_id) === Number(skillId)) return Number(row.skill_max_level) || null;
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
      bonus: {},
      stats: {
        fish_caught: 0,
        fishing_sessions: 0
      }
    };
    if (!$gameSystem._onyxSkills[C.ID].stats) $gameSystem._onyxSkills[C.ID].stats = {};
    if ($gameSystem._onyxSkills[C.ID].stats.fish_caught == null) $gameSystem._onyxSkills[C.ID].stats.fish_caught = 0;
    if ($gameSystem._onyxSkills[C.ID].stats.fishing_sessions == null) $gameSystem._onyxSkills[C.ID].stats.fishing_sessions = 0;
    $gameSystem._onyxSkills[C.ID].skill_total_exp = clampTotalExp($gameSystem._onyxSkills[C.ID].skill_total_exp);
    $gameSystem._onyxFishingBanks = $gameSystem._onyxFishingBanks || {};
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
    var st = Onyx.Skill.Pesca.state();
    if (VAR_SKILL_LEVEL > 0) $gameVariables.setValue(VAR_SKILL_LEVEL, st.lvl > 0 ? st.lvl : 1);
    if (VAR_EXP_ACTUAL > 0) $gameVariables.setValue(VAR_EXP_ACTUAL, st.expIntoLevel != null ? st.expIntoLevel : 0);
    if (VAR_EXP_SIGUIENTE > 0) $gameVariables.setValue(VAR_EXP_SIGUIENTE, st.nextLevelTotalExp != null ? st.nextLevelTotalExp : 0);
    if (VAR_MAX_SKILL_LEVEL > 0) $gameVariables.setValue(VAR_MAX_SKILL_LEVEL, st.cap || getCap());
  }

  Onyx.Skill.Pesca.syncVariablesToGame = syncVariablesToGame;

  Onyx.Skill.Pesca.state = function() {
    var st = ensureStore();
    var cap = getCap();
    if (!st) return { id: C.ID, name: C.NAME, lvl: 1, totalExp: 0, cap: cap };
    var lvl = Math.max(1, Number(st.skill_lvl) || 1);
    var total = clampTotalExp(st.skill_total_exp);
    st.skill_total_exp = total;
    lvl = recalcLevelFromTotalExp(total, lvl);
    st.skill_lvl = lvl;
    var curLvlTotal = expTotalForLevel(lvl) || 0;
    var nextLvlTotal = lvl < cap ? expTotalForLevel(lvl + 1) : null;
    return {
      id: C.ID,
      name: C.NAME,
      lvl: lvl,
      cap: cap,
      totalExp: total,
      curLvlTotal: curLvlTotal,
      expIntoLevel: Math.max(0, total - curLvlTotal),
      nextLevelTotalExp: nextLvlTotal,
      remaining: nextLvlTotal != null ? Math.max(0, nextLvlTotal - total) : 0
    };
  };

  Onyx.Skill.Pesca.addExp = function(amount) {
    var st = ensureStore();
    if (!st) return { ok: false, leveledUp: false };
    var add = Number(amount) || 0;
    if (add <= 0) return { ok: true, added: 0, leveledUp: false, state: Onyx.Skill.Pesca.state() };
    var beforeLvl = Math.max(1, Number(st.skill_lvl) || 1);
    var beforeTotal = clampTotalExp(st.skill_total_exp);
    var afterTotal = clampTotalExp(beforeTotal + add);
    st.skill_total_exp = afterTotal;
    st.skill_lvl = recalcLevelFromTotalExp(afterTotal, beforeLvl);
    syncVariablesToGame();
    return {
      ok: true,
      added: afterTotal - beforeTotal,
      leveledUp: st.skill_lvl > beforeLvl,
      levelUps: Math.max(0, st.skill_lvl - beforeLvl),
      state: Onyx.Skill.Pesca.state()
    };
  };

  Onyx.Skill.Pesca.init = function() {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.activate) Onyx.SkillsActive.activate(C.ID);
    var st = ensureStore();
    if (!st) return false;
    st.skill_lvl = 1;
    st.skill_total_exp = 0;
    syncVariablesToGame();
    return true;
  };

  Onyx.Skill.Pesca.isActive = function() {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.isActive) return Onyx.SkillsActive.isActive(C.ID);
    return true;
  };

  function fishingFishList() {
    return window.$dataCustom && $dataCustom.FishingFish;
  }

  function fishingBankList() {
    return window.$dataCustom && $dataCustom.FishingBanks;
  }

  function rowById(list, key, id) {
    if (!list || !Array.isArray(list)) return null;
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      if (row && Number(row[key]) === Number(id)) return row;
    }
    return null;
  }

  function fishById(fishId) {
    return rowById(fishingFishList(), "fish_id", fishId);
  }

  function bankTemplateById(bankId) {
    return rowById(fishingBankList(), "bank_id", bankId);
  }

  function fishingNodeTable() {
    if (!$gameVariables) return null;
    return $gameVariables.value(FISHING_TABLE_VAR_ID);
  }

  function getFishingNode(nodeId) {
    var table = fishingNodeTable();
    if (!table) return null;
    return table[Number(nodeId) || 0] || null;
  }

  function randomMaxFishForNode() {
    return 1 + Math.floor(Math.random() * 12);
  }

  function typesForNodeFromBank(n) {
    var bank = bankTemplateById(n);
    if (bank && Array.isArray(bank.types) && bank.types.length) return bank.types.slice();
    if (n === 1) return ["red"];
    if (n === 2) return ["red", "caña"];
    if (n >= 3 && n <= 4) return ["caña"];
    if (n >= 5 && n <= 8) return ["caña", "trampa"];
    if (n >= 9) return ["caña", "arpón"];
    return ["caña"];
  }

  function buildFishingNodeTable1003() {
    var table = {};
    var n;
    for (n = 1; n <= FISHING_NODE_COUNT; n++) {
      var maxFish = randomMaxFishForNode();
      var types = typesForNodeFromBank(n);
      table[n] = {
        node_lvl: n,
        no_lvl: n,
        types: types,
        type: types.length === 1 ? types[0] : types[types.length - 1],
        max_fish: maxFish,
        fish_left: maxFish,
        active: 1,
        bank_id: n,
        tool_lvl: n
      };
    }
    return table;
  }

  function needsFishingTableInit() {
    var v = fishingNodeTable();
    if (!v || typeof v !== "object" || Array.isArray(v)) return true;
    var first = v[1];
    if (!first || Number(first.node_lvl) !== 1) return true;
    if (first.max_fish == null || first.fish_left == null) return true;
    var last = v[FISHING_NODE_COUNT];
    if (!last || Number(last.node_lvl) !== FISHING_NODE_COUNT) return true;
    return false;
  }

  function migrateFishingTableFromLegacyVar() {
    if (!$gameVariables || needsFishingTableInit() === false) return;
    var legacy = $gameVariables.value(FISHING_TABLE_VAR_ID_LEGACY);
    if (!legacy || typeof legacy !== "object" || Array.isArray(legacy)) return;
    var first = legacy[1];
    if (!first || Number(first.node_lvl) !== 1) return;
    $gameVariables.setValue(FISHING_TABLE_VAR_ID, legacy);
  }

  Onyx.Skill.Pesca.FISHING_TABLE_VAR_ID = FISHING_TABLE_VAR_ID;
  Onyx.Skill.Pesca.buildFishingNodeTable1003 = buildFishingNodeTable1003;
  Onyx.Skill.Pesca.buildFishingNodeTable100 = buildFishingNodeTable1003;

  Onyx.Skill.Pesca.ensureFishingTableVar1003 = function() {
    if (!$gameVariables) return;
    migrateFishingTableFromLegacyVar();
    if (needsFishingTableInit()) {
      $gameVariables.setValue(FISHING_TABLE_VAR_ID, buildFishingNodeTable1003());
    }
  };
  Onyx.Skill.Pesca.ensureFishingTableVar100 = Onyx.Skill.Pesca.ensureFishingTableVar1003;

  Onyx.Skill.Pesca.resetNode = function(nodeId) {
    var id = Number(nodeId) || 0;
    if (id < 1 || id > FISHING_NODE_COUNT) return false;
    Onyx.Skill.Pesca.ensureFishingTableVar1003();
    var table = fishingNodeTable();
    if (!table) return false;
    var maxFish = randomMaxFishForNode();
    var types = typesForNodeFromBank(id);
    table[id] = {
      node_lvl: id,
      no_lvl: id,
      types: types,
      type: types.length === 1 ? types[0] : types[types.length - 1],
      max_fish: maxFish,
      fish_left: maxFish,
      active: 1,
      bank_id: id,
      tool_lvl: id
    };
    Onyx.Skill.Pesca.resetBank(id);
    return true;
  };

  Onyx.Skill.Pesca.getNode = getFishingNode;

  function requiredSkillForNodeLvl(nodeLvl) {
    var list = window.$dataCustom && $dataCustom.SkillNodeLevelNeed;
    var n = Number(nodeLvl) || 1;
    if (!list || !Array.isArray(list)) return 1;
    for (var i = 0; i < list.length; i++) {
      var row = list[i];
      if (row && Number(row.skill_id) === C.ID && Number(row.node_lvl) === n) {
        return Math.max(1, Number(row.skill_lvl) || 1);
      }
    }
    return 1;
  }

  function ensureBankState(bankId) {
    ensureStore();
    var id = Number(bankId) || 0;
    var bank = bankTemplateById(id);
    if (!$gameSystem || !bank) return null;
    $gameSystem._onyxFishingBanks = $gameSystem._onyxFishingBanks || {};
    var state = $gameSystem._onyxFishingBanks[id];
    if (!state) {
      state = {
        bank_id: id,
        remaining: {},
        catches: 0
      };
      $gameSystem._onyxFishingBanks[id] = state;
    }
    if (!state.remaining) state.remaining = {};
    var fish = Array.isArray(bank.fish) ? bank.fish : [];
    for (var i = 0; i < fish.length; i++) {
      var entry = fish[i];
      if (!entry) continue;
      var fid = Number(entry.fish_id) || 0;
      if (!fid) continue;
      if (state.remaining[fid] == null) state.remaining[fid] = Math.max(0, Math.floor(Number(entry.count) || 0));
    }
    return state;
  }

  Onyx.Skill.Pesca.resetBank = function(bankId) {
    var id = Number(bankId) || 0;
    var bank = bankTemplateById(id);
    if (!$gameSystem || !bank) return false;
    $gameSystem._onyxFishingBanks = $gameSystem._onyxFishingBanks || {};
    var state = {
      bank_id: id,
      remaining: {},
      catches: 0
    };
    var fish = Array.isArray(bank.fish) ? bank.fish : [];
    for (var i = 0; i < fish.length; i++) {
      var entry = fish[i];
      if (!entry) continue;
      var fid = Number(entry.fish_id) || 0;
      if (fid) state.remaining[fid] = Math.max(0, Math.floor(Number(entry.count) || 0));
    }
    $gameSystem._onyxFishingBanks[id] = state;
    return true;
  };

  function remainingForEntry(bankId, entry) {
    var state = ensureBankState(bankId);
    if (!state || !entry) return 0;
    return Math.max(0, Math.floor(Number(state.remaining[Number(entry.fish_id) || 0]) || 0));
  }

  function requiredToolIds(entry) {
    if (!entry || !Array.isArray(entry.required_tool_ids)) return null;
    var out = [];
    for (var i = 0; i < entry.required_tool_ids.length; i++) {
      var n = Number(entry.required_tool_ids[i]) || 0;
      if (n > 0) out.push(n);
    }
    return out.length ? out : null;
  }

  function containsNumber(list, value) {
    if (!list) return true;
    var n = Number(value) || 0;
    for (var i = 0; i < list.length; i++) {
      if (Number(list[i]) === n) return true;
    }
    return false;
  }

  function bestToolForFish(entry) {
    var toolList = window.$dataCustom && $dataCustom.ToolLevelList;
    if (!toolList || !Array.isArray(toolList) || !$gameParty) return null;
    var allowedIds = requiredToolIds(entry);
    var needLvl = Math.max(1, Number(entry && entry.tool_lvl) || 1);
    var members = $gameParty.members();
    var best = null;
    for (var m = 0; m < members.length; m++) {
      var actor = members[m];
      if (!actor || !actor.equips) continue;
      var equips = actor.equips();
      if (!equips || equips.length <= 9) continue;
      var equip = equips[9];
      if (!equip) continue;
      var toolId = Number(equip.id) || 0;
      if (!toolId || !containsNumber(allowedIds, toolId)) continue;
      for (var i = 0; i < toolList.length; i++) {
        var row = toolList[i];
        if (!row) continue;
        if (Number(row.skill_id) !== C.ID || Number(row.tool_id) !== toolId) continue;
        var lvl = Number(row.tool_lvl) || 0;
        if (lvl < needLvl) continue;
        if (!best || lvl > best.tool_lvl) {
          best = {
            tool_id: toolId,
            tool_lvl: lvl,
            name: row.name || (equip.name || ""),
            actorIndex: m
          };
        }
        break;
      }
    }
    return best;
  }

  function canCatchFishEntry(entry) {
    return !!bestToolForFish(entry);
  }

  function bankHasStock(bankId) {
    var bank = bankTemplateById(bankId);
    if (!bank || !Array.isArray(bank.fish)) return false;
    for (var i = 0; i < bank.fish.length; i++) {
      if (remainingForEntry(bankId, bank.fish[i]) > 0) return true;
    }
    return false;
  }

  /** Sesion terminada: sin peces en el nodo o sin stock en el banco. */
  function isFishingSessionFinished(bankId) {
    if (nodeFishLeft(bankId) <= 0) return true;
    if (!bankHasStock(bankId)) return true;
    return false;
  }

  function availableEntries(bankId) {
    if (nodeFishLeft(bankId) <= 0) return [];
    if (!bankHasStock(bankId)) return [];
    var bank = bankTemplateById(bankId);
    if (!bank || !Array.isArray(bank.fish)) return [];
    var out = [];
    for (var i = 0; i < bank.fish.length; i++) {
      var entry = bank.fish[i];
      if (!entry || remainingForEntry(bankId, entry) <= 0) continue;
      if (!fishById(entry.fish_id)) continue;
      if (!canCatchFishEntry(entry)) continue;
      out.push(entry);
    }
    return out;
  }

  function nodeFishLeft(nodeId) {
    var node = getFishingNode(nodeId);
    if (!node) return 0;
    return Math.max(0, Math.floor(Number(node.fish_left) || 0));
  }

  function setNodeFishLeft(nodeId, n) {
    var table = fishingNodeTable();
    if (!table) return;
    var node = table[Number(nodeId) || 0];
    if (!node) return;
    node.fish_left = Math.max(0, Math.floor(Number(n) || 0));
    if (node.fish_left <= 0) node.active = 0;
  }

  function anyRemainingFish(bankId) {
    if (nodeFishLeft(bankId) <= 0) return false;
    var bank = bankTemplateById(bankId);
    if (!bank || !Array.isArray(bank.fish)) return false;
    for (var i = 0; i < bank.fish.length; i++) {
      if (remainingForEntry(bankId, bank.fish[i]) > 0) return true;
    }
    return false;
  }

  function chooseWeightedEntry(entries) {
    if (!entries || !entries.length) return null;
    var total = 0;
    for (var i = 0; i < entries.length; i++) total += Math.max(1, Number(entries[i].weight) || 1);
    var roll = Math.random() * total;
    var acc = 0;
    for (var j = 0; j < entries.length; j++) {
      acc += Math.max(1, Number(entries[j].weight) || 1);
      if (roll < acc) return entries[j];
    }
    return entries[entries.length - 1];
  }

  function dbObjectFromOutput(fish) {
    if (!fish) return null;
    var outType = String(fish.output_type || "item").toLowerCase();
    var id = Number(fish.output_id) || 0;
    if (outType === "weapon") return $dataWeapons && $dataWeapons[id];
    if (outType === "armor") return $dataArmors && $dataArmors[id];
    return $dataItems && $dataItems[id];
  }

  function giveFishReward(fish) {
    var obj = dbObjectFromOutput(fish);
    if (!obj || !$gameParty) return false;
    var qty = Math.max(1, Math.floor(Number(fish.output_count) || 1));
    $gameParty.gainItem(obj, qty);
    return { item: obj, qty: qty };
  }

  function showFishMessage(text) {
    if (window.showFloatingMessage) window.showFloatingMessage(text, 120, 0, "arriba", false);
  }

  function fishingDebugEnabled() {
    return DEBUG_LOG || ($gameTemp && $gameTemp._onyxFishingDebug);
  }

  function fishingLog() {
    if (!fishingDebugEnabled()) return;
    var parts = ["[SkillPesca]"];
    for (var i = 0; i < arguments.length; i++) parts.push(arguments[i]);
    if (typeof console !== "undefined" && console.log) console.log.apply(console, parts);
  }

  function fishingLogObj(label, obj) {
    if (!fishingDebugEnabled()) return;
    if (typeof console !== "undefined" && console.log) {
      console.log("[SkillPesca] " + label, obj);
    } else {
      fishingLog(label, JSON.stringify(obj));
    }
  }

  function partyEquippedToolsDetail() {
    var out = [];
    if (!$gameParty) return out;
    var members = $gameParty.members();
    var m, actor, equips, equip, toolId, i, row;
    var toolList = window.$dataCustom && $dataCustom.ToolLevelList;
    for (m = 0; m < members.length; m++) {
      actor = members[m];
      if (!actor) continue;
      equips = actor.equips();
      equip = equips && equips.length > 9 ? equips[9] : null;
      if (!equip) {
        out.push({ actor: actor.name(), slot9: null });
        continue;
      }
      toolId = Number(equip.id) || 0;
      var info = {
        actor: actor.name(),
        slot9_armor_id: toolId,
        slot9_name: equip.name || "",
        skill_id: null,
        tool_lvl: null,
        in_tool_list: false
      };
      if (toolList) {
        for (i = 0; i < toolList.length; i++) {
          row = toolList[i];
          if (row && Number(row.tool_id) === toolId) {
            info.in_tool_list = true;
            info.skill_id = Number(row.skill_id);
            info.tool_lvl = Number(row.tool_lvl);
            break;
          }
        }
      }
      out.push(info);
    }
    return out;
  }

  function diagnoseToolForEntry(entry) {
    var result = {
      fish_id: entry ? Number(entry.fish_id) : 0,
      need_tool_lvl: Math.max(1, Number(entry && entry.tool_lvl) || 1),
      required_tool_ids: requiredToolIds(entry),
      equipped: partyEquippedToolsDetail(),
      ok: false,
      reason: "unknown"
    };
    if (!entry) {
      result.reason = "no_entry";
      return result;
    }
    var best = bestToolForFish(entry);
    if (best) {
      result.ok = true;
      result.reason = "ok";
      result.matched_tool = best;
      return result;
    }
    var allowedIds = result.required_tool_ids;
    var hasEquip = false;
    var wrongSkill = false;
    var lowLvl = false;
    var wrongType = false;
    var i, eq, toolId, row;
    var toolList = window.$dataCustom && $dataCustom.ToolLevelList;
    for (i = 0; i < result.equipped.length; i++) {
      eq = result.equipped[i];
      toolId = Number(eq.slot9_armor_id) || 0;
      if (!toolId) continue;
      hasEquip = true;
      if (allowedIds && !containsNumber(allowedIds, toolId)) {
        wrongType = true;
        continue;
      }
      if (Number(eq.skill_id) !== C.ID) {
        wrongSkill = true;
        continue;
      }
      if ((Number(eq.tool_lvl) || 0) < result.need_tool_lvl) {
        lowLvl = true;
        continue;
      }
    }
    if (!hasEquip) result.reason = "no_tool_in_slot_9";
    else if (wrongType) result.reason = "wrong_tool_type_for_fish";
    else if (wrongSkill) result.reason = "equipped_not_fishing_tool";
    else if (lowLvl) result.reason = "tool_lvl_too_low";
    else result.reason = "no_matching_tool";
    return result;
  }

  function diagnoseFishEntries(bankId) {
    var bank = bankTemplateById(bankId);
    var rows = [];
    if (!bank || !Array.isArray(bank.fish)) return rows;
    var i, entry, fish, rem, toolDiag;
    for (i = 0; i < bank.fish.length; i++) {
      entry = bank.fish[i];
      if (!entry) continue;
      fish = fishById(entry.fish_id);
      rem = remainingForEntry(bankId, entry);
      toolDiag = diagnoseToolForEntry(entry);
      rows.push({
        fish_id: entry.fish_id,
        fish_name: fish ? fish.name : "(sin datos FishingFish)",
        bank_remaining: rem,
        can_catch: rem > 0 && !!fish && toolDiag.ok,
        skip_reason: rem <= 0 ? "bank_stock_0" : (!fish ? "missing_fish_data" : (!toolDiag.ok ? toolDiag.reason : null)),
        tool: toolDiag
      });
    }
    return rows;
  }

  /**
   * Diagnostico completo antes de abrir pesca. Devuelve { ok, code, message, detail }.
   * Script: Onyx.Skill.Pesca.diagnoseOpen(1)
   */
  Onyx.Skill.Pesca.diagnoseOpen = function(bankId) {
    var id = Number(bankId) || 0;
    var detail = {
      bankId: id,
      var_skill_level_24: $gameVariables ? $gameVariables.value(VAR_SKILL_LEVEL) : null,
      var_skill_id_33: $gameVariables ? $gameVariables.value(33) : null,
      party_tools: partyEquippedToolsDetail()
    };

    fishingLog("========== diagnoseOpen nodo/banco", id, "==========");

    if (!id) {
      detail.code = "NO_BANK_ID";
      detail.message = "Id de banco/nodo invalido (0).";
      fishingLogObj("FAIL", detail);
      return { ok: false, code: detail.code, message: detail.message, detail: detail };
    }

    detail.skill_active = Onyx.Skill.Pesca.isActive();
    if (!detail.skill_active) {
      detail.code = "SKILL_NOT_ACTIVE";
      detail.message = "Pesca no activa. Usa SkillPesca Init o aprende el skill.";
      fishingLogObj("FAIL", detail);
      return { ok: false, code: detail.code, message: detail.message, detail: detail };
    }

    Onyx.Skill.Pesca.ensureFishingTableVar1003();
    syncVariablesToGame();

    var node = getFishingNode(id);
    var bank = bankTemplateById(id);
    detail.node = node ? JSON.parse(JSON.stringify(node)) : null;
    detail.bank_name = bank ? bank.name : null;

    if (!bank) {
      detail.code = "NO_BANK_TEMPLATE";
      detail.message = "No existe FishingBanks para id " + id + ".";
      fishingLogObj("FAIL", detail);
      return { ok: false, code: detail.code, message: detail.message, detail: detail };
    }

    if (!node) {
      detail.code = "NO_NODE_IN_VAR1003";
      detail.message = "Variable 1003 sin nodo " + id + ". Prueba SkillPesca InitNodes.";
      fishingLogObj("FAIL", detail);
      return { ok: false, code: detail.code, message: detail.message, detail: detail };
    }

    detail.node_active_raw = node.active;
    if (!node.active) {
      detail.code = "NODE_INACTIVE";
      detail.message = "Nodo inactivo (fish_left=" + (node.fish_left != null ? node.fish_left : "?") + "). SkillPesca ResetNode " + id;
      fishingLogObj("FAIL", detail);
      return { ok: false, code: detail.code, message: detail.message, detail: detail };
    }

    var st = Onyx.Skill.Pesca.state();
    var nodeLvl = Number(node.node_lvl) || Number(node.no_lvl) || Number(bank.node_lvl) || id;
    var requiredSkill = requiredSkillForNodeLvl(nodeLvl);
    detail.player_skill_lvl = st.lvl;
    detail.node_lvl = nodeLvl;
    detail.required_skill_lvl = requiredSkill;
    detail.var24_after_sync = $gameVariables ? $gameVariables.value(VAR_SKILL_LEVEL) : null;

    if (st.lvl < requiredSkill) {
      detail.code = "SKILL_LEVEL_LOW";
      detail.message = "Pesca nv " + st.lvl + " < requerido " + requiredSkill + " (nodo lvl " + nodeLvl + ").";
      fishingLogObj("FAIL", detail);
      return { ok: false, code: detail.code, message: detail.message, detail: detail };
    }

    detail.node_fish_left = nodeFishLeft(id);
    ensureBankState(id);
    detail.any_remaining_in_bank = anyRemainingFish(id);
    detail.fish_entries = diagnoseFishEntries(id);
    detail.available_count = availableEntries(id).length;

    if (detail.node_fish_left <= 0) {
      detail.code = "NO_FISH_LEFT_NODE";
      detail.message = "fish_left del nodo es 0. ResetNode " + id;
      fishingLogObj("FAIL", detail);
      return { ok: false, code: detail.code, message: detail.message, detail: detail };
    }

    if (!detail.any_remaining_in_bank) {
      detail.code = "NO_BANK_STOCK";
      detail.message = "Sin stock en banco (remaining). ResetBank " + id;
      fishingLogObj("FAIL", detail);
      return { ok: false, code: detail.code, message: detail.message, detail: detail };
    }

    if (detail.available_count <= 0) {
      detail.code = "NO_VALID_TOOL";
      detail.message = "Herramienta invalida. Nodo 1 = red 140-143 en slot 9.";
      fishingLogObj("FAIL", detail);
      return { ok: false, code: detail.code, message: detail.message, detail: detail };
    }

    detail.code = "OK";
    detail.message = "Todo correcto, se puede abrir pesca.";
    fishingLogObj("OK", detail);
    return { ok: true, code: detail.code, message: detail.message, detail: detail };
  };

  function tensionWidthForFish(fish) {
    var difficulty = Math.max(1, Math.min(5, Number(fish && fish.difficulty) || 1));
    var w = TENSION_WIDTH_BY_DIFFICULTY[difficulty];
    if (w == null) w = TENSION_WIDTH_BY_DIFFICULTY[1];
    return Math.min(BAR_W, Math.max(8, w));
  }

  function Window_OnyxFishingHud() {
    this.initialize.apply(this, arguments);
  }

  Window_OnyxFishingHud.prototype = Object.create(Window_Base.prototype);
  Window_OnyxFishingHud.prototype.constructor = Window_OnyxFishingHud;

  Window_OnyxFishingHud.prototype.initialize = function(scene) {
    Window_Base.prototype.initialize.call(this, 0, 0, Graphics.boxWidth, Graphics.boxHeight);
    this.opacity = 0;
    this._scene = scene;
  };

  Window_OnyxFishingHud.prototype.refresh = function() {
    this.contents.clear();
    var scene = this._scene;
    if (!scene) return;

    var barX = Math.floor((Graphics.boxWidth - BAR_W) / 2);
    var barY = Math.floor(Graphics.boxHeight / 2 - BAR_H / 2);
    var fish = scene.currentFish();
    var bank = bankTemplateById(scene.bankId());
    var title = bank ? bank.name : "Banco de pesca";
    var fishName = fish ? fish.name : "Sin pez";
    var remaining = scene.remainingCount();
    var overlap = Math.min(OVERLAP_SECONDS, scene.overlapSeconds());
    var overlapText = overlap.toFixed(1) + " / " + OVERLAP_SECONDS.toFixed(1) + "s";
    var hudFs = HUD_FONT_SIZE;
    var lh = hudFs + 6;
    var prevFs = this.contents.fontSize;
    this.contents.fontSize = hudFs;

    var yTop = barY - lh * 3 - 8;
    this.changeTextColor(this.systemColor());
    this.drawText("Pesca", 0, yTop, Graphics.boxWidth, "center");
    this.resetTextColor();
    this.drawText(title + "  |  " + fishName + "  |  Restan: " + remaining, 0, yTop + lh, Graphics.boxWidth, "center");
    this.drawText("Z: tirar hacia atras     S: capturar cuando la tension este lista", 0, barY + BAR_H + 14, Graphics.boxWidth, "center");
    this.drawText("Tension: " + overlapText, 0, barY + BAR_H + 14 + lh, Graphics.boxWidth, "center");

    this.contents.fontSize = prevFs;

    this.contents.fillRect(barX - 2, barY - 2, BAR_W + 4, BAR_H + 4, "#000000");
    this.contents.fillRect(barX, barY, BAR_W, BAR_H, "rgba(255,255,255,0.16)");

    var tensionX = barX + scene.tensionX();
    var tensionW = scene.tensionWidth();
    this.contents.fillRect(tensionX, barY, tensionW, BAR_H, "#38b764");

    var hookX = barX + scene.hookX();
    this.contents.fillRect(hookX - 1, barY - 4, HOOK_W + 2, BAR_H + 8, "#000000");
    this.contents.fillRect(hookX, barY - 2, HOOK_W, BAR_H + 4, "#f4d35e");

    if (scene.message()) {
      this.contents.fontSize = hudFs;
      this.changeTextColor(this.textColor(17));
      this.drawText(scene.message(), 0, barY + BAR_H + 14 + lh * 2, Graphics.boxWidth, "center");
      this.resetTextColor();
      this.contents.fontSize = prevFs;
    }
  };

  function Scene_OnyxFishing() {
    this.initialize.apply(this, arguments);
  }

  Scene_OnyxFishing.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_OnyxFishing.prototype.constructor = Scene_OnyxFishing;

  Scene_OnyxFishing._pendingBankId = 0;

  Scene_OnyxFishing.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
    this._bankId = Number(Scene_OnyxFishing._pendingBankId) || 0;
    this._currentEntry = null;
    this._currentFish = null;
    this._hookX = 0;
    this._tensionX = 0;
    this._tensionW = 80;
    this._overlapSeconds = 0;
    this._message = "";
    this._messageFrames = 0;
    this._finishFrames = -1;
    this._finishing = false;
    this._popped = false;
  };

  Scene_OnyxFishing.prototype.beginFinishSession = function(message, holdFrames) {
    if (this._finishing) {
      if (message) this.setMessage(message, Math.max(this._finishFrames, holdFrames || 90));
      return;
    }
    this._finishing = true;
    this._currentEntry = null;
    this._currentFish = null;
    var frames = Math.max(45, Number(holdFrames) || 90);
    this._finishFrames = frames;
    if (message) this.setMessage(message, frames);
  };

  Scene_OnyxFishing.prototype.finishMessageForBank = function() {
    if (nodeFishLeft(this._bankId) <= 0) return "No quedan mas peces en este punto.";
    if (!bankHasStock(this._bankId)) return "El banco de peces se ha agotado.";
    return "No puedes pescar mas aqui.";
  };

  Scene_OnyxFishing.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    ensureBankState(this._bankId);
    var st = ensureStore();
    if (st && st.stats) st.stats.fishing_sessions = (Number(st.stats.fishing_sessions) || 0) + 1;
    this._hudWindow = new Window_OnyxFishingHud(this);
    this.addWindow(this._hudWindow);
    this.selectNextFish();
  };

  Scene_OnyxFishing.prototype.bankId = function() {
    return this._bankId;
  };

  Scene_OnyxFishing.prototype.currentFish = function() {
    return this._currentFish;
  };

  Scene_OnyxFishing.prototype.hookX = function() {
    return Math.floor(this._hookX);
  };

  Scene_OnyxFishing.prototype.tensionX = function() {
    return Math.floor(this._tensionX);
  };

  Scene_OnyxFishing.prototype.tensionWidth = function() {
    return Math.floor(this._tensionW);
  };

  Scene_OnyxFishing.prototype.overlapSeconds = function() {
    return this._overlapSeconds;
  };

  Scene_OnyxFishing.prototype.message = function() {
    return this._message;
  };

  Scene_OnyxFishing.prototype.remainingCount = function() {
    return nodeFishLeft(this._bankId);
  };

  Scene_OnyxFishing.prototype.setMessage = function(text, frames) {
    this._message = text || "";
    this._messageFrames = Math.max(1, Number(frames) || 90);
  };

  Scene_OnyxFishing.prototype.selectNextFish = function() {
    if (isFishingSessionFinished(this._bankId)) {
      this.beginFinishSession(this.finishMessageForBank(), 90);
      return false;
    }
    var entries = availableEntries(this._bankId);
    if (!entries.length) {
      var msg = isFishingSessionFinished(this._bankId)
        ? this.finishMessageForBank()
        : "No tienes una herramienta valida para los peces restantes.";
      this.beginFinishSession(msg, 120);
      return false;
    }
    this._currentEntry = chooseWeightedEntry(entries);
    this._currentFish = fishById(this._currentEntry.fish_id);
    this._tensionW = tensionWidthForFish(this._currentFish);
    this._tensionX = Math.floor(Math.random() * Math.max(1, BAR_W - this._tensionW));
    this._hookX = 0;
    this._overlapSeconds = 0;
    this.setMessage("", 1);
    return true;
  };

  Scene_OnyxFishing.prototype.isOverlapping = function() {
    var hookA = this._hookX;
    var hookB = this._hookX + HOOK_W;
    var tenA = this._tensionX;
    var tenB = this._tensionX + this._tensionW;
    return hookB >= tenA && hookA <= tenB;
  };

  Scene_OnyxFishing.prototype.catchCurrentFish = function() {
    if (!this._currentEntry || !this._currentFish) return;
    var state = ensureBankState(this._bankId);
    if (!state) return;
    var fid = Number(this._currentEntry.fish_id) || 0;
    state.remaining[fid] = Math.max(0, remainingForEntry(this._bankId, this._currentEntry) - 1);
    state.catches = (Number(state.catches) || 0) + 1;
    setNodeFishLeft(this._bankId, nodeFishLeft(this._bankId) - 1);

    var reward = giveFishReward(this._currentFish);
    var exp = Math.max(0, Number(this._currentFish.exp) || 0);
    if (exp > 0) Onyx.Skill.Pesca.addExp(exp);

    var st = ensureStore();
    if (st && st.stats) st.stats.fish_caught = (Number(st.stats.fish_caught) || 0) + 1;

    var msg = reward ? "Capturaste " + reward.qty + "x " + reward.item.name + "." : "Captura realizada, pero la recompensa no existe.";
    var hasNext = this.selectNextFish();
    if (hasNext) {
      this.setMessage(msg, 90);
    } else {
      this.beginFinishSession(msg + " " + this.finishMessageForBank(), 120);
    }
  };

  Scene_OnyxFishing.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    if (this._finishFrames >= 0) {
      this._finishFrames--;
      if (this._messageFrames > 0) {
        this._messageFrames--;
        if (this._messageFrames <= 0) this._message = "";
      }
      if (this._finishFrames <= 0 && !this._popped) {
        this._popped = true;
        this.popScene();
      }
      if (this._hudWindow) this._hudWindow.refresh();
      return;
    }

    if (!this._finishing && isFishingSessionFinished(this._bankId)) {
      this.beginFinishSession(this.finishMessageForBank(), 90);
      if (this._hudWindow) this._hudWindow.refresh();
      return;
    }

    if (Input.isTriggered("cancel") || Input.isTriggered("menu")) {
      this.beginFinishSession("Has dejado de pescar.", 60);
      if (this._hudWindow) this._hudWindow.refresh();
      return;
    }

    if (this._messageFrames > 0) {
      this._messageFrames--;
      if (this._messageFrames <= 0) this._message = "";
    }

    var dt = 1 / 60;
    var maxHookX = Math.max(0, BAR_W - HOOK_W);
    if (Input.isPressed("ok")) this._hookX -= HOOK_LEFT_SPEED * dt;
    else this._hookX += HOOK_RIGHT_SPEED * dt;
    if (this._hookX < 0) this._hookX = 0;
    if (this._hookX > maxHookX) this._hookX = maxHookX;

    if (this.isOverlapping()) this._overlapSeconds += dt;
    else this._overlapSeconds = 0;

    if (Input.isTriggered(FISHING_CATCH_KEY)) {
      if (this._overlapSeconds >= OVERLAP_SECONDS) {
        this.catchCurrentFish();
      } else {
        this.setMessage("Aun falta mantener la tension.", 60);
      }
    }

    if (this._hudWindow) this._hudWindow.refresh();
  };

  window.Scene_OnyxFishing = Scene_OnyxFishing;

  Onyx.Skill.Pesca.openFishingScene = function(bankId) {
    var id = Number(bankId) || 0;
    var diag = Onyx.Skill.Pesca.diagnoseOpen(id);
    if (!diag.ok) {
      var screenMsg = diag.message;
      if (fishingDebugEnabled()) {
        screenMsg = "[Pesca " + diag.code + "] " + screenMsg + " (F8 consola)";
        fishingLog("openFishingScene BLOQUEADO:", diag.code, "—", diag.message);
      }
      showFishMessage(screenMsg);
      return false;
    }
    Scene_OnyxFishing._pendingBankId = id;
    SceneManager.push(Scene_OnyxFishing);
    if (fishingDebugEnabled()) fishingLog("openFishingScene OK, abriendo banco", id);
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
    syncVariablesToGame();
    if (Onyx.Skill.Pesca.ensureFishingTableVar1003) Onyx.Skill.Pesca.ensureFishingTableVar1003();
  };

  var _Scene_Map_start = Scene_Map.prototype.start;
  Scene_Map.prototype.start = function() {
    _Scene_Map_start.call(this);
    if (Onyx.Skill.Pesca.ensureFishingTableVar1003) Onyx.Skill.Pesca.ensureFishingTableVar1003();
  };

  var _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    if ($gameVariables && Number($gameVariables.value(33)) === C.ID) syncVariablesToGame();
  };

  var _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
  Game_Interpreter.prototype.updateWaitMode = function() {
    if (this._waitMode === "onyxFishing") {
      var waiting = SceneManager._scene && SceneManager._scene.constructor === Scene_OnyxFishing;
      if (!waiting) this._waitMode = "";
      return waiting;
    }
    return _Game_Interpreter_updateWaitMode.call(this);
  };

  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command !== "SkillPesca") return;
    var action = args && args[0] ? String(args[0]) : "Open";
    var bankId = args && args[1] != null && args[1] !== "" ? Number(args[1]) : 1;
    if (action === "Open" || action === "StartFishing" || action === "StartBank") {
      if (Onyx.Skill.Pesca.openFishingScene(bankId)) this.setWaitMode("onyxFishing");
    } else if (action === "Debug" || action === "Diagnose") {
      var rep = Onyx.Skill.Pesca.diagnoseOpen(bankId);
      showFishMessage("[" + rep.code + "] " + rep.message + (fishingDebugEnabled() ? " — F8" : ""));
    } else if (action === "ResetBank") {
      Onyx.Skill.Pesca.resetBank(bankId);
    } else if (action === "ResetNode") {
      Onyx.Skill.Pesca.resetNode(bankId);
    } else if (action === "InitNodes" || action === "InitTable") {
      if ($gameVariables) $gameVariables.setValue(FISHING_TABLE_VAR_ID, buildFishingNodeTable1003());
    } else if (action === "Init") {
      Onyx.Skill.Pesca.init();
    }
  };

})();

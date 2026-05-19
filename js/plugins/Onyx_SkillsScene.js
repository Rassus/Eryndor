/*:

 * @plugindesc (Onyx) Habilidades: lista completa, detalle con SkillUnlocks, tecla H en mapa.

 * @author Onyx

 * @version 1.1.0

 *

 * @param menuCommandName

 * @text Comando en menú

 * @default Habilidades

 *

 * @param addToMenu

 * @text Añadir al menú

 * @type boolean

 * @default true

 *

 * @param menuSwitchId

 * @text Switch menú (0 = siempre)

 * @type switch

 * @default 0

 *

 * @param openWithH

 * @text Abrir con tecla H en mapa

 * @type boolean

 * @default true

 *

 * @param blockHDuringEvent

 * @text No abrir H si hay evento en marcha

 * @type boolean

 * @default true

 *

 * @help

 * Menú / H: lista de skills (SkillList.json). OK: detalle (resumen + SkillUnlocks).

 * SkillUnlocks: display_name (español) para el listado; value se añade como (+X%) si aplica.

 * Skill 1 = Tala (SkillTala). OnyxSkillViewRegistry[id] para otras skills.

 */



(function() {

  "use strict";



  var params = PluginManager.parameters("Onyx_SkillsScene");

  var MENU_NAME = String(params["menuCommandName"] || "Habilidades");

  var ADD_TO_MENU = params["addToMenu"] !== "false";

  var MENU_SWITCH = Number(params["menuSwitchId"] || 0);

  var OPEN_WITH_H = params["openWithH"] !== "false";

  var BLOCK_H_EVENT = params["blockHDuringEvent"] !== "false";



  var HOTKEY = "onyxSkillsKeyH";

  Input.keyMapper[72] = HOTKEY;



  window.OnyxSkillViewRegistry = window.OnyxSkillViewRegistry || {};

  // Tope GLOBAL de EXP total (mismo valor que SkillTala.js). Se usa para decidir icon_max_exp.
  var ONYX_GLOBAL_MAX_TOTAL_EXP_STR = "2289796205681772328910848";
  var ONYX_GLOBAL_MAX_TOTAL_EXP = Number(ONYX_GLOBAL_MAX_TOTAL_EXP_STR);



  function isSkillActive(skillId) {
    if (window.Onyx && Onyx.SkillsActive && Onyx.SkillsActive.isActive) {
      return Onyx.SkillsActive.isActive(Number(skillId));
    }
    return false;
  }

  function skillListRows() {

    var list = window.$dataCustom && window.$dataCustom.SkillList;

    if (!list || !list.length) return [];

    var out = [];

    for (var i = 0; i < list.length; i++) {

      var row = list[i];

      if (row && row.skill_id != null && isSkillActive(row.skill_id)) out.push(row);

    }

    return out;

  }

  /** EXP total acumulada necesaria para estar en ese nivel (ExpTable). */

  function expTotalForLevelFromTable(level) {

    var n = Math.floor(Number(level)) || 1;

    var t = window.$dataCustom && window.$dataCustom.ExpTable;

    if (!t) return null;

    var row = t[n];

    if (row && typeof row === "object" && !Array.isArray(row)) {

      var v = row[n];

      if (v == null) v = row[String(n)];

      if (v != null) return Number(v) || 0;

      var keys = Object.keys(row);

      if (keys.length) return Number(row[keys[0]]) || 0;

    }

    return null;

  }



  function unlockRowsForSkill(skillId) {

    var list = window.$dataCustom && window.$dataCustom.SkillUnlocks;

    if (!list || !list.length) return [];

    var sid = Number(skillId);

    var out = [];

    for (var i = 0; i < list.length; i++) {

      var r = list[i];

      if (r && Number(r.skill_id) === sid) out.push(r);

    }

    out.sort(function(a, b) {

      var la = Number(a.lvl) || 0;

      var lb = Number(b.lvl) || 0;

      if (la !== lb) return la - lb;

      var ia = a.item_id != null ? 0 : 1;

      var ib = b.item_id != null ? 0 : 1;

      if (ia !== ib) return ia - ib;

      return String(a.update || "").localeCompare(String(b.update || ""));

    });

    return out;

  }



  function itemNameForUnlock(row) {

    if (!row || row.item_id == null) return "";

    var id = Number(row.item_id);

    var a = $dataArmors && $dataArmors[id];

    if (a && a.name) return a.name;

    var w = $dataWeapons && $dataWeapons[id];

    if (w && w.name) return w.name;

    var it = $dataItems && $dataItems[id];

    if (it && it.name) return it.name;

    return "Ítem #" + id;

  }

  function stripParens(s) {
    return String(s || "").replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  function formatPercent(value) {
    if (value == null || value === "") return "";
    var n = Number(value);
    if (isNaN(n)) return "";
    if (n === 0) return "+0%";
    return (n > 0 ? "+" : "") + n + "%";
  }



  function formatUnlockRow(row, playerLvl) {

    var lv = Number(row.lvl) || 0;

    var ok = playerLvl >= lv;

    var disp = row.display_name != null && String(row.display_name).trim() !== "";

    if (row.item_id != null) {

      var itemLine = disp ? stripParens(String(row.display_name).trim()) : itemNameForUnlock(row);

      return {

        text: "Nv." + lv + " — " + itemLine,

        sub: "Desbloqueo de equipo",

        unlocked: ok

      };

    }

    if (row.update) {

      var v = row.value;

      if (disp) {

        var main = "Nv." + lv + " — " + stripParens(String(row.display_name).trim());
        var pct = (String(row.display_name).indexOf("%") >= 0) ? "" : formatPercent(v);
        return { text: main, sub: pct, unlocked: ok };

      }

      var vStr = v != null ? v : "";

      return {

        text: "Nv." + lv + " — " + String(row.update).replace(/_base$/, ""),

        sub: vStr !== "" ? formatPercent(vStr) : "Mejora pasiva",

        unlocked: ok

      };

    }

    return { text: "Nv." + lv, sub: "", unlocked: ok };

  }



  function numIcon(row, key) {

    if (!row || row[key] == null || row[key] === "") return 0;

    var n = Number(row[key]);

    return n > 0 ? Math.floor(n) : 0;

  }



  function pickSkillIconIndex(row, detail) {

    if (!row) return -1;

    if (detail && detail.iconIndex != null && Number(detail.iconIndex) >= 0) {

      return Math.floor(Number(detail.iconIndex));

    }

    var lvl = detail && detail.currentLvl != null ? Number(detail.currentLvl) : 0;

    var cap = detail && detail.skillCap != null ? Number(detail.skillCap) : Number(row.skill_max_level) || 99;

    if (isNaN(lvl)) lvl = 0;

    if (isNaN(cap) || cap < 1) cap = 99;

    if (!detail || !detail.learned || lvl < 1) {

      var def = numIcon(row, "icon_normal");

      return def > 0 ? def : -1;

    }

    if (lvl >= cap) {
      // icon_max_exp solo cuando la EXP total llega al tope global
      var maxExpIcon = numIcon(row, "icon_max_exp");
      if (maxExpIcon > 0) {
        var totalExp = null;
        if (detail && detail.totalExp != null) totalExp = Number(detail.totalExp);
        if (totalExp != null && isFinite(ONYX_GLOBAL_MAX_TOTAL_EXP) && totalExp >= ONYX_GLOBAL_MAX_TOTAL_EXP) {
          return maxExpIcon;
        }
      }

      var maxLvlIcon = numIcon(row, "icon_max_lvl");
      if (maxLvlIcon > 0) return maxLvlIcon;

    }

    if (lvl >= 99 && numIcon(row, "icon_99") > 0) return numIcon(row, "icon_99");

    if (numIcon(row, "icon_normal") > 0) return numIcon(row, "icon_normal");

    return -1;

  }



  function buildOnyxSkillExpDetail(row, api, name, minLvl, maxLvl) {
    if (!api || !api.state) return null;
    var st = api.state();
    var total = st.totalExp || 0;
    var lvl = st.lvl;
    var cap = st.cap;
    var nextLv = lvl + 1;
    var nextTotal = st.nextLevelTotalExp;
    if (nextTotal == null && lvl < cap) nextTotal = expTotalForLevelFromTable(nextLv);
    var nextLevelExp = lvl < cap && nextTotal != null ? nextTotal : null;
    var curStart = st.curLvlTotal != null ? st.curLvlTotal : (lvl > 1 ? expTotalForLevelFromTable(lvl) : 0);
    if (curStart == null) curStart = 0;
    var lines = [
      { label: "Nivel", text: String(lvl) + " / " + String(cap) },
      { label: "Exp: ", text: String(total) + "/" + String(nextTotal) }
    ];
    if (lvl < cap && nextTotal != null) {
      lines.push({ label: "Siguiente nivel", text: Math.max(0, nextTotal - total) + " EXP" });
    } else if (lvl >= cap) {
      lines.push({ label: "Siguiente nivel", text: "— (nivel máximo alcanzado)" });
    }
    return {
      learned: api.isActive ? api.isActive() : true,
      name: name,
      lines: lines,
      minLvl: minLvl,
      maxLvl: maxLvl,
      listSubtext: "Nv. " + st.lvl,
      currentLvl: st.lvl,
      skillCap: st.cap,
      playerLvl: st.lvl,
      totalExp: total,
      nextLevelExp: nextLevelExp
    };
  }

  function getSkillDetail(row) {

    var id = Number(row.skill_id);

    var name = String(row.skill_name || "Skill #" + id);

    var minLvl = Number(row.skill_min_lvl) || 1;

    var maxLvl = Number(row.skill_max_level) || 99;



    if (window.OnyxSkillViewRegistry[id]) {

      try {

        var custom = window.OnyxSkillViewRegistry[id](row);

        if (custom) {

          if (!custom.listSubtext) custom.listSubtext = custom.learned ? "Activa" : "—";

          if (custom.currentLvl == null && custom.skillCap == null && custom.learned) {

            custom.currentLvl = Number(row.skill_min_lvl) || 1;

            custom.skillCap = Number(row.skill_max_level) || 99;

          }

          return custom;

        }

      } catch (e) {}

    }



    if (id === 1 && window.Onyx && Onyx.Skill && Onyx.Skill.Tala && Onyx.Skill.Tala.state) {

      var st = Onyx.Skill.Tala.state();

      var total = st.totalExp || 0;

      var lvl = st.lvl;

      var cap = st.cap;

      var nextLv = lvl + 1;

      var nextTotal = st.nextLevelTotalExp;

      if (nextTotal == null && lvl < cap) nextTotal = expTotalForLevelFromTable(nextLv);

      var nextLevelExp = null;
      if (lvl < cap && nextTotal != null) nextLevelExp = nextTotal;

      var curStart = st.curLvlTotal != null ? st.curLvlTotal : (lvl > 1 ? expTotalForLevelFromTable(lvl) : 0);

      if (curStart == null) curStart = 0;

      var lines = [

        { label: "Nivel", text: String(lvl) + " / " + String(cap) },
        { label: "Exp: ", text: String(total) + "/" + String(nextTotal) }

      ];
      
      if (lvl < cap && nextTotal != null) {
        // Línea compacta para el resumen: cuánto falta para el siguiente nivel
        lines.push({ label: "Siguiente nivel", text: Math.max(0, nextTotal - total) + " EXP" });

        var seg = Math.max(1, nextTotal - curStart);

        var inLvl = st.expIntoLevel != null ? st.expIntoLevel : Math.max(0, total - curStart);

        var need = Math.max(0, nextTotal - total);

        lines.push({

          label: "Meta para nivel " + nextLv,

          text: String(nextTotal) + " EXP acumulados (total requerido)"

        });

        lines.push({

          label: "Te faltan para subir",

          text: need + " EXP" + (need === 0 ? " (requisito cumplido)" : "")

        });

        lines.push({ label: "Progreso en nivel " + lvl, text: inLvl + " / " + seg + " EXP en este tramo" });

      } else if (lvl < cap) {

        lines.push({ label: "Siguiente nivel", text: "Sin dato EXP en tabla para nv. " + nextLv });

      } else {

        lines.push({ label: "Siguiente nivel", text: "— (nivel máximo alcanzado)" });

        lines.push({ label: "Estado", text: "Nivel máximo" });

      }

      return {

        learned: true,

        name: name,

        lines: lines,

        minLvl: minLvl,

        maxLvl: maxLvl,

        listSubtext: "Nv. " + st.lvl,

        currentLvl: st.lvl,

        skillCap: st.cap,

        playerLvl: st.lvl,

        totalExp: total,

        nextLevelExp: nextLevelExp

      };

    }

    if (id === 2 && window.Onyx && Onyx.Skill && Onyx.Skill.Mineria && Onyx.Skill.Mineria.state) {

      var stM = Onyx.Skill.Mineria.state();

      var totalM = stM.totalExp || 0;

      var lvlM = stM.lvl;

      var capM = stM.cap;

      var nextLvM = lvlM + 1;

      var nextTotalM = stM.nextLevelTotalExp;

      if (nextTotalM == null && lvlM < capM) nextTotalM = expTotalForLevelFromTable(nextLvM);

      var nextLevelExpM = null;
      if (lvlM < capM && nextTotalM != null) nextLevelExpM = nextTotalM;

      var curStartM = stM.curLvlTotal != null ? stM.curLvlTotal : (lvlM > 1 ? expTotalForLevelFromTable(lvlM) : 0);

      if (curStartM == null) curStartM = 0;

      var linesM = [

        { label: "Nivel", text: String(lvlM) + " / " + String(capM) },

        { label: "Exp: ", text: String(totalM) + "/" + String(nextTotalM) }

      ];

      if (lvlM < capM && nextTotalM != null) {

        linesM.push({ label: "Siguiente nivel", text: Math.max(0, nextTotalM - totalM) + " EXP" });

        var segM = Math.max(1, nextTotalM - curStartM);

        var inLvlM = stM.expIntoLevel != null ? stM.expIntoLevel : Math.max(0, totalM - curStartM);

        var needM = Math.max(0, nextTotalM - totalM);

        linesM.push({

          label: "Meta para nivel " + nextLvM,

          text: String(nextTotalM) + " EXP acumulados (total requerido)"

        });

        linesM.push({

          label: "Te faltan para subir",

          text: needM + " EXP" + (needM === 0 ? " (requisito cumplido)" : "")

        });

        linesM.push({ label: "Progreso en nivel " + lvlM, text: inLvlM + " / " + segM + " EXP en este tramo" });

      } else if (lvlM < capM) {

        linesM.push({ label: "Siguiente nivel", text: "Sin dato EXP en tabla para nv. " + nextLvM });

      } else {

        linesM.push({ label: "Siguiente nivel", text: "— (nivel máximo alcanzado)" });

        linesM.push({ label: "Estado", text: "Nivel máximo" });

      }

      if (Onyx.Skill.Mineria.getEffectiveBonusValues) {

        var ebM = Onyx.Skill.Mineria.getEffectiveBonusValues();

        linesM.push({ label: "Bonos", text: "Minería" });

        var km;

        for (km in ebM) {

          if (!ebM.hasOwnProperty(km)) continue;

          var rowM = ebM[km];

          linesM.push({ label: rowM.label || km, text: (Math.round(Number(rowM.value) * 100) / 100) + "" });

        }

      }

      return {

        learned: Onyx.Skill.Mineria.isActive ? Onyx.Skill.Mineria.isActive() : true,

        name: name,

        lines: linesM,

        minLvl: minLvl,

        maxLvl: maxLvl,

        listSubtext: "Nv. " + stM.lvl,

        currentLvl: stM.lvl,

        skillCap: stM.cap,

        playerLvl: stM.lvl,

        totalExp: totalM,

        nextLevelExp: nextLevelExpM

      };

    }

    if (id === 3 && window.Onyx && Onyx.Skill && Onyx.Skill.Pesca && Onyx.Skill.Pesca.state) {

      var stP = Onyx.Skill.Pesca.state();

      var totalP = stP.totalExp || 0;

      var lvlP = stP.lvl;

      var capP = stP.cap;

      var nextLvP = lvlP + 1;

      var nextTotalP = stP.nextLevelTotalExp;

      if (nextTotalP == null && lvlP < capP) nextTotalP = expTotalForLevelFromTable(nextLvP);

      var nextLevelExpP = lvlP < capP && nextTotalP != null ? nextTotalP : null;

      var curStartP = stP.curLvlTotal != null ? stP.curLvlTotal : (lvlP > 1 ? expTotalForLevelFromTable(lvlP) : 0);

      if (curStartP == null) curStartP = 0;

      var linesP = [

        { label: "Nivel", text: String(lvlP) + " / " + String(capP) },

        { label: "Exp: ", text: String(totalP) + "/" + String(nextTotalP) }

      ];

      if (lvlP < capP && nextTotalP != null) {

        linesP.push({ label: "Siguiente nivel", text: Math.max(0, nextTotalP - totalP) + " EXP" });

        var segP = Math.max(1, nextTotalP - curStartP);

        var inLvlP = stP.expIntoLevel != null ? stP.expIntoLevel : Math.max(0, totalP - curStartP);

        var needP = Math.max(0, nextTotalP - totalP);

        linesP.push({

          label: "Meta para nivel " + nextLvP,

          text: String(nextTotalP) + " EXP acumulados (total requerido)"

        });

        linesP.push({

          label: "Te faltan para subir",

          text: needP + " EXP" + (needP === 0 ? " (requisito cumplido)" : "")

        });

        linesP.push({ label: "Progreso en nivel " + lvlP, text: inLvlP + " / " + segP + " EXP en este tramo" });

      } else if (lvlP < capP) {

        linesP.push({ label: "Siguiente nivel", text: "Sin dato EXP en tabla para nv. " + nextLvP });

      } else {

        linesP.push({ label: "Siguiente nivel", text: "— (nivel máximo alcanzado)" });

        linesP.push({ label: "Estado", text: "Nivel máximo" });

      }

      return {

        learned: Onyx.Skill.Pesca.isActive ? Onyx.Skill.Pesca.isActive() : true,

        name: name,

        lines: linesP,

        minLvl: minLvl,

        maxLvl: maxLvl,

        listSubtext: "Nv. " + stP.lvl,

        currentLvl: stP.lvl,

        skillCap: stP.cap,

        playerLvl: stP.lvl,

        totalExp: totalP,

        nextLevelExp: nextLevelExpP

      };

    }

    if (id === 6 && window.Onyx && Onyx.Skill && Onyx.Skill.Mele && Onyx.Skill.Mele.state) {
      var d6 = buildOnyxSkillExpDetail(row, Onyx.Skill.Mele, name, minLvl, maxLvl);
      if (d6) return d6;
    }

    if (id === 7 && window.Onyx && Onyx.Skill && Onyx.Skill.Rango && Onyx.Skill.Rango.state) {
      var d7 = buildOnyxSkillExpDetail(row, Onyx.Skill.Rango, name, minLvl, maxLvl);
      if (d7) return d7;
    }

    if (id === 8 && window.Onyx && Onyx.Skill && Onyx.Skill.Magia && Onyx.Skill.Magia.state) {
      var d8 = buildOnyxSkillExpDetail(row, Onyx.Skill.Magia, name, minLvl, maxLvl);
      if (d8) return d8;
    }

    if (id === 4 && window.Onyx && Onyx.Skill && Onyx.Skill.Recoleccion && Onyx.Skill.Recoleccion.state) {

      var st = Onyx.Skill.Recoleccion.state();

      var total = st.totalExp || 0;

      var lvl = st.lvl;

      var cap = st.cap;

      var nextLv = lvl + 1;

      var nextTotal = st.nextLevelTotalExp;

      if (nextTotal == null && lvl < cap) nextTotal = expTotalForLevelFromTable(nextLv);

      var nextLevelExp = lvl < cap && nextTotal != null ? nextTotal : null;

      var lines = [

        { label: "Nivel", text: String(lvl) + " / " + String(cap) },

        { label: "Exp: ", text: String(total) + "/" + String(nextTotal) }

      ];

      if (lvl < cap && nextTotal != null) {

        lines.push({ label: "Siguiente nivel", text: Math.max(0, nextTotal - total) + " EXP" });

      } else if (lvl >= cap) {

        lines.push({ label: "Siguiente nivel", text: "— (nivel máximo alcanzado)" });

      }

      if (Onyx.Skill.Recoleccion.getEffectiveBonusValues) {
        lines.push({ label: "Bonos", text: "probabilidades efectivas" });
        var eb = Onyx.Skill.Recoleccion.getEffectiveBonusValues();
        var ebOrder = [
          "gather_extra_plant_chance",
          "gather_insect_chance",
          "gather_seed_chance",
          "gather_spore_chance",
          "gather_sprout_chance",
          "gather_thorn_chance"
        ];
        var ei;
        for (ei = 0; ei < ebOrder.length; ei++) {
          var bkey = ebOrder[ei];
          var brow = eb[bkey];
          if (!brow) continue;
          var pv = Number(brow.value);
          if (!isFinite(pv)) pv = 0;
          lines.push({ label: brow.label || bkey, text: (Math.round(pv * 100) / 100) + " %" });
        }
        if (Onyx.Skill.Recoleccion.getThornDamagePercentMhp) {
          var td = Onyx.Skill.Recoleccion.getThornDamagePercentMhp();
          if (isFinite(td) && td > 0)
            lines.push({ label: "Daño espina", text: td + " % PV máx (no mata)" });
        }
      }

      return {

        learned: Onyx.Skill.Recoleccion.isActive ? Onyx.Skill.Recoleccion.isActive() : true,

        name: name,

        lines: lines,

        minLvl: minLvl,

        maxLvl: maxLvl,

        listSubtext: "Nv. " + st.lvl,

        currentLvl: st.lvl,

        skillCap: st.cap,

        playerLvl: st.lvl,
        totalExp: total,
        nextLevelExp: nextLevelExp

      };

    }

    if (id === 5 && window.Onyx && Onyx.Skill && Onyx.Skill.Herreria && Onyx.Skill.Herreria.state) {

      var stH = Onyx.Skill.Herreria.state();

      var totalH = stH.totalExp || 0;

      var lvlH = stH.lvl;

      var capH = stH.cap;

      var nextLvH = lvlH + 1;

      var nextTotalH = stH.nextLevelTotalExp;

      if (nextTotalH == null && lvlH < capH) nextTotalH = expTotalForLevelFromTable(nextLvH);

      var nextLevelExpH = lvlH < capH && nextTotalH != null ? nextTotalH : null;

      var linesH = [

        { label: "Nivel", text: String(lvlH) + " / " + String(capH) },

        { label: "Exp: ", text: String(totalH) + "/" + String(nextTotalH) }

      ];

      if (lvlH < capH && nextTotalH != null) {

        linesH.push({ label: "Siguiente nivel", text: Math.max(0, nextTotalH - totalH) + " EXP" });

      } else if (lvlH >= capH) {

        linesH.push({ label: "Siguiente nivel", text: "— (nivel máximo alcanzado)" });

      }

      return {

        learned: Onyx.Skill.Herreria.isActive ? Onyx.Skill.Herreria.isActive() : true,

        name: name,

        lines: linesH,

        minLvl: minLvl,

        maxLvl: maxLvl,

        listSubtext: "Nv. " + stH.lvl,

        currentLvl: stH.lvl,

        skillCap: stH.cap,

        playerLvl: stH.lvl,
        totalExp: totalH,
        nextLevelExp: nextLevelExpH

      };

    }



    return {

      learned: false,

      name: name,

      lines: [{ label: "Estado", text: "Aún no disponible en esta vista." }],

      minLvl: minLvl,

      maxLvl: maxLvl,

      listSubtext: "—",

      currentLvl: 0,

      skillCap: maxLvl,

      playerLvl: 0,
      totalExp: null,
      nextLevelExp: null

    };

  }



  function playerLevelForSkillRow(row) {

    var d = getSkillDetail(row);

    if (d.playerLvl != null) return d.playerLvl;
    return d.currentLvl || 0;

  }



  // ---------------------------------------------------------------------------

  // Scene lista (pantalla completa)

  // ---------------------------------------------------------------------------

  function Scene_OnyxSkills() {

    this.initialize.apply(this, arguments);

  }



  Scene_OnyxSkills.prototype = Object.create(Scene_MenuBase.prototype);

  Scene_OnyxSkills.prototype.constructor = Scene_OnyxSkills;



  Scene_OnyxSkills.prototype.initialize = function() {

    Scene_MenuBase.prototype.initialize.call(this);

  };



  Scene_OnyxSkills.prototype.create = function() {

    Scene_MenuBase.prototype.create.call(this);

    this._helpWindow = new Window_Help(1);

    this._helpWindow.setText(MENU_NAME + "  OK: detalle · Cancel: salir");
    // Centrar texto del help (sin paréntesis).
    var help1 = this._helpWindow;
    help1.refresh = function() {
      this.contents.clear();
      var text = this._text || "";
      this.drawText(text, 0, 0, this.contentsWidth(), "center");
    };
    help1.refresh();

    var wy = this._helpWindow.height;

    var listH = Graphics.boxHeight - wy;

    this._listWindow = new Window_OnyxSkillsList(0, wy, Graphics.boxWidth, listH);

    this._listWindow.setHandler("ok", this.onSkillOk.bind(this));

    this._listWindow.setHandler("cancel", this.popScene.bind(this));

    this.addWindow(this._helpWindow);
    this.addWindow(this._listWindow);
    if (window.OnyxWindowEditor) {
      window.OnyxWindowEditor.registerWindow(this._helpWindow, "skills_help");
      window.OnyxWindowEditor.registerWindow(this._listWindow, "skills_list");
    }
    this._listWindow.activate();

    var ri = Window_OnyxSkillsList.restoreIndex();

    var mx = Math.max(0, this._listWindow.maxItems() - 1);

    this._listWindow.select(Math.min(ri, mx));

  };



  Scene_OnyxSkills.prototype.onSkillOk = function() {

    var row = this._listWindow.currentSkillRow();

    if (!row) return;

    Window_OnyxSkillsList.saveIndex(this._listWindow.index());

    $gameTemp._onyxSkillDetailRow = row;

    SceneManager.push(Scene_OnyxSkillDetail);

  };



  // ---------------------------------------------------------------------------

  // Lista principal

  // ---------------------------------------------------------------------------

  function Window_OnyxSkillsList(x, y, width, height) {

    this.initialize.apply(this, arguments);

  }



  Window_OnyxSkillsList.restoreIndex = function() {

    var n = $gameSystem._onyxSkillsListIndex;

    return typeof n === "number" && n >= 0 ? n : 0;

  };



  Window_OnyxSkillsList.saveIndex = function(i) {

    $gameSystem._onyxSkillsListIndex = i;

  };



  Window_OnyxSkillsList.prototype = Object.create(Window_Selectable.prototype);

  Window_OnyxSkillsList.prototype.constructor = Window_OnyxSkillsList;



  Window_OnyxSkillsList.prototype.initialize = function(x, y, width, height) {

    this._rows = [];

    Window_Selectable.prototype.initialize.call(this, x, y, width, height);

    this.refresh();

    this.select(0);

  };



  Window_OnyxSkillsList.prototype.maxItems = function() {

    return this._rows ? this._rows.length : 0;

  };



  Window_OnyxSkillsList.prototype.currentSkillRow = function() {

    return this._rows[this.index()];

  };



  Window_OnyxSkillsList.prototype.itemHeight = function() {

    return Math.max(Window_Base._iconHeight + 4, this.lineHeight() * 3 + 8);

  };

  Window_OnyxSkillsList.prototype.maxCols = function() {
    return 3;
  };



  Window_OnyxSkillsList.prototype.refresh = function() {

    this._rows = skillListRows();

    this.createContents();

    this.drawAllItems();

  };



  Window_OnyxSkillsList.prototype.drawItem = function(index) {

    var row = this._rows[index];

    if (!row) return;

    var rect = this.itemRect(index);

    var detail = getSkillDetail(row);

    var ix = pickSkillIconIndex(row, detail);
    var iw = Window_Base._iconWidth + 8;
    var textX = 0;
    if (ix >= 0) textX = rect.x + iw;
    else textX = rect.x + 4;

    if (ix >= 0) {
      var iconY = rect.y + Math.max(0, (rect.height - Window_Base._iconHeight) / 2);
      this.drawIcon(ix, rect.x + 4, iconY);
    }

    var tw = rect.x + rect.width - textX - 4;
    var name = String(row.skill_name || "?");

    this.changePaintOpacity(detail.learned);
    this.contents.fontSize = this.standardFontSize() - 10;
    this.drawText(name, textX, rect.y + 2, tw);

    // Nivel un poco más grande
    this.contents.fontSize = 12;
    var lvl = 0;
    if (detail.currentLvl != null) lvl = Number(detail.currentLvl);
    var cap = 0;
    if (detail.skillCap != null) cap = Number(detail.skillCap);

    var lvlText = "—";
    if (lvl > 0) lvlText = String(lvl);
    var lvlLine = "Nv. " + lvlText + " / " + String(cap);
    this.drawText(lvlLine, textX, rect.y + this.lineHeight(), tw, "left");

    var expLine = "EXP —";
    if (detail.totalExp != null) {
      expLine = "EXP: " + String(detail.totalExp);
      if (detail.nextLevelExp != null) {
        expLine = "EXP: " + String(detail.totalExp) + " / " + String(detail.nextLevelExp);
      }
    }
    this.drawText(expLine, textX, rect.y + this.lineHeight() * 2, tw, "left");

    this.changePaintOpacity(true);
    this.contents.fontSize = this.standardFontSize();

  };



  // ---------------------------------------------------------------------------

  // Scene detalle (1/3 resumen + 2/3 unlocks)

  // ---------------------------------------------------------------------------

  function Scene_OnyxSkillDetail() {

    this.initialize.apply(this, arguments);

  }



  Scene_OnyxSkillDetail.prototype = Object.create(Scene_MenuBase.prototype);

  Scene_OnyxSkillDetail.prototype.constructor = Scene_OnyxSkillDetail;



  Scene_OnyxSkillDetail.prototype.create = function() {

    Scene_MenuBase.prototype.create.call(this);

    this._skillRow = $gameTemp._onyxSkillDetailRow || null;

    var help = new Window_Help(1);

    var d = this._skillRow ? getSkillDetail(this._skillRow) : { name: "?" };

    help.setText(d.name + "  Cancel: volver");
    help.refresh = function() {
      this.contents.clear();
      var text = this._text || "";
      this.drawText(text, 0, 0, this.contentsWidth(), "center");
    };
    help.refresh();

    var wy = help.height;
    var rest = Graphics.boxHeight - wy;

    var hTop = Math.max(Math.floor(rest * 0.42), 220);
    if (hTop > rest - 120) hTop = Math.max(rest - 120, Math.floor(rest / 3));
    var hBot = rest - hTop;

    this._summaryWindow = new Window_OnyxSkillSummary(0, wy, Graphics.boxWidth, hTop, this._skillRow);
    this._unlockWindow = new Window_OnyxSkillUnlocks(0, wy + hTop, Graphics.boxWidth, hBot, this._skillRow);

    this._unlockWindow.setHandler("cancel", this.popScene.bind(this));

    this.addWindow(help);
    this.addWindow(this._summaryWindow);
    this.addWindow(this._unlockWindow);
    if (window.OnyxWindowEditor) {
      window.OnyxWindowEditor.registerWindow(help, "skill_detail_help");
      window.OnyxWindowEditor.registerWindow(this._summaryWindow, "skill_detail_summary");
      window.OnyxWindowEditor.registerWindow(this._unlockWindow, "skill_detail_unlocks");
    }
    this._unlockWindow.activate();
    if (this._unlockWindow.maxItems() > 0) this._unlockWindow.select(0);

  };



  function Window_OnyxSkillSummary(x, y, width, height, skillRow) {
    this._skillRow = skillRow;
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
  }

  Window_OnyxSkillSummary.prototype = Object.create(Window_Base.prototype);
  Window_OnyxSkillSummary.prototype.constructor = Window_OnyxSkillSummary;

  Window_OnyxSkillSummary.prototype.refresh = function() {
    this.contents.clear();
    if (!this._skillRow) {
      this.drawText("Sin datos.", 12, 12, this.contentsWidth() - 24);
      return;
    }
    var detail = getSkillDetail(this._skillRow);
    var y0 = 8;
    var lh = this.lineHeight();
    var ix = pickSkillIconIndex(this._skillRow, detail);
    var tx = 12;
    if (ix >= 0) {
      this.drawIcon(ix, 12, y0);
      tx = 12 + Window_Base._iconWidth + 10;
    }
    this.resetTextColor();
    this.contents.fontSize = this.standardFontSize() + 2;
    this.drawText(detail.name, tx, y0 + 2, this.contentsWidth() - tx - 12);
    this.contents.fontSize = this.standardFontSize();
    var y1 = y0 + Math.max(Window_Base._iconHeight, lh + 6);
    this.resetTextColor();
    y1 += lh + 2;
    var lines = detail.lines || [];
    var fs = this.contents.fontSize;
    this.contents.fontSize = Math.max(16, fs - 2);
    var lineStep = this.lineHeight() + 1;
    var maxY = this.contents.height - 6;
    for (var i = 0; i < lines.length && y1 <= maxY - lineStep; i++) {
      var L = lines[i];
      var full = String(L.label) + ": " + String(L.text);
      this.resetTextColor();
      this.drawText(full, 12, y1, this.contentsWidth() - 20);
      y1 += lineStep;
    }
    this.contents.fontSize = fs;
  };

  function Window_OnyxSkillUnlocks(x, y, width, height, skillRow) {

    this._skillRow = skillRow;

    this._unlockList = [];

    Window_Selectable.prototype.initialize.call(this, x, y, width, height);

    this.refresh();

    if (this.maxItems() > 0) this.select(0);

  }



  Window_OnyxSkillUnlocks.prototype = Object.create(Window_Selectable.prototype);

  Window_OnyxSkillUnlocks.prototype.constructor = Window_OnyxSkillUnlocks;

  Window_OnyxSkillUnlocks.prototype.maxItems = function() {

    return this._unlockList.length;

  };



  Window_OnyxSkillUnlocks.prototype.itemHeight = function() {

    return this.lineHeight() * 2 + 4;

  };

  Window_OnyxSkillUnlocks.prototype.contentsHeight = function() {
    var minH = this.height - this.standardPadding() * 2;
    var fullH = Math.max(1, this.maxItems()) * this.itemHeight();
    return Math.max(minH, fullH);
  };

  Window_OnyxSkillUnlocks.prototype.itemRect = function(index) {
    var rect = new Rectangle();
    var maxCols = this.maxCols();
    rect.width = this.itemWidth();
    rect.height = this.itemHeight();
    rect.x = index % maxCols * (rect.width + this.spacing());
    rect.y = Math.floor(index / maxCols) * rect.height;
    return rect;
  };

  Window_OnyxSkillUnlocks.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    this.origin.x = this._scrollX || 0;
    this.origin.y = this._scrollY || 0;
  };

  Window_OnyxSkillUnlocks.prototype.setTopRow = function(row) {
    var scrollY = row.clamp(0, this.maxTopRow()) * this.itemHeight();
    if (this._scrollY !== scrollY) {
      this._scrollY = scrollY;
      this.updateCursor();
    }
  };

  Window_OnyxSkillUnlocks.prototype.refresh = function() {

    this._unlockList = [];

    if (this._skillRow && this._skillRow.skill_id != null) {

      this._unlockList = unlockRowsForSkill(this._skillRow.skill_id);

    }

    this.createContents();

    for (var i = 0; i < this.maxItems(); i++) this.drawItem(i);

    if (this.maxItems() > 0) this.select(this.index() >= 0 ? this.index() : 0);

  };



  Window_OnyxSkillUnlocks.prototype.drawItem = function(index) {

    var row = this._unlockList[index];

    if (!row) return;

    var rect = this.itemRect(index);

    var pl = playerLevelForSkillRow(this._skillRow);

    var fmt = formatUnlockRow(row, pl);

    this.changePaintOpacity(fmt.unlocked);

    if (fmt.unlocked) {

      this.changeTextColor(this.textColor(14));

    } else {

      this.changeTextColor(this.normalColor());

    }

    this.drawText(fmt.text, rect.x + 4, rect.y + 2, rect.width - 8);

    this.contents.fontSize = this.standardFontSize() - 2;

    if (fmt.sub) {
      this.changeTextColor(this.systemColor());
      this.drawText(fmt.sub, rect.x + 8, rect.y + this.lineHeight() + 2, rect.width - 12);
    }

    this.contents.fontSize = this.standardFontSize();

    this.resetTextColor();

    this.changePaintOpacity(true);

  };

  // ---------------------------------------------------------------------------

  // Menú + tecla H

  // ---------------------------------------------------------------------------

  if (ADD_TO_MENU) {

    var _addOriginal = Window_MenuCommand.prototype.addOriginalCommands;

    Window_MenuCommand.prototype.addOriginalCommands = function() {

      _addOriginal.call(this);

      var ok = !MENU_SWITCH || $gameSwitches.value(MENU_SWITCH);

      this.addCommand(MENU_NAME, "onyxSkills", ok);

    };



    var _menuCreate = Scene_Menu.prototype.createCommandWindow;

    Scene_Menu.prototype.createCommandWindow = function() {

      _menuCreate.call(this);

      this._commandWindow.setHandler("onyxSkills", this.commandOnyxSkills.bind(this));

    };



    Scene_Menu.prototype.commandOnyxSkills = function() {

      SceneManager.push(Scene_OnyxSkills);

    };

  }



  function canOpenSkillsFromMap() {

    if (!$gamePlayer || !$gameMap) return false;

    if ($gameMessage && $gameMessage.isBusy()) return false;

    if (SceneManager.isSceneChanging()) return false;

    if (BLOCK_H_EVENT && $gameMap.isEventRunning()) return false;

    return true;

  }



  if (OPEN_WITH_H) {

    var _mapUpdate = Scene_Map.prototype.update;

    Scene_Map.prototype.update = function() {

      _mapUpdate.call(this);

      if (Input.isTriggered(HOTKEY) && canOpenSkillsFromMap()) {

        SceneManager.push(Scene_OnyxSkills);

      }

    };

  }



  window.Scene_OnyxSkills = Scene_OnyxSkills;

  window.Scene_OnyxSkillDetail = Scene_OnyxSkillDetail;

})();

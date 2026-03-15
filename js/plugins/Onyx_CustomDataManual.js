/*:
 * @plugindesc (Onyx) Carga manual de JSON custom desde /data/custom/ en $dataCustom.
 * @author Onyx
 *
 * @help
 * - Deja tus archivos en: data/custom/
 * - Edita el arreglo CUSTOM_DATA_FILES para agregar nuevos JSON.
 * - Acceso en juego:
 *     const rewards = $dataCustom.MaterialRewards;
 */

(() => {
  // ---------------------------------------------------------------------------
  // 1) LISTA MANUAL: agrega aquí tus nuevos archivos
  //    key: nombre con el que lo usarás en $dataCustom[key]
  //    file: nombre del json dentro de data/custom/
  // ---------------------------------------------------------------------------
  const CUSTOM_DATA_FILES = [
    { key: "MaterialRewards", file: "MaterialRewards.json" },
    { key: "ConsumibleRewards", file: "ConsumibleRewards.json" },
    { key: "ConsumibleItems", file: "ConsumibleItems.json" },
    { key: "SkillList", file: "SkillList.json" },
    { key: "SkillNodeLevelNeed", file: "SkillNodeLevelNeed.json" },
    { key: "ToolLevelList", file: "ToolLevelList.json" },
    { key: "ExpTable", file: "ExpTable.json" },

    // Ejemplos para futuro:
    // { key: "Recipes", file: "Recipes.json" },
    // { key: "SkillCore", file: "SkillCore.json" },
    // { key: "NpcRelations", file: "NpcRelations.json" },
  ];

  const FOLDER = "data/custom";
  window.$dataCustom = window.$dataCustom || {};
  window.$dataCustomLoaded = window.$dataCustomLoaded || {}; // flags por key

  function loadCustomJson(key, relPath) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", relPath);
    xhr.overrideMimeType("application/json");

    xhr.onload = function() {
      if (xhr.status < 400) {
        try {
          window.$dataCustom[key] = JSON.parse(xhr.responseText);
          window.$dataCustomLoaded[key] = true;
        } catch (e) {
          window.$dataCustom[key] = null;
          window.$dataCustomLoaded[key] = false;
        }
      } else {
        window.$dataCustom[key] = null;
        window.$dataCustomLoaded[key] = false;
      }
    };

    xhr.onerror = function() {
      window.$dataCustom[key] = null;
      window.$dataCustomLoaded[key] = false;
    };

    xhr.send();
  }

  // Hook: al cargar la DB del juego, también cargamos la custom
  const _DataManager_loadDatabase = DataManager.loadDatabase;
  DataManager.loadDatabase = function() {
    _DataManager_loadDatabase.call(this);

    for (const entry of CUSTOM_DATA_FILES) {
      const key = entry.key;
      const file = entry.file;
      window.$dataCustomLoaded[key] = false;
      loadCustomJson(key, `${FOLDER}/${file}`);
    }
  };
  
  // -----------------------------------------------------------------------------
  // giveMaterialReward(materialId, animationId)
  // - Soporta chance decimal (ej: 0.000026)
  // - Retorna true si entregó item, false si no
  // -----------------------------------------------------------------------------
  window.giveMaterialReward = function(materialId, animationId = 0) {
    if (!window.$dataCustom || !$dataCustom.MaterialRewards) {
      return false;
    }

    const row = $dataCustom.MaterialRewards.find(r => r && r.material_id === materialId);
    if (!row) return false;

    const chance = Number(row.chance || 0);
    if (chance <= 0) return false;

    // Roll decimal 0..100 (permite chances ultra bajos)
    const roll = Math.random() * 100; // 0 <= roll < 100

    // Usamos < (no <=) porque roll nunca llega exactamente a 100
    if (roll >= chance) return false;

    const item = $dataItems[row.item_id];
    if (!item) {
      return false;
    }

    var min = Math.floor(Number((row.min !== undefined && row.min !== null) ? row.min : 1));
    var max = Math.floor(Number((row.max !== undefined && row.max !== null) ? row.max : min));

    const qty = (max >= min)
      ? (min + Math.floor(Math.random() * (max - min + 1)))
      : min;

    $gameParty.gainItem(item, qty);

    if (animationId > 0) {
      $gamePlayer.requestAnimation(animationId);
    }

    return { success: true, item: item, qty: qty };
  };

  // -----------------------------------------------------------------------------
  // giveConsumibleRewards(consumibleItemId, animationId)
  // - Elige SOLO 1 reward desde un set de recompensas asociado a item_id
  // - Soporta chance decimal (ej: 0.00001)
  // - Retorna:
  //    { success: true, item: <obj>, qty: <n>, reward: <rewardRow> } si entregó
  //    { success: false, reason: "..." , reward: <rewardRow|null> } si no entregó
  // -----------------------------------------------------------------------------
  window.giveConsumibleRewards = function(consumibleItemId, animationId = 0) {
    if (!window.$dataCustom || !$dataCustom.ConsumibleRewards) {
      return { success: false, reason: "data_not_loaded", reward: null };
    }

    // Busca el set por item_id (igual que tu ejemplo: {"item_id":616,"reward":[...]} )
    const row = $dataCustom.ConsumibleRewards.find(r => r && r.item_id === consumibleItemId);
    if (!row || !Array.isArray(row.reward) || row.reward.length === 0) {
      return { success: false, reason: "no_reward_set", reward: null };
    }

    // Filtramos rewards válidos (chance numérico > 0 también se puede permitir 0 pero no aporta)
    const rewards = row.reward
      .filter(r => r && r.chance !== undefined && r.chance !== null)
      .map(r => ({ ...r, chance: Number(r.chance) }))
      .filter(r => !Number.isNaN(r.chance) && r.chance >= 0);

    if (rewards.length === 0) {
      return { success: false, reason: "empty_rewards", reward: null };
    }

    // Total chance (idealmente 100, pero no dependemos de eso)
    const total = rewards.reduce((acc, r) => acc + r.chance, 0);
    if (total <= 0) {
      return { success: false, reason: "total_chance_zero", reward: null };
    }

    // Roll 0..total (decimales OK)
    const roll = Math.random() * total;

    // Elegimos por acumulado
    let acc = 0;
    let chosen = rewards[rewards.length - 1]; // fallback por si hay decimales raros
    for (const r of rewards) {
      acc += r.chance;
      if (roll < acc) { // < para consistencia con roll que nunca llega exacto al total
        chosen = r;
        break;
      }
    }

    // Si item_id es null => no cae nada (tu caso "Nada")
    if (chosen.item_id === null || chosen.item_id === undefined) {
      if (animationId > 0) $gamePlayer.requestAnimation(animationId);
      return { success: false, reason: "no_drop", reward: chosen };
    }

    const item = $dataItems[Number(chosen.item_id)];
    if (!item) {
      return { success: false, reason: "item_not_found", reward: chosen };
    }

    const min = Math.floor(Number((chosen.min !== undefined && chosen.min !== null) ? chosen.min : 1));
    const max = Math.floor(Number((chosen.max !== undefined && chosen.max !== null) ? chosen.max : min));

    const qty = (max >= min)
      ? (min + Math.floor(Math.random() * (max - min + 1)))
      : min;

    $gameParty.gainItem(item, qty);

    if (animationId > 0) {
      $gamePlayer.requestAnimation(animationId);
    }

    return { success: true, item: item, qty: qty, reward: chosen };
  };


  // -----------------------------------------------------------------------------
  // showFloatingMessage(text, durationFrames, eventId, position, transparent)
  // eventId:
  //   0  => top-center (works in any scene, like now)
  //  -1  => anchor to player (Scene_Map only; otherwise fallback to 0)
  //  1+  => anchor to $gameMap.event(eventId) (Scene_Map only; otherwise fallback)
  // position: "arriba" | "medio" | "abajo"
  // transparent: true => no background box, only text
  // -----------------------------------------------------------------------------
  // Activa/desactiva logs
  window.ONYX_TOAST_DEBUG = window.ONYX_TOAST_DEBUG || false;

  window.showFloatingMessage = function(text, durationFrames = 120, eventId = 0, position = "arriba", transparent = false) {
    const scene = SceneManager._scene;
    if (!scene) return;

    // Layer + list (per-scene)
    if (!scene._onyxToastLayer) {
      scene._onyxToastLayer = new Sprite();
      scene.addChild(scene._onyxToastLayer);
      scene._onyxToasts = [];
    }

    // ---- Build bitmap (simple wrap)
    const padding = transparent ? 0 : 10;
    const fontSize = 22;
    const maxW = Math.min(Graphics.boxWidth - 40, 520);

    const measureBmp = new Bitmap(1, 1);
    measureBmp.fontSize = fontSize;

    const words = String(text).split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? (line + " " + w) : w;
      if (measureBmp.measureTextWidth(test) > (maxW - padding * 2) && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);

    const lineH = fontSize + 6;
    const textH = lines.length * lineH;
    const boxH = textH + padding * 2;

    const bmp = new Bitmap(maxW, boxH);
    bmp.fontSize = fontSize;

    // Background (optional)
    if (!transparent) {
      bmp.paintOpacity = 160;
      bmp.fillRect(0, 0, maxW, boxH, "#000000");
      bmp.paintOpacity = 255;
    }

    // Text
    let y = padding;
    for (const ln of lines) {
      bmp.drawText(ln, padding, y, maxW - padding * 2, lineH, "center");
      y += lineH;
    }

    const spr = new Sprite(bmp);
    spr.opacity = 0;
    spr._life = Math.max(1, Number(durationFrames) || 120);
    spr._onyxDur = spr._life;              // ✅ duración por-toast (evita contaminación)
    spr._fadeOut = 30;
    spr._fadeIn = 10;

    // Tracking config
    spr._onyxEventId = Number(eventId || 0); // 0, -1, 1+
    spr._onyxPos = String(position || "arriba").toLowerCase();
    spr._onyxTransparent = !!transparent;

    // Debug flags (para no spamear por frame)
    spr._dbg = {
      createdLogged: false,
      fallbackLogged: false,
      targetLogged: false,
    };

    // Default placement (center-top) for any scene
    spr.x = Math.floor((Graphics.boxWidth - maxW) / 2);
    spr.y = 16;

    scene._onyxToastLayer.addChild(spr);
    scene._onyxToasts.push(spr);

    // Log creación (1 vez)
    if (window.ONYX_TOAST_DEBUG && !spr._dbg.createdLogged) {
      spr._dbg.createdLogged = true;
      const sceneName = scene.constructor && scene.constructor.name ? scene.constructor.name : "UnknownScene";
      const mapId = ($gameMap && $gameMap.mapId) ? $gameMap.mapId() : null;
    }

    // Hook update once per scene
    if (!scene._onyxToastUpdatePatched) {
      scene._onyxToastUpdatePatched = true;
      const _update = scene.update;

      scene.update = function() {
        _update.call(this);

        if (!this._onyxToasts) return;

        const isMapScene = this instanceof Scene_Map;

        for (let i = this._onyxToasts.length - 1; i >= 0; i--) {
          const t = this._onyxToasts[i];
          t._life--;

          // Fade in/out (usa duración propia del toast)
          const totalDur = Math.max(1, Number(t._onyxDur) || 120);
          if (t._life > (totalDur - t._fadeIn)) {
            t.opacity = Math.min(255, t.opacity + Math.ceil(255 / t._fadeIn));
          }
          if (t._life <= t._fadeOut) {
            t.opacity = Math.max(0, t.opacity - Math.ceil(255 / t._fadeOut));
          }

          // ---- Positioning rules
          if (t._onyxEventId !== 0 && isMapScene) {
            let target = null;

            if (t._onyxEventId === -1) {
              target = $gamePlayer;
            } else if (t._onyxEventId > 0) {
              target = $gameMap.event(t._onyxEventId);
            }

            if (target && target.screenX && target.screenY) {
              const sx = target.screenX();
              const sy = target.screenY();

              // Log target coords (1 vez por toast)
              if (window.ONYX_TOAST_DEBUG && !t._dbg.targetLogged) {
                t._dbg.targetLogged = true;
              }

              let oy = -48;
              if (t._onyxPos === "medio") oy = -24;
              if (t._onyxPos === "abajo") oy = 0;

              t.x = Math.floor(sx - (t.width / 2));
              t.y = Math.floor(sy + oy - t.height);

              // clamp
              t.x = Math.max(4, Math.min(t.x, Graphics.boxWidth - t.width - 4));
              t.y = Math.max(4, Math.min(t.y, Graphics.boxHeight - t.height - 4));
            } else {
              // fallback if target not found
              if (window.ONYX_TOAST_DEBUG && !t._dbg.fallbackLogged) {
                t._dbg.fallbackLogged = true;
              }

              t.x = Math.floor((Graphics.boxWidth - t.width) / 2);
              t.y = 16;
            }
          } else if (t._onyxEventId !== 0 && !isMapScene) {
            // In menu/other scenes, anchored targets don't exist -> fallback
            if (window.ONYX_TOAST_DEBUG && !t._dbg.fallbackLogged) {
              t._dbg.fallbackLogged = true;
              const sceneName = this.constructor && this.constructor.name ? this.constructor.name : "UnknownScene";
            }

            t.x = Math.floor((Graphics.boxWidth - t.width) / 2);
            t.y = 16;
          }

          // float up only for eventId=0
          if (t._onyxEventId === 0) t.y -= 0.15;

          if (t._life <= 0) {
            if (t.parent) t.parent.removeChild(t);
            this._onyxToasts.splice(i, 1);
          }
        }
      };
    }
  };

  window.ONYX_SKILL_DEBUG = window.ONYX_SKILL_DEBUG || true;

  /**
   * Mejor tool del grupo para el skill: recorre todos los héroes, slot herramienta (9),
   * y devuelve la que tenga mayor daño en ToolLevelList.
   * @returns {{ damage: number, tool_lvl: number, tool_id: number, name: string }|null}
   */
  window.getBestPartyToolForSkill = function(skillId) {
    skillId = Number(skillId) || 0;
    const toolList = window.$dataCustom && $dataCustom.ToolLevelList;
    if (!toolList || !toolList.length) return null;
    const members = $gameParty.members();
    let best = null;
    let bestDamage = 0;
    for (let m = 0; m < members.length; m++) {
      const actor = members[m];
      if (!actor || !actor.equips) continue;
      const equips = actor.equips();
      if (!equips || equips.length <= 9) continue;
      const equip = equips[9];
      if (!equip) continue;
      const toolId = Number(equip.id) || 0;
      if (!toolId) continue;
      for (let i = 0; i < toolList.length; i++) {
        const row = toolList[i];
        if (row && Number(row.tool_id) === toolId && Number(row.skill_id) === skillId) {
          const dmg = Math.max(1, Number(row.damage) || 1);
          if (dmg > bestDamage) {
            bestDamage = dmg;
            best = {
              damage: dmg,
              tool_lvl: Number(row.tool_lvl) || 0,
              tool_id: toolId,
              name: row.name || ""
            };
          }
          break;
        }
      }
    }
    return best;
  };

  /**
   * Retorna el daño de la mejor hacha/tool del grupo para el skill dado.
   * Usa getBestPartyToolForSkill (máximo daño entre todos los héroes). Retorna 1 si no hay tool válida.
   */
  window.getEquippedToolDamage = function(skillId) {
    const best = window.getBestPartyToolForSkill(skillId);
    if (!best) {
      if (window.ONYX_SKILL_DEBUG) console.log("[Skill] getEquippedToolDamage: ninguna tool válida en el grupo, damage=1");
      return 1;
    }
    if (window.ONYX_SKILL_DEBUG) console.log("[Skill] getEquippedToolDamage: tool_id=" + best.tool_id + ", damage=" + best.damage + " (" + best.name + ") [mejor del grupo]");
    return best.damage;
  };

  /**
   * Da troncos extra por cada 1 HP de daño (roll tree_extra_log_chance%).
   * materialId: material_id del tronco (ej. 1=Pino). Retorna { given: N, totalRolls: M }.
   */
  window.giveTreeExtraLogs = function(damage, materialId) {
    if (!window.$dataCustom || !$dataCustom.MaterialRewards) return { given: 0, totalRolls: 0 };
    const row = $dataCustom.MaterialRewards.find(r => r && r.material_id === materialId);
    if (!row) return { given: 0, totalRolls: 0 };
    const item = $dataItems[Number(row.item_id)];
    if (!item) return { given: 0, totalRolls: 0 };
    const chance = (window.Onyx && Onyx.Skill && Onyx.Skill.Tala && Onyx.Skill.Tala.getTreeExtraLogChance)
      ? Onyx.Skill.Tala.getTreeExtraLogChance()
      : 15;
    const rolls = Math.max(0, Math.floor(Number(damage) || 0));
    let given = 0;
    const results = [];
    for (let i = 0; i < rolls; i++) {
      const r = Math.random() * 100;
      const won = r < chance;
      if (won) {
        $gameParty.gainItem(item, 1);
        given++;
      }
      if (window.ONYX_SKILL_DEBUG) results.push("roll" + (i + 1) + "=" + r.toFixed(2) + "% " + (won ? "OK" : "no"));
    }
    if (window.ONYX_SKILL_DEBUG) console.log("[Skill] giveTreeExtraLogs: damage=" + damage + ", rolls=" + rolls + " (cada 1 HP), chance=" + chance + "%, given=" + given, results.length ? results : "");
    return { given: given, totalRolls: rolls };
  };

  /**
   * [ENDPOINT] get_node_info
   * Obtiene datos del nodo y los escribe en vars 38 (no_lvl), 60 (ma_id), 90 (c_hp).
   * @param {number} nodeId - ID del nodo (ej. $gameVariables.value(89))
   * @param {number} [tableVarId=1000] - Variable con la tabla de nodos
   * @param {object} [outVars] - { noLvl: 38, maId: 60, cHp: 90 } ids de salida
   */
  window.onyxGetNodeInfo = function(nodeId, tableVarId, outVars) {
    tableVarId = Number(tableVarId) || 1000;
    outVars = outVars || { noLvl: 38, maId: 60, cHp: 90 };
    const table = $gameVariables.value(tableVarId) || {};
    const data = table[nodeId] || {};
    const noLvl = data.no_lvl || 0;
    const maId = data.ma_id || 0;
    const cHp = data.c_hp || 0;
    $gameVariables.setValue(outVars.noLvl, noLvl);
    $gameVariables.setValue(outVars.maId, maId);
    $gameVariables.setValue(outVars.cHp, cHp);
    if (window.ONYX_SKILL_DEBUG) console.log("[Skill] get_node_info: nodeId=" + nodeId + ", no_lvl=" + noLvl + ", ma_id=" + maId + ", c_hp=" + cHp);
  };

  /**
   * [ENDPOINT] set_node_hp
   * Resta damage al c_hp del nodo y guarda la tabla.
   * @param {number} nodeId
   * @param {number} damage
   * @param {number} [tableVarId=1000]
   */
  window.onyxSetNodeHp = function(nodeId, damage, tableVarId) {
    tableVarId = Number(tableVarId) || 1000;
    const dict = $gameVariables.value(tableVarId) || {};
    const data = dict[nodeId] || {};
    const prev = data.c_hp || 0;
    const dmg = Number(damage) || 0;
    data.c_hp = prev - dmg;
    dict[nodeId] = data;
    $gameVariables.setValue(tableVarId, dict);
    if (window.ONYX_SKILL_DEBUG) console.log("[Skill] set_node_hp: nodeId=" + nodeId + ", c_hp " + prev + " - " + dmg + " = " + data.c_hp);
  };

  /**
   * [ENDPOINT] get_current_node_hp
   * Escribe el c_hp actual del nodo en la var 90 (o outCHpVarId).
   * @param {number} nodeId
   * @param {number} [tableVarId=1000]
   * @param {number} [outCHpVarId=90]
   */
  window.onyxGetCurrentNodeHp = function(nodeId, tableVarId, outCHpVarId) {
    tableVarId = Number(tableVarId) || 1000;
    outCHpVarId = Number(outCHpVarId) || 90;
    const dict = $gameVariables.value(tableVarId) || {};
    const data = dict[nodeId] || {};
    $gameVariables.setValue(outCHpVarId, data.c_hp || 0);
  };

  /**
   * [ENDPOINT] set_node_off
   * Marca el nodo como inactivo (active = 0).
   * @param {number} nodeId
   * @param {number} [tableVarId=1000]
   */
  window.onyxSetNodeOff = function(nodeId, tableVarId) {
    tableVarId = Number(tableVarId) || 1000;
    const dict = $gameVariables.value(tableVarId) || {};
    const data = dict[nodeId] || {};
    data.active = 0;
    dict[nodeId] = data;
    $gameVariables.setValue(tableVarId, dict);
  };

  /**
   * Hit Buff Calculator: usa wood_hit_chance (base + bonus) de SkillTala.
   * Var 40 = hit_chance + buff. Compara tool_lvl del hacha equipada vs tool_lvl del nodo.
   * Requiere Var 89 (nodeId), table 1000, skillId 1 para woodcutting.
   */
  window.onyxHitBuffCalculator = function(skillId, nodeId, tableVarId) {
    skillId = Number(skillId) || 1;
    tableVarId = Number(tableVarId) || 1000;
    nodeId = nodeId != null ? nodeId : $gameVariables.value(89);

    let toolLvl = 0;
    const bestTool = window.getBestPartyToolForSkill && window.getBestPartyToolForSkill(skillId);
    if (bestTool) toolLvl = bestTool.tool_lvl;

    const table = $gameVariables.value(tableVarId) || {};
    const nodeData = table[nodeId] || {};
    const nodeToolLvl = Number(nodeData.tool_lvl) || 0;

    let buff = 0;
    if (toolLvl === nodeToolLvl) buff = -3;
    else if (toolLvl > nodeToolLvl) buff = (toolLvl - nodeToolLvl) * 3;

    const hitBase = (Onyx && Onyx.Skill && Onyx.Skill.Tala && Onyx.Skill.Tala.getWoodHitChance)
      ? Onyx.Skill.Tala.getWoodHitChance() : 75;
    const final = Math.min(100, Math.max(0, hitBase + buff));
    $gameVariables.setValue(40, final);
    if (window.ONYX_SKILL_DEBUG) console.log("[Skill] HitBuffCalculator: tool_lvl=" + toolLvl + ", node_tool_lvl=" + nodeToolLvl + ", buff=" + buff + ", hitBase=" + hitBase + " -> Var40=" + final);
  };

  /**
   * Lógica de Hit Chance: usa Var 40 (wood-hit-chance) y getWoodCritChance() de SkillTala.
   * Requiere onyxHitBuffCalculator antes.
   * Var 59: 1=crit, 2=slash, 3=miss.
   * @returns {number} 59 value
   */
  window.onyxHitChance = function(showMessages, eventId) {
    const hitChance = Number($gameVariables.value(40)) || 0;
    let roll = Math.floor(Math.random() * 100) + 1;
    $gameVariables.setValue(20, roll);
    let hitType = 3; // miss

    if (window.ONYX_SKILL_DEBUG) console.log("[Skill] HitChance roll1: hitChance=" + hitChance + ", roll=" + roll + " -> " + (hitChance > roll ? "HIT" : "MISS"));

    if (hitChance > roll) {
      roll = Math.floor(Math.random() * 100) + 1;
      $gameVariables.setValue(20, roll);
      const critChance = (Onyx && Onyx.Skill && Onyx.Skill.Tala && Onyx.Skill.Tala.getWoodCritChance)
        ? Onyx.Skill.Tala.getWoodCritChance() : 10;
      if (critChance > roll) {
        if (window.ONYX_SKILL_DEBUG) console.log("[Skill] HitChance roll2 (crit): critChance=" + critChance + ", roll=" + roll + " -> CRITICO (59=1)");
        hitType = 1;
        if (showMessages && typeof showFloatingMessage === "function") {
          const eid = eventId != null ? eventId : $gameVariables.value(4);
          showFloatingMessage("Critico", 40, eid, "arriba", true);
        }
      } else {
        if (window.ONYX_SKILL_DEBUG) console.log("[Skill] HitChance roll2 (crit): critChance=" + critChance + ", roll=" + roll + " -> SLASH (59=2)");
        hitType = 2;
        if (showMessages && typeof showFloatingMessage === "function") {
          const eid = eventId != null ? eventId : $gameVariables.value(4);
          showFloatingMessage("Slash", 120, eid, "arriba", true);
        }
      }
    } else {
      if (showMessages && typeof showFloatingMessage === "function") {
        const eid = eventId != null ? eventId : $gameVariables.value(4);
        showFloatingMessage("Miss", 120, eid, "arriba", true);
      }
    }

    $gameVariables.setValue(59, hitType);
    return hitType;
  };

  /**
   * Procesa un golpe de Woodcutting (skill 1). Reemplaza el bloque Si skill-id=1 del evento.
   * Hace: get_node_info, hit chance, si hit: anim, damage, set_node_hp, drop logs, add exp.
   * Siempre enciende Switch 21 (SKILL-wait-action). Si c_hp<1 desactiva el nodo.
   * @param {object} [opts]
   * @param {number} [opts.skillId=1]
   * @param {number} [opts.nodeId] - default $gameVariables.value(89)
   * @param {number} [opts.tableVarId=1000]
   * @param {number} [opts.slashAnimId=127]
   * @param {number} [opts.waitSwitchId=21]
   * @param {number} [opts.eventId] - para animación "este evento", default Var 4
   * @param {boolean} [opts.showHitMessages=true]
   */
  window.onyxProcessWoodcuttingHit = function(opts) {
    opts = opts || {};
    const skillId = Number(opts.skillId) || 1;
    const nodeId = opts.nodeId != null ? opts.nodeId : $gameVariables.value(89);
    const tableVarId = Number(opts.tableVarId) || 1000;
    const slashAnimId = Number(opts.slashAnimId) || 127;
    const waitSwitchId = Number(opts.waitSwitchId) || 21;
    const eventId = opts.eventId != null ? opts.eventId : $gameVariables.value(4);
    const showHitMessages = opts.showHitMessages !== false;

    window.onyxGetNodeInfo(nodeId, tableVarId);
    window.onyxHitBuffCalculator();
    const hitType = window.onyxHitChance(showHitMessages, eventId);

    if (hitType === 1 || hitType === 2) {
      const target = eventId && $gameMap ? $gameMap.event(eventId) : $gamePlayer;
      if (target) target.requestAnimation(slashAnimId);
      $gameVariables.setValue(59, hitType);
      const baseDmg = window.getEquippedToolDamage(skillId);
      const dmg = hitType === 1 ? baseDmg * 2 : baseDmg;
      $gameVariables.setValue(91, dmg);
      if (window.ONYX_SKILL_DEBUG) console.log("[Skill] ProcessHit: hitType=" + hitType + " (" + (hitType === 1 ? "CRIT" : "SLASH") + "), baseDmg=" + baseDmg + ", finalDmg=" + dmg + ", nodeId=" + nodeId);
      window.onyxSetNodeHp(nodeId, dmg, tableVarId);
      const table = $gameVariables.value(tableVarId) || {};
      const nodeData = table[nodeId] || {};
      const materialId = Number(nodeData.ma_id || 0);
      const res = window.giveTreeExtraLogs($gameVariables.value(91), materialId);
      if (res.given > 0 && $dataCustom && $dataCustom.MaterialRewards) {
        const row = $dataCustom.MaterialRewards.find(function(r) { return r && r.material_id === materialId; });
        const name = row ? row.item_name : "Tronco";
        if (typeof showFloatingMessage === "function") showFloatingMessage("!Has obtenido " + name + " x" + res.given, 120);
      }
      if (Onyx && Onyx.Skill && Onyx.Skill.Tala) {
        $gameVariables.setValue(38, materialId);
        const result = Onyx.Skill.Tala.addExpFromMaterialVar();
        if (result && result.leveledUp && $gamePlayer) $gamePlayer.requestAnimation(131);
        if (result && result.added > 0 && typeof showFloatingMessage === "function") {
          showFloatingMessage("Exp +" + result.added, 120, -1, "arriba", true);
        }
      }
    }

    if (waitSwitchId > 0 && $gameSwitches) $gameSwitches.setValue(waitSwitchId, true);

    const dict = $gameVariables.value(tableVarId) || {};
    const data = dict[nodeId] || {};
    const finalHp = data.c_hp || 0;
    if (finalHp < 1) {
      if (window.ONYX_SKILL_DEBUG) console.log("[Skill] ProcessHit: nodo caído (c_hp=" + finalHp + "), set_node_off");
      window.onyxSetNodeOff(nodeId, tableVarId);
    }
  };

  /**
   * Despacha al endpoint indicado leyendo Var 100 (cmd), 89 (nodeId), 91 (damage).
   * Reemplaza el bloque condicional del CE [SKILL] Node Endpoint.
   * Uso en evento: onyxNodeEndpointFromVars();
   */
  window.onyxNodeEndpointFromVars = function() {
    const cmd = $gameVariables.value(100);
    const nodeId = $gameVariables.value(89);
    const damage = $gameVariables.value(91);
    const tableVarId = 1000;
    if (cmd === "get_node_info") {
      window.onyxGetNodeInfo(nodeId, tableVarId);
    } else if (cmd === "set_node_hp") {
      window.onyxSetNodeHp(nodeId, damage, tableVarId);
    } else if (cmd === "get_current_node_hp") {
      window.onyxGetCurrentNodeHp(nodeId, tableVarId);
    } else if (cmd === "set_node_off") {
      window.onyxSetNodeOff(nodeId, tableVarId);
    }
  };

  window.onyxFindPartyToolsBySkill = function(skillId) {
    skillId = Number(skillId) || 0;

    var toolList = null;
    if (window.$dataCustom && $dataCustom.ToolLevelList) {
      toolList = $dataCustom.ToolLevelList;
    }
    if (!toolList || !toolList.length) return [];

    var result = [];
    var members = $gameParty.members();
    var m, actor, equips, equip, toolId, i, row;

    for (m = 0; m < members.length; m++) {
      actor = members[m];
      if (!actor) continue;

      equips = actor.equips();
      if (!equips || equips.length <= 9) continue;

      equip = equips[9];          // 👈 herramienta
      if (!equip) continue;

      toolId = Number(equip.id) || 0;
      if (!toolId) continue;

      // Cruza con ToolLevelList por tool_id + skill_id
      var ok = 0;
      for (i = 0; i < toolList.length; i++) {
        row = toolList[i];
        if (row && row.tool_id == toolId && row.skill_id == skillId) {
          ok = 1;
          break;
        }
      }
      if (!ok) continue;

      // evitar duplicados
      var exists = 0;
      for (i = 0; i < result.length; i++) {
        if (result[i] == toolId) { exists = 1; break; }
      }
      if (!exists) result.push(toolId);
    }

    return result;
  };

  // Retorna true si alguna tool del listado (varToolIds) tiene tool_lvl >= node.tool_lvl del nodo actual.
  // tableVarId: variable donde está la tabla de nodos (ej 1000)
  // nodeId: id del nodo actual (ej current_node_id)
  // toolIds: array de tool_id (ej [101,105])
  window.onyxCanUseToolsOnNode = function(tableVarId, nodeId, toolIds) {
    tableVarId = Number(tableVarId) || 0;
    nodeId = Number(nodeId) || 0;
  
    if (!tableVarId || !nodeId) return false;
    if (!toolIds || !toolIds.length) return false;
  
    var table = null;
    if ($gameVariables) table = $gameVariables.value(tableVarId);
    if (!table) return false;
  
    var node = table[nodeId];
    if (!node) return false;
    if (!node.active) return false;
  
    var need = Number(node.tool_lvl) || 0;
    var skillId = Number($gameVariables.value(33)) || 0;
    if (!skillId) return false;
  
    var toolList = null;
    if (window.$dataCustom && $dataCustom.ToolLevelList) {
      toolList = $dataCustom.ToolLevelList;
    }
    if (!toolList || !toolList.length) return false;
  
    var best = 0;
    var i, j, id, row, lvl;
  
    for (i = 0; i < toolIds.length; i++) {
      id = Number(toolIds[i]) || 0;
      if (!id) continue;
  
      lvl = 0;
  
      for (j = 0; j < toolList.length; j++) {
        row = toolList[j];
        if (!row) continue;
  
        // misma herramienta + mismo skill
        if (Number(row.tool_id) === id && Number(row.skill_id) === skillId) {
          lvl = Number(row.tool_lvl) || 0;
          break;
        }
      }
  
      if (lvl > best) {
        best = lvl;
      }
    }
  
    return best >= need;
  };


  // Setea outVarId (ej 62) a 1/0 usando:
  // - tableVarId: 1000
  // - nodeIdVarId: 89
  // - toolIdsVarId: 39 (array)
  // - outVarId: 62
  window.onyxSetToolCanUseVar = function(tableVarId, nodeIdVarId, toolIdsVarId, outVarId) {
    tableVarId = Number(tableVarId) || 0;
    nodeIdVarId = Number(nodeIdVarId) || 0;
    toolIdsVarId = Number(toolIdsVarId) || 0;
    outVarId = Number(outVarId) || 0;

    if (!outVarId) return;

    var nodeId = $gameVariables.value(nodeIdVarId);
    var toolIds = $gameVariables.value(toolIdsVarId);

    var ok = window.onyxCanUseToolsOnNode(tableVarId, nodeId, toolIds);

    if (ok) $gameVariables.setValue(outVarId, 1);
    else $gameVariables.setValue(outVarId, 0);
  };

  // Setea la variable outVarId (ej 61) si el skill level cumple el requerido del nodo según SkillNodeLevelNeed.
  // Params:
  //  - tableVarId: variable con tabla de nodos (ej 1000)
  //  - nodeIdVarId: variable con current_node_id (ej 89)
  //  - skillLvlVarId: variable con el nivel del skill (ej 21 para wood-level)
  //  - outVarId: variable de salida (ej 61 node-can-harvest)
  window.onyxSetNodeCanHarvestVar = function(tableVarId, nodeIdVarId, skillLvlVarId, outVarId) {
    tableVarId = Number(tableVarId) || 0;
    nodeIdVarId = Number(nodeIdVarId) || 0;
    skillLvlVarId = Number(skillLvlVarId) || 0;
    outVarId = Number(outVarId) || 0;

    if (!outVarId) return;

    // default: no puede
    $gameVariables.setValue(outVarId, 0);
    var nodeId = $gameVariables.value(nodeIdVarId);
    if (!nodeId) return;

    var table = $gameVariables.value(tableVarId);
    if (!table) return;

    var node = table[nodeId];
    if (!node || !node.active) return;

    var skillId = Number($gameVariables.value(33)) || 0;
    var nodeLvl = Number(node.no_lvl) || 0;
    var skillLvl = Number($gameVariables.value(skillLvlVarId)) || 0;

    if (!skillId || !nodeLvl) return;

    var needList = null;
    if (window.$dataCustom && $dataCustom.SkillNodeLevelNeed) needList = $dataCustom.SkillNodeLevelNeed;
    if (!needList || !needList.length) return;

    var required = 999999;
    var i, row;

    for (i = 0; i < needList.length; i++) {
      row = needList[i];
      if (row && row.skill_id == skillId && row.node_lvl == nodeLvl) {
        required = Number(row.skill_lvl) || 0;
        break;
      }
    }

    if (skillLvl >= required) {
      $gameVariables.setValue(outVarId, 1);
    }
  };


  // Helper opcional: verificar si una data específica ya está lista
  window.isCustomDataReady = function(key) {
    return !!window.$dataCustomLoaded[key];
  };
})();

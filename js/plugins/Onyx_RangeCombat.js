/*:
 * @plugindesc (Onyx) Rango: carcaj, municion (armadura) y ataques alternativos
 * @author Onyx
 * @version 1.5.0.0
 * @orderAfter SkillRango
 * @orderAfter Onyx_CombatSkillCore
 * @orderAfter Onyx_InventorySlots
 *
 * @param etypeCarcaj
 * @text Tipo equipo: Carcaj (0=auto)
 * @type number
 * @min 0
 * @default 14
 *
 * @param etypeFlecha
 * @text Tipo equipo: flecha (0=auto)
 * @type number
 * @min 0
 * @default 29
 *
 * @param etypeVirote
 * @text Tipo equipo: virote (0=auto)
 * @type number
 * @min 0
 * @default 30
 *
 * @param etypeBala
 * @text Tipo equipo: bala (0=auto)
 * @type number
 * @min 0
 * @default 31
 *
 * @param etypeOffHand
 * @text Tipo equipo: off-hand (0=auto)
 * @type number
 * @min 0
 * @default 28
 *
 * @param rangeMeleeDamageRate
 * @text Daño melee con arma de rango (%)
 * @type number
 * @min 1
 * @max 100
 * @default 10
 *
 * @param battleAmmoHudOffsetX
 * @text HUD munición combate: offset X
 * @type number
 * @min -200
 * @max 200
 * @default 0
 *
 * @param battleAmmoHudOffsetY
 * @text HUD munición combate: offset Y
 * @type number
 * @min -200
 * @max 0
 * @default -56
 * @desc Negativo = más arriba del actor (vista frontal y lateral).
 *
 * @param battleActorBaseX
 * @text Combate: posición base X (héroe 0)
 * @type number
 * @min 0
 * @max 2000
 * @default 600
 *
 * @param battleActorBaseY
 * @text Combate: posición base Y (héroe 0)
 * @type number
 * @min 0
 * @max 2000
 * @default 280
 *
 * @param battleActorStepX
 * @text Combate: separación X entre héroes
 * @type number
 * @min 16
 * @max 256
 * @default 32
 * @desc MV por defecto usa 32. Iguala a "ancho de hueco" si quieres columnas alineadas.
 *
 * @param battleActorStepY
 * @text Combate: separación Y entre héroes
 * @type number
 * @min 0
 * @max 256
 * @default 48
 *
 * @param battleHeroSlotWidth
 * @text Combate: ancho de hueco por héroe (px)
 * @type number
 * @min 16
 * @max 256
 * @default 32
 * @desc Iconos por fila = floor(ancho / tamaño icono). Ej. 96px y iconos 32 → 3 por fila.
 *
 * @param battleHeroSlotHeight
 * @text Combate: alto de hueco por héroe (px)
 * @type number
 * @min 16
 * @max 256
 * @default 48
 *
 * @param battleHudIconSize
 * @text Combate: tamaño de icono HUD (px)
 * @type number
 * @min 16
 * @max 64
 * @default 32
 *
 * @help
 * Armas de rango (WeaponSkillTypes: range). Nota del arma: <ammo:flecha|virote|bala>.
 * Sin nota: arco->flecha, ballesta->virote, pistola->bala.
 *
 * Ranuras de equipo (por defecto en DB): 29 flecha, 30 virote, 31 bala.
 * Municion = armadura (tipo flecha / virote / bala). Al equipar en su ranura carga desde
 * el inventario hasta el tope: max(max_stack del proyectil, <max:N> del carcaj si hay).
 * En combate solo cuenta lo cargado en esa ranura (no la mochila).
 *
 * Sin municion: daga off-hand; si no, ataque melee al % configurado.
 *
 * En combate, con arma de rango equipada, icono + cantidad sobre cada actor del grupo.
 *
 * Hueco por héroe (API): Onyx.Rango.battleLayout(), heroSlotRect(i),
 * maxIconsPerRow(tamaño), maxIconsPerColumn(tamaño).
 * Por defecto MV: paso 32×48 px, hueco 32×48 → 1 icono de 32px por fila.
 * Para 3 iconos/fila con iconos 32px: battleHeroSlotWidth = 96 (y battleActorStepX = 96).
 */

(function() {
  "use strict";

  var P = PluginManager.parameters("Onyx_RangeCombat");
  var RANGE_MELEE_RATE = Math.max(0.01, Math.min(1, Number(P.rangeMeleeDamageRate || 10) / 100));
  var BATTLE_AMMO_HUD_OX = Math.floor(Number(P.battleAmmoHudOffsetX || 0));
  var BATTLE_AMMO_HUD_OY = Math.floor(Number(P.battleAmmoHudOffsetY || -56));
  var BATTLE_ACTOR_BASE_X = Math.floor(Number(P.battleActorBaseX || 600));
  var BATTLE_ACTOR_BASE_Y = Math.floor(Number(P.battleActorBaseY || 280));
  var BATTLE_ACTOR_STEP_X = Math.max(16, Math.floor(Number(P.battleActorStepX || 32)));
  var BATTLE_ACTOR_STEP_Y = Math.max(0, Math.floor(Number(P.battleActorStepY || 48)));
  var BATTLE_HERO_SLOT_W = Math.max(16, Math.floor(Number(P.battleHeroSlotWidth || 32)));
  var BATTLE_HERO_SLOT_H = Math.max(16, Math.floor(Number(P.battleHeroSlotHeight || 48)));
  var BATTLE_HUD_ICON_SIZE = Math.max(16, Math.floor(Number(P.battleHudIconSize || 32)));
  var AMMO_KINDS = ["flecha", "virote", "bala"];

  window.Onyx = window.Onyx || {};
  Onyx.Rango = Onyx.Rango || {};

  function etypeIdByName(name) {
    var types = $dataSystem && $dataSystem.equipTypes;
    if (!types) return 0;
    var key = String(name || "").toLowerCase();
    var i;
    for (i = 1; i < types.length; i++) {
      if (String(types[i] || "").toLowerCase() === key) return i;
    }
    return 0;
  }

  function resolveEtypeIds() {
    var pC = Number(P.etypeCarcaj || 0);
    var pF = Number(P.etypeFlecha || 0);
    var pV = Number(P.etypeVirote || 0);
    var pB = Number(P.etypeBala || 0);
    var pO = Number(P.etypeOffHand || 0);
    return {
      carcaj: pC > 0 ? pC : (etypeIdByName("carcaj") || 14),
      flecha: pF > 0 ? pF : (etypeIdByName("flecha") || 29),
      virote: pV > 0 ? pV : (etypeIdByName("virote") || 30),
      bala: pB > 0 ? pB : (etypeIdByName("bala") || 31),
      offHand: pO > 0 ? pO : (etypeIdByName("off-hand") || 28)
    };
  }

  function etypes() {
    if (!Onyx.Rango._etypes) Onyx.Rango._etypes = resolveEtypeIds();
    return Onyx.Rango._etypes;
  }

  function etypeForKind(kind) {
    var e = etypes();
    if (kind === "flecha") return e.flecha;
    if (kind === "virote") return e.virote;
    if (kind === "bala") return e.bala;
    return 0;
  }

  function kindFromEtype(etypeId) {
    var e = etypes();
    if (etypeId === e.flecha) return "flecha";
    if (etypeId === e.virote) return "virote";
    if (etypeId === e.bala) return "bala";
    return null;
  }

  function noteOf(item) {
    return item && item.note ? String(item.note) : "";
  }

  function equipSlots(actor) {
    return actor && actor.equipSlots ? actor.equipSlots() : [];
  }

  function slotIndexForEtype(actor, etypeId) {
    var slots = equipSlots(actor);
    var i;
    for (i = 0; i < slots.length; i++) {
      if (slots[i] === etypeId) return i;
    }
    return -1;
  }

  function mainWeapon(actor) {
    if (!actor || !actor.weapons) return null;
    var w = actor.weapons();
    return w && w.length ? w[0] : null;
  }

  function isOffHandArmor(item) {
    if (!item || !DataManager.isArmor(item)) return false;
    if (item.etypeId === etypes().offHand) return true;
    return /\[off-hand\]/i.test(noteOf(item));
  }

  function isCarcajArmor(item) {
    return item && DataManager.isArmor(item) && item.etypeId === etypes().carcaj;
  }

  function ammoKindFromArmor(item) {
    if (!item || !DataManager.isArmor(item)) return null;
    if (isOffHandArmor(item)) return null;
    return kindFromEtype(item.etypeId);
  }

  function isAmmoArmorForKind(item, kind) {
    if (!item || !kind || !DataManager.isArmor(item)) return false;
    if (isOffHandArmor(item)) return false;
    return item.etypeId === etypeForKind(kind);
  }

  function isAmmoSlotIndex(actor, slotId) {
    if (!actor || slotId < 0) return false;
    return !!kindFromEtype(equipSlots(actor)[slotId]);
  }

  function maxStackFromArmorNote(armor) {
    if (!armor) return 1;
    if (window.OnyxInv && window.OnyxInv.maxStackForItem) {
      return Math.max(1, window.OnyxInv.maxStackForItem(armor));
    }
    var m = noteOf(armor).match(/<max_stack:\s*(\d+)\s*>/i);
    if (m) return Math.max(1, Number(m[1]) || 1);
    return 1;
  }

  function carcajMaxFromNote(carcaj) {
    if (!carcaj) return 0;
    var m = noteOf(carcaj).match(/<max:\s*(\d+)\s*>/i);
    if (!m) return 0;
    return Math.max(0, Number(m[1]) || 0);
  }

  function ammoSlotCapacity(actor, armor) {
    var stackMax = maxStackFromArmorNote(armor);
    var carcaj = Onyx.Rango.equippedCarcaj(actor);
    var cMax = carcajMaxFromNote(carcaj);
    if (cMax > 0) return Math.max(stackMax, cMax);
    return stackMax;
  }

  Onyx.Rango.reloadEtypes = function() {
    Onyx.Rango._etypes = null;
    return etypes();
  };

  Onyx.Rango.hasRangeWeaponEquipped = function(actor) {
    if (window.Onyx && Onyx.CombatSkill && Onyx.CombatSkill.actorCombatType) {
      return Onyx.CombatSkill.actorCombatType(actor) === "range";
    }
    var w = mainWeapon(actor);
    if (!w) return false;
    var wt = Number(w.wtypeId) || 0;
    return wt === 7 || wt === 8 || wt === 9;
  };

  Onyx.Rango.getWeaponAmmoKind = function(weapon) {
    if (!weapon) return null;
    var m = noteOf(weapon).match(/<ammo:\s*(flecha|virote|bala)\s*>/i);
    if (m) return String(m[1]).toLowerCase();
    var wt = Number(weapon.wtypeId) || 0;
    if (wt === 7) return "flecha";
    if (wt === 8) return "virote";
    if (wt === 9) return "bala";
    return null;
  };

  Onyx.Rango.actorAmmoKind = function(actor) {
    return Onyx.Rango.getWeaponAmmoKind(mainWeapon(actor));
  };

  Onyx.Rango.isRangeOnlyEtype = function(etypeId) {
    var e = etypes();
    return etypeId === e.carcaj || etypeId === e.flecha || etypeId === e.virote || etypeId === e.bala;
  };

  Onyx.Rango.isEquipSlotVisible = function(actor, slotId) {
    if (!actor) return false;
    var et = equipSlots(actor)[slotId];
    if (!Onyx.Rango.isRangeOnlyEtype(et)) return true;
    if (!Onyx.Rango.hasRangeWeaponEquipped(actor)) return false;
    if (et === etypes().carcaj) return true;
    var need = Onyx.Rango.actorAmmoKind(actor);
    return !!(need && et === etypeForKind(need));
  };

  Onyx.Rango.visibleSlotIds = function(actor) {
    var slots = equipSlots(actor);
    var out = [];
    var i;
    for (i = 0; i < slots.length; i++) {
      if (Onyx.Rango.isEquipSlotVisible(actor, i)) out.push(i);
    }
    return out;
  };

  Onyx.Rango.ensureAmmoStock = function(actor) {
    if (!actor) return;
    if (!actor._onyxAmmoStock) actor._onyxAmmoStock = {};
  };

  Onyx.Rango.getAmmoStock = function(actor, kind) {
    if (!actor || !kind) return null;
    Onyx.Rango.ensureAmmoStock(actor);
    var s = actor._onyxAmmoStock[kind];
    if (!s || !s.armorId) return null;
    var n = Math.max(0, Math.floor(Number(s.count) || 0));
    if (n <= 0) return null;
    return { armorId: Number(s.armorId), count: n };
  };

  Onyx.Rango.setAmmoStock = function(actor, kind, armorId, count) {
    Onyx.Rango.ensureAmmoStock(actor);
    var n = Math.max(0, Math.floor(Number(count) || 0));
    if (n <= 0 || !armorId) {
      delete actor._onyxAmmoStock[kind];
      return;
    }
    actor._onyxAmmoStock[kind] = { armorId: Number(armorId), count: n };
  };

  Onyx.Rango.equippedCarcaj = function(actor) {
    if (!actor || !actor.equips) return null;
    var slot = slotIndexForEtype(actor, etypes().carcaj);
    if (slot < 0) return null;
    var item = actor.equips()[slot];
    return isCarcajArmor(item) ? item : null;
  };

  Onyx.Rango.syncAmmoEquipVisual = function(actor, kind) {
    if (!actor || !kind) return;
    var slot = slotIndexForEtype(actor, etypeForKind(kind));
    if (slot < 0) return;
    var stock = Onyx.Rango.getAmmoStock(actor, kind);
    var armor = stock ? $dataArmors[stock.armorId] : null;
    if (actor.equips()[slot] !== armor) {
      Onyx.Rango.rawForceChangeEquip(actor, slot, armor);
    }
  };

  Onyx.Rango.loadedAmmoCount = function(actor, kind) {
    var stock = Onyx.Rango.getAmmoStock(actor, kind);
    return stock ? stock.count : 0;
  };

  Onyx.Rango.equippedAmmoArmor = function(actor, kind) {
    if (!actor || !kind) return null;
    var stock = Onyx.Rango.getAmmoStock(actor, kind);
    if (stock && $dataArmors[stock.armorId]) return $dataArmors[stock.armorId];
    var slot = slotIndexForEtype(actor, etypeForKind(kind));
    if (slot < 0) return null;
    var item = actor.equips()[slot];
    return isAmmoArmorForKind(item, kind) ? item : null;
  };

  Onyx.Rango.hasAmmo = function(actor) {
    var kind = Onyx.Rango.actorAmmoKind(actor);
    return Onyx.Rango.loadedAmmoCount(actor, kind) > 0;
  };

  Onyx.Rango.battleLayout = function() {
    return {
      maxMembers: $gameParty ? $gameParty.maxBattleMembers() : 4,
      actorBaseX: BATTLE_ACTOR_BASE_X,
      actorBaseY: BATTLE_ACTOR_BASE_Y,
      actorStepX: BATTLE_ACTOR_STEP_X,
      actorStepY: BATTLE_ACTOR_STEP_Y,
      heroSlotWidth: BATTLE_HERO_SLOT_W,
      heroSlotHeight: BATTLE_HERO_SLOT_H,
      hudIconSize: BATTLE_HUD_ICON_SIZE,
      maxIconsPerRow: Onyx.Rango.maxIconsPerRow(BATTLE_HUD_ICON_SIZE),
      maxIconsPerColumn: Onyx.Rango.maxIconsPerColumn(BATTLE_HUD_ICON_SIZE)
    };
  };

  Onyx.Rango.battleActorHomePosition = function(index) {
    var i = Math.max(0, Math.floor(Number(index) || 0));
    return {
      x: BATTLE_ACTOR_BASE_X + i * BATTLE_ACTOR_STEP_X,
      y: BATTLE_ACTOR_BASE_Y + i * BATTLE_ACTOR_STEP_Y
    };
  };

  Onyx.Rango.heroSlotRect = function(index) {
    var home = Onyx.Rango.battleActorHomePosition(index);
    return {
      x: home.x - Math.floor(BATTLE_HERO_SLOT_W / 2),
      y: home.y - BATTLE_HERO_SLOT_H,
      width: BATTLE_HERO_SLOT_W,
      height: BATTLE_HERO_SLOT_H,
      centerX: home.x,
      centerY: home.y
    };
  };

  Onyx.Rango.maxIconsPerRow = function(iconSize) {
    var sz = Math.max(1, Math.floor(Number(iconSize) || BATTLE_HUD_ICON_SIZE));
    return Math.max(1, Math.floor(BATTLE_HERO_SLOT_W / sz));
  };

  Onyx.Rango.maxIconsPerColumn = function(iconSize) {
    var sz = Math.max(1, Math.floor(Number(iconSize) || BATTLE_HUD_ICON_SIZE));
    return Math.max(1, Math.floor(BATTLE_HERO_SLOT_H / sz));
  };

  Onyx.Rango.maxIconsInHeroSlot = function(iconSize) {
    return Onyx.Rango.maxIconsPerRow(iconSize) * Onyx.Rango.maxIconsPerColumn(iconSize);
  };

  Onyx.Rango.battleAmmoDisplay = function(actor) {
    if (!actor || !Onyx.Rango.hasRangeWeaponEquipped(actor)) return null;
    var kind = Onyx.Rango.actorAmmoKind(actor);
    if (!kind) return null;
    var count = Onyx.Rango.loadedAmmoCount(actor, kind);
    var armor = Onyx.Rango.equippedAmmoArmor(actor, kind);
    if (!armor) {
      var slot = slotIndexForEtype(actor, etypeForKind(kind));
      if (slot >= 0) {
        var eq = actor.equips()[slot];
        if (isAmmoArmorForKind(eq, kind)) armor = eq;
      }
    }
    return {
      count: count,
      iconIndex: armor ? armor.iconIndex : 0
    };
  };

  Onyx.Rango.isRealPartyActor = function(actor) {
    if (!actor) return false;
    var scene = SceneManager._scene;
    if (typeof Scene_Equip !== "undefined" && scene instanceof Scene_Equip && scene.actor) {
      return scene.actor() === actor;
    }
    return true;
  };

  Onyx.Rango.previewAmmoSlot = function(actor, kind, item) {
    if (!actor || !kind) return;
    var slot = slotIndexForEtype(actor, etypeForKind(kind));
    if (!item) {
      Onyx.Rango.setAmmoStock(actor, kind, 0, 0);
      if (slot >= 0) Onyx.Rango.rawForceChangeEquip(actor, slot, null);
      return;
    }
    if (!isAmmoArmorForKind(item, kind)) return;
    var preview = 0;
    var scene = SceneManager._scene;
    var real = typeof Scene_Equip !== "undefined" && scene instanceof Scene_Equip && scene.actor
      ? scene.actor() : null;
    if (real) {
      var live = Onyx.Rango.getAmmoStock(real, kind);
      if (live && live.armorId === item.id) preview = live.count;
    }
    if (preview <= 0) {
      var cap = ammoSlotCapacity(actor, item);
      preview = Math.min(cap, $gameParty.numItems(item));
    }
    if (preview > 0) {
      Onyx.Rango.setAmmoStock(actor, kind, item.id, preview);
      Onyx.Rango.syncAmmoEquipVisual(actor, kind);
    } else if (slot >= 0) {
      Onyx.Rango.setAmmoStock(actor, kind, 0, 0);
      Onyx.Rango.rawForceChangeEquip(actor, slot, null);
    }
  };

  Onyx.Rango.unloadAmmoKind = function(actor, kind, returnToParty) {
    if (!actor || !kind) return;
    if (!Onyx.Rango.isRealPartyActor(actor)) {
      Onyx.Rango.previewAmmoSlot(actor, kind, null);
      return;
    }
    var stock = Onyx.Rango.getAmmoStock(actor, kind);
    if (stock && returnToParty !== false) {
      var armor = $dataArmors[stock.armorId];
      if (armor) $gameParty.gainItem(armor, stock.count);
    }
    Onyx.Rango.setAmmoStock(actor, kind, 0, 0);
    var slot = slotIndexForEtype(actor, etypeForKind(kind));
    if (slot >= 0) Onyx.Rango.rawForceChangeEquip(actor, slot, null);
  };

  Onyx.Rango.loadAmmoFromInventory = function(actor, kind, armor) {
    if (!actor || !armor || !isAmmoArmorForKind(armor, kind)) return 0;
    if (!Onyx.Rango.isRealPartyActor(actor)) {
      Onyx.Rango.previewAmmoSlot(actor, kind, armor);
      return 0;
    }
    if (!Onyx.Rango.hasRangeWeaponEquipped(actor)) return 0;
    var current = Onyx.Rango.getAmmoStock(actor, kind);
    if (current && current.armorId !== armor.id) {
      Onyx.Rango.unloadAmmoKind(actor, kind, true);
      current = null;
    }
    var cap = ammoSlotCapacity(actor, armor);
    var have = current ? current.count : 0;
    var space = Math.max(0, cap - have);
    if (space <= 0) {
      Onyx.Rango.syncAmmoEquipVisual(actor, kind);
      return 0;
    }
    var partyN = $gameParty.numItems(armor);
    var load = Math.min(space, partyN);
    if (load <= 0) {
      if (!current) {
        var emptySlot = slotIndexForEtype(actor, etypeForKind(kind));
        if (emptySlot >= 0) Onyx.Rango.rawForceChangeEquip(actor, emptySlot, null);
      }
      return 0;
    }
    $gameParty.loseItem(armor, load);
    Onyx.Rango.setAmmoStock(actor, kind, armor.id, have + load);
    Onyx.Rango.syncAmmoEquipVisual(actor, kind);
    actor.refresh();
    return load;
  };

  Onyx.Rango.handleAmmoSlotChange = function(actor, slotId, item) {
    if (!isAmmoSlotIndex(actor, slotId)) return false;
    var kind = kindFromEtype(equipSlots(actor)[slotId]);
    if (!kind) return false;
    if (!Onyx.Rango.isRealPartyActor(actor)) {
      if (!Onyx.Rango.hasRangeWeaponEquipped(actor)) return true;
      Onyx.Rango.previewAmmoSlot(actor, kind, item);
      return true;
    }
    if (!Onyx.Rango.hasRangeWeaponEquipped(actor)) return true;
    if (!item) {
      var stock = Onyx.Rango.getAmmoStock(actor, kind);
      if (!stock && !actor.equips()[slotId]) {
        actor.refresh();
        return true;
      }
      Onyx.Rango.unloadAmmoKind(actor, kind, true);
      actor.refresh();
      return true;
    }
    if (!isAmmoArmorForKind(item, kind)) return true;
    var stock = Onyx.Rango.getAmmoStock(actor, kind);
    if (stock && stock.armorId === item.id) {
      var capFull = ammoSlotCapacity(actor, item);
      if (stock.count >= capFull) {
        Onyx.Rango.syncAmmoEquipVisual(actor, kind);
        actor.refresh();
        return true;
      }
    }
    Onyx.Rango.loadAmmoFromInventory(actor, kind, item);
    return true;
  };

  Onyx.Rango.offHandArmor = function(actor) {
    if (!actor || !actor.equips) return null;
    var slot = slotIndexForEtype(actor, etypes().offHand);
    if (slot < 0) return null;
    var item = actor.equips()[slot];
    return isOffHandArmor(item) ? item : null;
  };

  Onyx.Rango.unequipAmmoKindsExcept = function(actor, keepKind) {
    var i, k;
    for (i = 0; i < AMMO_KINDS.length; i++) {
      k = AMMO_KINDS[i];
      if (k !== keepKind) Onyx.Rango.unloadAmmoKind(actor, k, true);
    }
  };

  Onyx.Rango.clearRangeSlots = function(actor) {
    if (!actor) return;
    var e = etypes();
    var i, k;
    for (i = 0; i < AMMO_KINDS.length; i++) {
      Onyx.Rango.unloadAmmoKind(actor, AMMO_KINDS[i], true);
    }
    var slot = slotIndexForEtype(actor, e.carcaj);
    if (slot >= 0 && actor.equips()[slot]) actor.changeEquip(slot, null);
  };

  Onyx.Rango.onMainWeaponChanged = function(actor) {
    if (!actor) return;
    if (!Onyx.Rango.hasRangeWeaponEquipped(actor)) {
      Onyx.Rango.clearRangeSlots(actor);
      return;
    }
    Onyx.Rango.unequipAmmoKindsExcept(actor, Onyx.Rango.actorAmmoKind(actor));
  };

  Onyx.Rango.resolveAttackMode = function(actor) {
    if (!Onyx.Rango.hasRangeWeaponEquipped(actor)) return null;
    if (Onyx.Rango.hasAmmo(actor)) return "ranged";
    if (Onyx.Rango.offHandArmor(actor)) return "offhand";
    return "range_melee";
  };

  Onyx.Rango.prepareActorAttackMode = function(actor) {
    if (!actor) return null;
    actor._onyxRangoAttackMode = Onyx.Rango.resolveAttackMode(actor);
    return actor._onyxRangoAttackMode;
  };

  Onyx.Rango.rangeMeleeRate = function() {
    return RANGE_MELEE_RATE;
  };

  Onyx.Rango.offHandDamageFactor = function(actor) {
    var w = mainWeapon(actor);
    var rangeAtk = w ? Number(w.params[2]) || 0 : 0;
    var total = Math.max(1, actor.atk);
    return Math.max(0.05, (total - rangeAtk) / total);
  };

  Onyx.Rango.consumeAmmo = function(actor) {
    var kind = Onyx.Rango.actorAmmoKind(actor);
    if (!kind) return false;
    var stock = Onyx.Rango.getAmmoStock(actor, kind);
    if (!stock) return false;
    var next = stock.count - 1;
    if (next > 0) {
      Onyx.Rango.setAmmoStock(actor, kind, stock.armorId, next);
      Onyx.Rango.syncAmmoEquipVisual(actor, kind);
    } else {
      Onyx.Rango.unloadAmmoKind(actor, kind, false);
    }
    actor.refresh();
    return true;
  };

  Onyx.Rango.onAttackApplied = function(actor, action) {
    if (!actor || !action || !action.isAttack()) return;
    if (action._onyxRangoAmmoSpent) return;
    if (actor._onyxRangoAttackMode !== "ranged") return;
    action._onyxRangoAmmoSpent = true;
    Onyx.Rango.consumeAmmo(actor);
  };

  var _Game_Actor_initMembers_rc = Game_Actor.prototype.initMembers;
  Game_Actor.prototype.initMembers = function() {
    _Game_Actor_initMembers_rc.call(this);
    this._onyxAmmoStock = {};
  };

  // --- Equipo: municion carga pila desde inventario ---
  var _Game_Actor_changeEquip_rc = Game_Actor.prototype.changeEquip;
  Game_Actor.prototype.changeEquip = function(slotId, item) {
    if (Onyx.Rango.handleAmmoSlotChange(this, slotId, item)) {
      if (slotId === 0) Onyx.Rango.onMainWeaponChanged(this);
      return;
    }
    _Game_Actor_changeEquip_rc.call(this, slotId, item);
    if (slotId === 0) Onyx.Rango.onMainWeaponChanged(this);
  };

  var _Game_Actor_forceChangeEquip_rc = Game_Actor.prototype.forceChangeEquip;
  Game_Actor.prototype.forceChangeEquip = function(slotId, item) {
    if (Onyx.Rango.handleAmmoSlotChange(this, slotId, item)) {
      this.releaseUnequippableItems(true);
      if (slotId === 0) Onyx.Rango.onMainWeaponChanged(this);
      return;
    }
    _Game_Actor_forceChangeEquip_rc.call(this, slotId, item);
    if (slotId === 0) Onyx.Rango.onMainWeaponChanged(this);
  };

  Onyx.Rango.rawForceChangeEquip = function(actor, slotId, item) {
    _Game_Actor_forceChangeEquip_rc.call(actor, slotId, item);
  };

  function refreshVisibleSlots(win) {
    win._onyxVisibleSlotIds = win._actor ? Onyx.Rango.visibleSlotIds(win._actor) : [];
  }

  var _Window_EquipSlot_setActor = Window_EquipSlot.prototype.setActor;
  Window_EquipSlot.prototype.setActor = function(actor) {
    _Window_EquipSlot_setActor.call(this, actor);
    refreshVisibleSlots(this);
  };

  var _Window_EquipSlot_refresh = Window_EquipSlot.prototype.refresh;
  Window_EquipSlot.prototype.refresh = function() {
    refreshVisibleSlots(this);
    _Window_EquipSlot_refresh.call(this);
  };

  Window_EquipSlot.prototype.onyxRealSlotId = function() {
    var ids = this._onyxVisibleSlotIds;
    if (!ids || !ids.length) return 0;
    var idx = this.index();
    if (idx < 0) idx = 0;
    if (idx >= ids.length) idx = ids.length - 1;
    return ids[idx];
  };

  var _Window_EquipSlot_maxItems_rc = Window_EquipSlot.prototype.maxItems;
  Window_EquipSlot.prototype.maxItems = function() {
    if (this._actor) return Onyx.Rango.visibleSlotIds(this._actor).length;
    return _Window_EquipSlot_maxItems_rc.call(this);
  };

  Window_EquipSlot.prototype.item = function() {
    if (!this._actor) return null;
    return this._actor.equips()[this.onyxRealSlotId()];
  };

  Window_EquipSlot.prototype.drawItem = function(index) {
    if (!this._actor) return;
    var slotId = this._onyxVisibleSlotIds ? this._onyxVisibleSlotIds[index] : index;
    var rect = this.itemRectForText(index);
    this.changeTextColor(this.systemColor());
    this.changePaintOpacity(this.isEnabled(index));
    this.drawText(this.slotName(index), rect.x, rect.y, 138, this.lineHeight());
    var kind = kindFromEtype(this._actor.equipSlots()[slotId]);
    if (kind && Onyx.Rango.drawAmmoSlotLine.call(this, this._actor, kind, rect.x + 138, rect.y, rect.width - 138)) {
      this.changePaintOpacity(true);
      return;
    }
    this.drawItemName(this._actor.equips()[slotId], rect.x + 138, rect.y);
    this.changePaintOpacity(true);
  };

  Onyx.Rango.drawAmmoSlotLine = function(actor, kind, x, y, width) {
    var stock = Onyx.Rango.getAmmoStock(actor, kind);
    if (!stock) return false;
    var armor = $dataArmors[stock.armorId];
    if (!armor) return false;
    this.drawItemName(armor, x, y, width - 64);
    this.changeTextColor(this.normalColor());
    this.drawText("x" + stock.count, x + width - 64, y, 64, "right");
    return true;
  };

  Window_EquipSlot.prototype.slotName = function(index) {
    if (!this._actor) return "";
    var slots = this._actor.equipSlots();
    var slotId = this._onyxVisibleSlotIds ? this._onyxVisibleSlotIds[index] : index;
    return $dataSystem.equipTypes[slots[slotId]] || "";
  };

  Window_EquipSlot.prototype.isEnabled = function(index) {
    if (!this._actor) return false;
    var slotId = this._onyxVisibleSlotIds ? this._onyxVisibleSlotIds[index] : index;
    return this._actor.isEquipChangeOk(slotId);
  };

  var _Window_EquipSlot_update = Window_EquipSlot.prototype.update;
  Window_EquipSlot.prototype.update = function() {
    _Window_EquipSlot_update.call(this);
    if (this._itemWindow && this._itemWindow.setSlotId) {
      this._itemWindow.setSlotId(this.onyxRealSlotId());
    }
  };

  var _Scene_Equip_onItemOk = Scene_Equip.prototype.onItemOk;
  Scene_Equip.prototype.onItemOk = function() {
    SoundManager.playEquip();
    this.actor().changeEquip(this._slotWindow.onyxRealSlotId(), this._itemWindow.item());
    this._slotWindow.activate();
    this._slotWindow.refresh();
    this._itemWindow.deselect();
    this._itemWindow.refresh();
    this._statusWindow.refresh();
  };

  var _Game_BattlerBase_canEquip_rc = Game_BattlerBase.prototype.canEquip;
  Game_BattlerBase.prototype.canEquip = function(item) {
    if (!_Game_BattlerBase_canEquip_rc.call(this, item)) return false;
    if (!item || !DataManager.isArmor(item)) return true;
    if (!Onyx.Rango.hasRangeWeaponEquipped(this)) {
      if (isCarcajArmor(item)) return false;
      if (ammoKindFromArmor(item)) return false;
    }
    return true;
  };

  var _Window_EquipItem_includes = Window_EquipItem.prototype.includes;
  Window_EquipItem.prototype.includes = function(item) {
    if (!_Window_EquipItem_includes.call(this, item)) return false;
    if (!this._actor || item === null) return true;
    var kind = kindFromEtype(this._actor.equipSlots()[this._slotId]);
    if (kind && item) return isAmmoArmorForKind(item, kind);
    return true;
  };

  // Vista previa de equipo: no tocar inventario real (MV usa copia del actor en updateHelp).
  var _Window_EquipItem_updateHelp = Window_EquipItem.prototype.updateHelp;
  Window_EquipItem.prototype.updateHelp = function() {
    Window_ItemList.prototype.updateHelp.call(this);
    if (!this._actor || !this._statusWindow) return;
    var kind = kindFromEtype(this._actor.equipSlots()[this._slotId]);
    if (!kind) {
      _Window_EquipItem_updateHelp.call(this);
      return;
    }
    var actor = JsonEx.makeDeepCopy(this._actor);
    Onyx.Rango.previewAmmoSlot(actor, kind, this.item());
    this._statusWindow.setTempActor(actor);
  };

  var _Sprite_Actor_setActorHome = Sprite_Actor.prototype.setActorHome;
  Sprite_Actor.prototype.setActorHome = function(index) {
    var pos = Onyx.Rango.battleActorHomePosition(index);
    this.setHome(pos.x, pos.y);
  };

  // --- HUD munición en combate (sobre el actor; funciona en vista frontal) ---
  function Sprite_OnyxBattleAmmoHud() {
    this.initialize.apply(this, arguments);
  }

  Sprite_OnyxBattleAmmoHud.prototype = Object.create(Sprite.prototype);
  Sprite_OnyxBattleAmmoHud.prototype.constructor = Sprite_OnyxBattleAmmoHud;

  Sprite_OnyxBattleAmmoHud.prototype.initialize = function() {
    Sprite.prototype.initialize.call(this);
    this.anchor.x = 0.5;
    this.anchor.y = 1;
    this._actor = null;
    this._anchor = null;
    this._displayKey = "";
    this._iconW = BATTLE_HUD_ICON_SIZE;
    this._iconH = BATTLE_HUD_ICON_SIZE;
    this._slotW = BATTLE_HERO_SLOT_W;
    var bw = this._slotW;
    var bh = Math.max(this._iconH + 20, 24);
    this._panel = new Sprite(new Bitmap(bw, bh));
    this._panel.bitmap.fillRect(0, 0, bw, bh, "rgba(0,0,0,0.55)");
    this.addChild(this._panel);
    this._iconSprite = new Sprite();
    this._iconSprite.x = Math.floor((bw - this._iconW) / 2);
    this._iconSprite.y = 2;
    this.addChild(this._iconSprite);
    this._countSprite = new Sprite(new Bitmap(bw, 18));
    this._countSprite.x = 0;
    this._countSprite.y = this._iconH + 4;
    this.addChild(this._countSprite);
    this.visible = false;
  };

  Sprite_OnyxBattleAmmoHud.prototype.setBattler = function(actor, anchorSprite) {
    this._actor = actor;
    this._anchor = anchorSprite;
  };

  Sprite_OnyxBattleAmmoHud.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if (!$gameParty.inBattle() || !this._actor || !this._anchor) {
      this.visible = false;
      return;
    }
    if (!this._actor.isBattleMember() || !this._actor.isAlive()) {
      this.visible = false;
      return;
    }
    var info = Onyx.Rango.battleAmmoDisplay(this._actor);
    if (!info) {
      this.visible = false;
      return;
    }
    var key = info.iconIndex + ":" + info.count;
    if (key !== this._displayKey) {
      this._displayKey = key;
      this.refreshPanel(info.iconIndex, info.count);
    }
    this.x = this._anchor.x + BATTLE_AMMO_HUD_OX;
    this.y = this._anchor.y + BATTLE_AMMO_HUD_OY;
    this.visible = true;
  };

  Sprite_OnyxBattleAmmoHud.prototype.refreshPanel = function(iconIndex, count) {
    var iconBmp = ImageManager.loadSystem("IconSet");
    var pw = this._iconW;
    var ph = this._iconH;
    var sx = (iconIndex % 16) * pw;
    var sy = Math.floor(iconIndex / 16) * ph;
    this._iconSprite.bitmap = new Bitmap(pw, ph);
    if (iconBmp && iconBmp.isReady()) {
      this._iconSprite.bitmap.blt(iconBmp, sx, sy, pw, ph, 0, 0);
    } else if (iconBmp) {
      iconBmp.addLoadListener(this.refreshPanel.bind(this, iconIndex, count));
    }
    var cb = this._countSprite.bitmap;
    cb.clear();
    cb.fontSize = 16;
    cb.textColor = "#ffffff";
    cb.outlineColor = "black";
    cb.outlineWidth = 3;
    cb.drawText("x" + count, 0, 0, this._slotW, 18, "center");
  };

  var _Spriteset_Battle_createLowerLayer = Spriteset_Battle.prototype.createLowerLayer;
  Spriteset_Battle.prototype.createLowerLayer = function() {
    _Spriteset_Battle_createLowerLayer.call(this);
    this.createOnyxAmmoHuds();
  };

  Spriteset_Battle.prototype.createOnyxAmmoHuds = function() {
    this._onyxAmmoHudSprites = [];
    var i, hud;
    for (i = 0; i < $gameParty.maxBattleMembers(); i++) {
      hud = new Sprite_OnyxBattleAmmoHud();
      hud.z = 8;
      this._battleField.addChild(hud);
      this._onyxAmmoHudSprites.push(hud);
    }
  };

  var _Spriteset_Battle_update = Spriteset_Battle.prototype.update;
  Spriteset_Battle.prototype.update = function() {
    _Spriteset_Battle_update.call(this);
    this.updateOnyxAmmoHuds();
  };

  Spriteset_Battle.prototype.updateOnyxAmmoHuds = function() {
    if (!this._onyxAmmoHudSprites) return;
    var i;
    for (i = 0; i < this._onyxAmmoHudSprites.length; i++) {
      this._onyxAmmoHudSprites[i].setBattler(
        $gameParty.battleMembers()[i],
        this._actorSprites[i]
      );
    }
  };

  // --- Combate ---
  var _BattleManager_invokeAction = BattleManager.invokeAction;
  BattleManager.invokeAction = function(subject, target) {
    if (subject && subject.isActor && subject.isActor()) {
      Onyx.Rango.prepareActorAttackMode(subject);
    }
    _BattleManager_invokeAction.call(this, subject, target);
  };

  var _Game_Action_makeDamageValue = Game_Action.prototype.makeDamageValue;
  Game_Action.prototype.makeDamageValue = function(target, critical) {
    var value = _Game_Action_makeDamageValue.call(this, target, critical);
    var subj = this.subject();
    if (!this.isAttack() || !subj || !subj.isActor || !subj.isActor()) return value;
    var mode = subj._onyxRangoAttackMode;
    if (mode === "range_melee") {
      return Math.max(1, Math.floor(value * Onyx.Rango.rangeMeleeRate()));
    }
    if (mode === "offhand") {
      return Math.max(1, Math.floor(value * Onyx.Rango.offHandDamageFactor(subj)));
    }
    return value;
  };

  var _Game_Action_apply = Game_Action.prototype.apply;
  Game_Action.prototype.apply = function(target) {
    _Game_Action_apply.call(this, target);
    var subj = this.subject();
    if (subj && subj.isActor && subj.isActor()) {
      Onyx.Rango.onAttackApplied(subj, this);
    }
  };

  Onyx.Rango.hasBowEquipped = Onyx.Rango.hasRangeWeaponEquipped;
  Onyx.Rango.bowMeleeRate = Onyx.Rango.rangeMeleeRate;

})();

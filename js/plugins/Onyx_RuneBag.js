/*:
 * @plugindesc (Onyx) Bolsa de runas + requisitos de magia (inventario y banco)
 * @author Onyx
 * @version 1.0.0.0
 * @orderAfter Onyx_InventorySlots
 * @orderAfter Onyx_Bank
 *
 * @param runeIdMin
 * @text ID mínimo de runa (ítem)
 * @type number
 * @min 1
 * @default 400
 *
 * @param runeIdMax
 * @text ID máximo de runa (ítem)
 * @type number
 * @min 1
 * @default 409
 *
 * @param emptyBagHoldFrames
 * @text Frames manteniendo OK para vaciar bolsa
 * @type number
 * @min 60
 * @default 240
 * @desc 240 ≈ 4 s a 60 FPS.
 *
 * @help
 * Bolsa de runas (ítem, no equipable). Notas en el ítem bolsa:
 *   <max:100>   capacidad total de runas en la bolsa
 *   <rune:4>    tipos distintos de runa (slots internos)
 *
 * Runas: ítems con ID entre runeIdMin y runeIdMax (por defecto 400-409).
 *
 * Inventario:
 * - Con la bolsa seleccionada aparecen 4 slots de runas debajo del oro.
 * - OK en la bolsa: modo depósito (solo runas activas; resto atenuado).
 * - OK en runa: guarda hasta llenar la bolsa desde todo el inventario.
 * - 4 tipos llenos + runa nueva: elige slot interno a reemplazar.
 * - Mantener OK ~4 s con la bolsa seleccionada: vacía runas al inventario.
 *
 * Banco: al depositar la bolsa, las runas van al banco; si no caben, al inventario;
 * solo se guarda la bolsa vacía. Si no cabe la bolsa o las runas, no deposita.
 *
 * Magia (API): nota en habilidad <runes:[401:1,402:2]>
 *   Onyx.RuneBag.parseSkillRunes(skill)
 *   Onyx.RuneBag.actorCanCastSkill(actor, skill, bagInvSlot)
 *
 * Las bolsas se identifican por slot de inventario (al mover con R, los datos se mueven).
 */

(function() {
  "use strict";

  var P = PluginManager.parameters("Onyx_RuneBag");
  var RUNE_ID_MIN = Math.max(1, Math.floor(Number(P.runeIdMin || 400)));
  var RUNE_ID_MAX = Math.max(RUNE_ID_MIN, Math.floor(Number(P.runeIdMax || 409)));
  var EMPTY_HOLD_FRAMES = Math.max(30, Math.floor(Number(P.emptyBagHoldFrames || 240)));

  window.Onyx = window.Onyx || {};
  Onyx.RuneBag = Onyx.RuneBag || {};

  function noteOf(obj) {
    return obj && obj.note ? String(obj.note) : "";
  }

  function invSlotObject(slot) {
    if (!slot) return null;
    var id = Number(slot.id) || 0;
    if (slot.kind === "item") return $dataItems && $dataItems[id];
    if (slot.kind === "weapon") return $dataWeapons && $dataWeapons[id];
    if (slot.kind === "armor") return $dataArmors && $dataArmors[id];
    return null;
  }

  function ensurePartyBags() {
    if (!$gameParty._onyxRuneBags) $gameParty._onyxRuneBags = {};
  }

  function bagKey(invSlotIndex) {
    return String(Math.floor(Number(invSlotIndex) || 0));
  }

  Onyx.RuneBag.maxIconsPerRow = function(iconSize, panelWidth) {
    var w = Math.max(16, Math.floor(Number(panelWidth) || 192));
    var sz = Math.max(1, Math.floor(Number(iconSize) || 32));
    return Math.max(1, Math.floor(w / sz));
  };

  Onyx.RuneBag.isRuneItem = function(item) {
    if (!item || !DataManager.isItem(item)) return false;
    var id = Number(item.id) || 0;
    return id >= RUNE_ID_MIN && id <= RUNE_ID_MAX;
  };

  Onyx.RuneBag.isRuneBagItem = function(item) {
    if (!item || !DataManager.isItem(item)) return false;
    return /<rune:\s*\d+\s*>/i.test(noteOf(item));
  };

  Onyx.RuneBag.parseBagMeta = function(item) {
    if (!Onyx.RuneBag.isRuneBagItem(item)) return null;
    var note = noteOf(item);
    var mMax = note.match(/<max:\s*(\d+)\s*>/i);
    var mSlots = note.match(/<rune:\s*(\d+)\s*>/i);
    return {
      maxCapacity: mMax ? Math.max(1, Number(mMax[1]) || 1) : 100,
      typeSlots: mSlots ? Math.max(1, Math.min(8, Number(mSlots[1]) || 4)) : 4
    };
  };

  Onyx.RuneBag.ensureBagData = function(invSlotIndex, item) {
    ensurePartyBags();
    var key = bagKey(invSlotIndex);
    var meta = Onyx.RuneBag.parseBagMeta(item);
    if (!meta) return null;
    var data = $gameParty._onyxRuneBags[key];
    if (!data || data.typeSlots !== meta.typeSlots || data.maxCapacity !== meta.maxCapacity) {
      var runes = [];
      var i;
      for (i = 0; i < meta.typeSlots; i++) runes.push(null);
      if (data && data.runes) {
        for (i = 0; i < Math.min(meta.typeSlots, data.runes.length); i++) {
          runes[i] = data.runes[i] ? { itemId: data.runes[i].itemId, count: data.runes[i].count } : null;
        }
      }
      data = { maxCapacity: meta.maxCapacity, typeSlots: meta.typeSlots, runes: runes };
      $gameParty._onyxRuneBags[key] = data;
    }
    return data;
  };

  Onyx.RuneBag.getBagData = function(invSlotIndex) {
    var slots = window.OnyxInv && window.OnyxInv.slots ? window.OnyxInv.slots() : null;
    if (!slots) return null;
    var s = slots[invSlotIndex];
    if (!s || s.kind !== "item") return null;
    var item = $dataItems[Number(s.id)];
    if (!Onyx.RuneBag.isRuneBagItem(item)) return null;
    return Onyx.RuneBag.ensureBagData(invSlotIndex, item);
  };

  Onyx.RuneBag.totalRunesInBag = function(data) {
    if (!data || !data.runes) return 0;
    var sum = 0;
    var i;
    for (i = 0; i < data.runes.length; i++) {
      if (data.runes[i]) sum += Math.max(0, Number(data.runes[i].count) || 0);
    }
    return sum;
  };

  Onyx.RuneBag.freeCapacity = function(data) {
    if (!data) return 0;
    return Math.max(0, data.maxCapacity - Onyx.RuneBag.totalRunesInBag(data));
  };

  Onyx.RuneBag.findRuneSlotIndex = function(data, itemId) {
    if (!data || !data.runes) return -1;
    var id = Number(itemId) || 0;
    var i;
    for (i = 0; i < data.runes.length; i++) {
      var r = data.runes[i];
      if (r && Number(r.itemId) === id) return i;
    }
    return -1;
  };

  Onyx.RuneBag.firstEmptyRuneSlot = function(data) {
    if (!data || !data.runes) return -1;
    var i;
    for (i = 0; i < data.runes.length; i++) {
      if (!data.runes[i] || !(Number(data.runes[i].count) > 0)) return i;
    }
    return -1;
  };

  Onyx.RuneBag.occupiedTypeCount = function(data) {
    if (!data || !data.runes) return 0;
    var n = 0;
    var i;
    for (i = 0; i < data.runes.length; i++) {
      if (data.runes[i] && Number(data.runes[i].count) > 0) n++;
    }
    return n;
  };

  Onyx.RuneBag.removeFromPartyInventory = function(itemId, amount) {
    var item = $dataItems[Number(itemId)];
    if (!item || amount <= 0) return 0;
    var before = $gameParty.numItems(item);
    $gameParty.loseItem(item, amount, false);
    return Math.max(0, before - $gameParty.numItems(item));
  };

  Onyx.RuneBag.addToPartyInventory = function(itemId, amount) {
    var item = $dataItems[Number(itemId)];
    if (!item || amount <= 0) return 0;
    var before = $gameParty.numItems(item);
    $gameParty.gainItem(item, amount, false);
    return Math.max(0, $gameParty.numItems(item) - before);
  };

  Onyx.RuneBag.depositRune = function(invSlotIndex, runeItemId) {
    var data = Onyx.RuneBag.getBagData(invSlotIndex);
    if (!data || !Onyx.RuneBag.isRuneItem($dataItems[runeItemId])) return 0;

    var free = Onyx.RuneBag.freeCapacity(data);
    if (free <= 0) return 0;

    var partyHave = $gameParty.numItems($dataItems[runeItemId]);
    var toTake = Math.min(free, partyHave);
    if (toTake <= 0) return 0;

    var removed = Onyx.RuneBag.removeFromPartyInventory(runeItemId, toTake);
    if (removed <= 0) return 0;

    var slotIdx = Onyx.RuneBag.findRuneSlotIndex(data, runeItemId);
    if (slotIdx < 0) slotIdx = Onyx.RuneBag.firstEmptyRuneSlot(data);
    if (slotIdx < 0) {
      Onyx.RuneBag.addToPartyInventory(runeItemId, removed);
      return 0;
    }

    if (!data.runes[slotIdx] || !(Number(data.runes[slotIdx].count) > 0)) {
      data.runes[slotIdx] = { itemId: Number(runeItemId), count: removed };
    } else {
      data.runes[slotIdx].count = Number(data.runes[slotIdx].count) + removed;
    }
    return removed;
  };

  Onyx.RuneBag.replaceRuneSlot = function(invSlotIndex, bagSlotIndex, runeItemId) {
    var data = Onyx.RuneBag.getBagData(invSlotIndex);
    if (!data || !Onyx.RuneBag.isRuneItem($dataItems[runeItemId])) return 0;
    bagSlotIndex = Math.floor(Number(bagSlotIndex) || 0);
    if (bagSlotIndex < 0 || bagSlotIndex >= data.runes.length) return 0;

    var old = data.runes[bagSlotIndex];
    if (old && Number(old.count) > 0) {
      Onyx.RuneBag.addToPartyInventory(old.itemId, old.count);
    }
    data.runes[bagSlotIndex] = null;

    var free = Onyx.RuneBag.freeCapacity(data);
    if (free <= 0) return 0;

    var partyHave = $gameParty.numItems($dataItems[runeItemId]);
    var toTake = Math.min(free, partyHave);
    if (toTake <= 0) return 0;

    var removed = Onyx.RuneBag.removeFromPartyInventory(runeItemId, toTake);
    if (removed <= 0) return 0;

    data.runes[bagSlotIndex] = { itemId: Number(runeItemId), count: removed };
    return removed;
  };

  Onyx.RuneBag.emptyBagToInventory = function(invSlotIndex) {
    var data = Onyx.RuneBag.getBagData(invSlotIndex);
    if (!data) return 0;
    var moved = 0;
    var i, r, added;
    for (i = 0; i < data.runes.length; i++) {
      r = data.runes[i];
      if (!r || !(Number(r.count) > 0)) {
        data.runes[i] = null;
        continue;
      }
      added = Onyx.RuneBag.addToPartyInventory(r.itemId, r.count);
      if (added > 0) {
        r.count = Number(r.count) - added;
        moved += added;
      }
      if (Number(r.count) <= 0) data.runes[i] = null;
    }
    return moved;
  };

  Onyx.RuneBag.emptyBagToBankThenInventory = function(invSlotIndex) {
    var data = Onyx.RuneBag.getBagData(invSlotIndex);
    if (!data) return { ok: false, reason: "no_bag" };
    var bankApi = window.OnyxBank;
    var left = [];
    var i, r, toBank, toInv, addedB, addedI;
    for (i = 0; i < data.runes.length; i++) {
      r = data.runes[i];
      if (!r || !(Number(r.count) > 0)) {
        data.runes[i] = null;
        continue;
      }
      toBank = Number(r.count) || 0;
      if (bankApi && bankApi.addItemStack) {
        addedB = bankApi.addItemStack(r.itemId, toBank);
        toBank -= addedB;
        r.count = toBank;
      }
      if (toBank > 0) {
        addedI = Onyx.RuneBag.addToPartyInventory(r.itemId, toBank);
        r.count = toBank - addedI;
      }
      if (Number(r.count) > 0) left.push({ itemId: r.itemId, count: r.count });
      if (Number(r.count) <= 0) data.runes[i] = null;
    }
    if (left.length > 0) return { ok: false, reason: "runes_no_space", left: left };
    return { ok: true };
  };

  Onyx.RuneBag.tryDepositBagSlotToBank = function(invSlotIndex) {
    var slots = window.OnyxInv.slots();
    var s = slots[invSlotIndex];
    if (!s || s.kind !== "item") return false;
    var bagItem = $dataItems[Number(s.id)];
    if (!Onyx.RuneBag.isRuneBagItem(bagItem)) return false;

    var emptyResult = Onyx.RuneBag.emptyBagToBankThenInventory(invSlotIndex);
    if (!emptyResult.ok) {
      if ($gameMessage) $gameMessage.add("No hay espacio para guardar las runas de la bolsa.");
      return true;
    }

    var bankApi = window.OnyxBank;
    if (!bankApi || !bankApi.canAddItemStack) return false;

    var canBag = bankApi.canAddItemStack(bagItem.id, 1);
    if (canBag < 1 && !bankApi.hasEmptyItemSlot()) {
      if ($gameMessage) $gameMessage.add("No hay espacio en el banco para la bolsa.");
      return true;
    }

    var added = bankApi.addItemStack(bagItem.id, 1);
    if (added < 1) {
      if ($gameMessage) $gameMessage.add("No se pudo guardar la bolsa en el banco.");
      return true;
    }

    if (window.OnyxInv && window.OnyxInv.clearSlot) {
      Onyx.RuneBag.deleteBagData(invSlotIndex);
      window.OnyxInv.clearSlot(invSlotIndex);
    }
    return true;
  };

  Onyx.RuneBag.deleteBagData = function(invSlotIndex) {
    ensurePartyBags();
    delete $gameParty._onyxRuneBags[bagKey(invSlotIndex)];
  };

  Onyx.RuneBag.swapBagData = function(invA, invB) {
    ensurePartyBags();
    var ka = bagKey(invA);
    var kb = bagKey(invB);
    var tmp = $gameParty._onyxRuneBags[ka];
    $gameParty._onyxRuneBags[ka] = $gameParty._onyxRuneBags[kb];
    $gameParty._onyxRuneBags[kb] = tmp;
  };

  Onyx.RuneBag.parseSkillRunes = function(skill) {
    if (!skill || !skill.note) return [];
    var m = String(skill.note).match(/<runes:\s*\[([^\]]+)\]\s*>/i);
    if (!m) return [];
    var parts = String(m[1]).split(",");
    var out = [];
    var i, p, pair, id, qty;
    for (i = 0; i < parts.length; i++) {
      p = parts[i].trim();
      if (!p) continue;
      pair = p.split(":");
      id = Number(pair[0]) || 0;
      qty = Math.max(1, Math.floor(Number(pair[1]) || 1));
      if (id > 0) out.push({ itemId: id, count: qty });
    }
    return out;
  };

  Onyx.RuneBag.bagHasRunes = function(data, requirements) {
    if (!data || !requirements || !requirements.length) return true;
    var i, req, idx, have;
    for (i = 0; i < requirements.length; i++) {
      req = requirements[i];
      idx = Onyx.RuneBag.findRuneSlotIndex(data, req.itemId);
      if (idx < 0) return false;
      have = Number(data.runes[idx].count) || 0;
      if (have < req.count) return false;
    }
    return true;
  };

  Onyx.RuneBag.actorCanCastSkill = function(actor, skill, bagInvSlot) {
    if (!actor || !skill) return false;
    var reqs = Onyx.RuneBag.parseSkillRunes(skill);
    if (!reqs.length) return true;
    if (bagInvSlot == null || bagInvSlot < 0) return false;
    var data = Onyx.RuneBag.getBagData(bagInvSlot);
    return Onyx.RuneBag.bagHasRunes(data, reqs);
  };

  // --- Estado UI inventario ---
  Onyx.RuneBag.uiState = function() {
    if (!$gameTemp._onyxRuneBagUi) $gameTemp._onyxRuneBagUi = {};
    return $gameTemp._onyxRuneBagUi;
  };

  Onyx.RuneBag.clearUiState = function() {
    $gameTemp._onyxRuneBagUi = null;
  };

  Onyx.RuneBag.isDepositMode = function() {
    var st = Onyx.RuneBag.uiState();
    return !!(st && st.depositMode);
  };

  Onyx.RuneBag.activeBagInvSlot = function() {
    var st = Onyx.RuneBag.uiState();
    return st && st.bagInvSlot != null ? Number(st.bagInvSlot) : -1;
  };

  Onyx.RuneBag.setActiveBag = function(invSlotIndex) {
    var st = Onyx.RuneBag.uiState();
    st.bagInvSlot = invSlotIndex;
    if (invSlotIndex < 0) {
      st.depositMode = false;
      st.replaceRuneId = 0;
      st.holdStartFrame = 0;
    }
  };

  Onyx.RuneBag.enterDepositMode = function(invSlotIndex) {
    var st = Onyx.RuneBag.uiState();
    st.bagInvSlot = invSlotIndex;
    st.depositMode = true;
    st.replaceRuneId = 0;
    SoundManager.playEquip();
  };

  Onyx.RuneBag.exitDepositMode = function() {
    var st = Onyx.RuneBag.uiState();
    st.depositMode = false;
    st.replaceRuneId = 0;
    st.holdStartFrame = 0;
  };

  Onyx.RuneBag.onInventoryOk = function(slotsWindow) {
    var idx = slotsWindow.index();
    var slots = window.OnyxInv.slots();
    var s = slots[idx];
    var obj = invSlotObject(s);
    var st = Onyx.RuneBag.uiState();

    if (st.replaceRuneId > 0) {
      SoundManager.playBuzzer();
      return true;
    }

    if (Onyx.RuneBag.isDepositMode()) {
      if (!obj || !Onyx.RuneBag.isRuneItem(obj)) {
        Onyx.RuneBag.exitDepositMode();
        SoundManager.playCancel();
        return true;
      }
      var bagSlot = Onyx.RuneBag.activeBagInvSlot();
      var data = Onyx.RuneBag.getBagData(bagSlot);
      if (!data) {
        Onyx.RuneBag.exitDepositMode();
        return true;
      }
      var existing = Onyx.RuneBag.findRuneSlotIndex(data, obj.id);
      if (existing >= 0) {
        var n = Onyx.RuneBag.depositRune(bagSlot, obj.id);
        if (n > 0) SoundManager.playOk();
        else SoundManager.playBuzzer();
        slotsWindow.refresh();
        if (SceneManager._scene._runeBagWindow) SceneManager._scene._runeBagWindow.refresh();
        return true;
      }
      if (Onyx.RuneBag.occupiedTypeCount(data) >= data.typeSlots) {
        st.replaceRuneId = obj.id;
        if ($gameMessage) $gameMessage.add("Elige un slot de la bolsa para reemplazar.");
        SoundManager.playCursor();
        return true;
      }
      var added = Onyx.RuneBag.depositRune(bagSlot, obj.id);
      if (added > 0) SoundManager.playOk();
      else SoundManager.playBuzzer();
      slotsWindow.refresh();
      if (SceneManager._scene._runeBagWindow) SceneManager._scene._runeBagWindow.refresh();
      return true;
    }

    if (obj && Onyx.RuneBag.isRuneBagItem(obj)) {
      Onyx.RuneBag.setActiveBag(idx);
      Onyx.RuneBag.enterDepositMode(idx);
      if (SceneManager._scene._runeBagWindow) {
        SceneManager._scene._runeBagWindow.setBagInvSlot(idx);
        SceneManager._scene._runeBagWindow.refresh();
      }
      slotsWindow.refresh();
      return true;
    }

    Onyx.RuneBag.setActiveBag(-1);
    Onyx.RuneBag.exitDepositMode();
    if (SceneManager._scene._runeBagWindow) {
      SceneManager._scene._runeBagWindow.setBagInvSlot(-1);
      SceneManager._scene._runeBagWindow.refresh();
    }
    slotsWindow.refresh();
    return false;
  };

  Onyx.RuneBag.onRuneBagSlotOk = function(runeWindow) {
    var st = Onyx.RuneBag.uiState();
    var bagSlot = Onyx.RuneBag.activeBagInvSlot();
    if (bagSlot < 0) return;

    if (st.replaceRuneId > 0) {
      var n = Onyx.RuneBag.replaceRuneSlot(bagSlot, runeWindow.index(), st.replaceRuneId);
      st.replaceRuneId = 0;
      if (n > 0) SoundManager.playOk();
      else SoundManager.playBuzzer();
      runeWindow.refresh();
      if (SceneManager._scene._slotsWindow) SceneManager._scene._slotsWindow.refresh();
      return;
    }

    if (Onyx.RuneBag.isDepositMode()) {
      Onyx.RuneBag.exitDepositMode();
      SoundManager.playCancel();
      if (SceneManager._scene._slotsWindow) SceneManager._scene._slotsWindow.refresh();
    }
  };

  Onyx.RuneBag.shouldDimInventorySlot = function(slot) {
    if (!Onyx.RuneBag.isDepositMode()) return false;
    var obj = invSlotObject(slot);
    return !obj || !Onyx.RuneBag.isRuneItem(obj);
  };

  Onyx.RuneBag.updateHoldEmpty = function(scene) {
    var bagSlot = Onyx.RuneBag.activeBagInvSlot();
    if (bagSlot < 0 || !scene._slotsWindow) return;
    if (scene._slotsWindow.index() !== bagSlot) {
      Onyx.RuneBag.uiState().holdStartFrame = 0;
      return;
    }
    if (!Input.isPressed("ok")) {
      Onyx.RuneBag.uiState().holdStartFrame = 0;
      return;
    }
    var st = Onyx.RuneBag.uiState();
    if (!st.holdStartFrame) st.holdStartFrame = Graphics.frameCount;
    if (Graphics.frameCount - st.holdStartFrame >= EMPTY_HOLD_FRAMES) {
      st.holdStartFrame = 0;
      Onyx.RuneBag.emptyBagToInventory(bagSlot);
      Onyx.RuneBag.exitDepositMode();
      SoundManager.playEquip();
      scene._slotsWindow.refresh();
      if (scene._runeBagWindow) scene._runeBagWindow.refresh();
    }
  };

  // --- Ventana 4 slots runas ---
  function Window_OnyxInvRuneBagSlots(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }

  Window_OnyxInvRuneBagSlots.prototype = Object.create(Window_Selectable.prototype);
  Window_OnyxInvRuneBagSlots.prototype.constructor = Window_OnyxInvRuneBagSlots;

  Window_OnyxInvRuneBagSlots.prototype.initialize = function(x, y, width, height) {
    this._bagInvSlot = -1;
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
    this.deactivate();
  };

  Window_OnyxInvRuneBagSlots.prototype.setBagInvSlot = function(invSlotIndex) {
    this._bagInvSlot = invSlotIndex;
    this.refresh();
  };

  Window_OnyxInvRuneBagSlots.prototype.maxItems = function() {
    if (this._bagInvSlot < 0) return 0;
    var data = Onyx.RuneBag.getBagData(this._bagInvSlot);
    return data ? data.typeSlots : 0;
  };

  Window_OnyxInvRuneBagSlots.prototype.maxCols = function() {
    return Onyx.RuneBag.maxIconsPerRow(Window_Base._iconWidth, this.width);
  };

  Window_OnyxInvRuneBagSlots.prototype.itemWidth = function() {
    return 48;
  };

  Window_OnyxInvRuneBagSlots.prototype.itemHeight = function() {
    return 48;
  };

  Window_OnyxInvRuneBagSlots.prototype.isEnabled = function(index) {
    return this._bagInvSlot >= 0;
  };

  Window_OnyxInvRuneBagSlots.prototype.refresh = function() {
    this.contents.clear();
    if (this._bagInvSlot < 0) return;
    this.drawAllItems();
  };

  Window_OnyxInvRuneBagSlots.prototype.drawItem = function(index) {
    if (this._bagInvSlot < 0) return;
    var data = Onyx.RuneBag.getBagData(this._bagInvSlot);
    if (!data || index >= data.typeSlots) return;
    var rect = this.itemRect(index);
    var r = data.runes[index];
    if (!r || !(Number(r.count) > 0)) return;
    var item = $dataItems[Number(r.itemId)];
    if (!item) return;
    var ix = rect.x + Math.floor((rect.width - Window_Base._iconWidth) / 2);
    var iy = rect.y + Math.floor((rect.height - Window_Base._iconHeight) / 2);
    this.drawIcon(item.iconIndex, ix, iy);
    this.contents.fontSize = 10;
    this.drawText(String(r.count), ix, iy + 16, Window_Base._iconWidth, "right");
    this.resetTextColor();
    this.contents.fontSize = this.standardFontSize();
  };

  Window_OnyxInvRuneBagSlots.prototype.processOk = function() {
    if (!this.isCurrentItemEnabled()) {
      this.playBuzzerSound();
      return;
    }
    Onyx.RuneBag.onRuneBagSlotOk(this);
  };

  // --- Hooks inventario ---
  var _OnyxInv_swapSlots = window.OnyxInv.swapSlots;
  window.OnyxInv.swapSlots = function(a, b) {
    if (Onyx.RuneBag.swapBagData) Onyx.RuneBag.swapBagData(a, b);
    return _OnyxInv_swapSlots(a, b);
  };

  var _OnyxInv_clearSlot = window.OnyxInv.clearSlot;
  window.OnyxInv.clearSlot = function(i) {
    if (Onyx.RuneBag.deleteBagData) Onyx.RuneBag.deleteBagData(i);
    return _OnyxInv_clearSlot(i);
  };

  var _Scene_OnyxInventory_create = Scene_OnyxInventory.prototype.create;
  Scene_OnyxInventory.prototype.create = function() {
    _Scene_OnyxInventory_create.call(this);
    Onyx.RuneBag.clearUiState();
    this.findInvSlotsWindow();
    this.createRuneBagPanel();
  };

  Scene_OnyxInventory.prototype.findInvSlotsWindow = function() {
    if (this._slotsWindow) return;
    var i, c;
    for (i = 0; i < this.children.length; i++) {
      c = this.children[i];
      if (c && c.constructor === Window_OnyxInvSlots) {
        this._slotsWindow = c;
        return;
      }
    }
  };

  Scene_OnyxInventory.prototype.createRuneBagPanel = function() {
    var gold = this._goldWindow;
    var slotsWin = this._slotsWindow;
    if (!gold || !slotsWin) return;
    var runeH = 52;
    var wy = this._helpWindow ? this._helpWindow.height : 0;
    var wh = Graphics.boxHeight - wy;
    var goldH = gold.height;
    var slotsH = Math.max(48, wh - goldH - runeH);
    slotsWin.height = slotsH;
    slotsWin.y = wy;
    slotsWin.createContents();
    gold.y = wy + slotsH;
    this._runeBagWindow = new Window_OnyxInvRuneBagSlots(gold.x, gold.y + goldH, gold.width, runeH);
    this._runeBagWindow.setBagInvSlot(-1);
    this.addWindow(this._runeBagWindow);
  };

  var _Scene_OnyxInventory_update = Scene_OnyxInventory.prototype.update;
  Scene_OnyxInventory.prototype.update = function() {
    _Scene_OnyxInventory_update.call(this);
    Onyx.RuneBag.updateHoldEmpty(this);
    this.updateRuneBagFocus();
  };

  Scene_OnyxInventory.prototype.updateRuneBagFocus = function() {
    if (!this._slotsWindow || !this._runeBagWindow) return;
    var idx = this._slotsWindow.index();
    var slots = window.OnyxInv.slots();
    var s = slots[idx];
    var obj = invSlotObject(s);
    var bagIdx = obj && Onyx.RuneBag.isRuneBagItem(obj) ? idx : -1;
    if (bagIdx !== Onyx.RuneBag.activeBagInvSlot()) {
      if (bagIdx >= 0) Onyx.RuneBag.setActiveBag(bagIdx);
      else if (!Onyx.RuneBag.isDepositMode()) Onyx.RuneBag.setActiveBag(-1);
    }
    this._runeBagWindow.setBagInvSlot(Onyx.RuneBag.activeBagInvSlot());
    if (Onyx.RuneBag.isDepositMode() && this._helpWindow) {
      this._helpWindow.setText("Bolsa: elige runas (400-409). OK bolsa = salir. Mantén OK 4s = vaciar.");
    }
  };

  var _Window_OnyxInvSlots_drawItem = Window_OnyxInvSlots.prototype.drawItem;
  Window_OnyxInvSlots.prototype.drawItem = function(index) {
    var slots = window.OnyxInv.slots();
    var dim = Onyx.RuneBag.shouldDimInventorySlot(slots[index]);
    if (dim) this.contents.paintOpacity = 96;
    _Window_OnyxInvSlots_drawItem.call(this, index);
    this.contents.paintOpacity = 255;
  };

  Window_OnyxInvSlots.prototype.processOk = function() {
    if (Onyx.RuneBag.onInventoryOk(this)) return;
    this.playBuzzerSound();
  };

  var _Game_Party_initAllItems_rb = Game_Party.prototype.initAllItems;
  Game_Party.prototype.initAllItems = function() {
    _Game_Party_initAllItems_rb.call(this);
    if (!$gameParty._onyxRuneBags) $gameParty._onyxRuneBags = {};
  };

  if (window.Scene_OnyxBank) {
    var _Scene_OnyxBank_onInvDeposit = Scene_OnyxBank.prototype.onInvDeposit;
    Scene_OnyxBank.prototype.onInvDeposit = function() {
      var invIndex = this._invSlotsWindow.index();
      if (Onyx.RuneBag.tryDepositBagSlotToBank(invIndex)) {
        this._bankSlotsWindow.refresh();
        this._invSlotsWindow.refresh();
        return;
      }
      _Scene_OnyxBank_onInvDeposit.call(this);
    };
  }

})();

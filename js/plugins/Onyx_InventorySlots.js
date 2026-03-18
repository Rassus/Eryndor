/*:
 * @plugindesc (Onyx) Inventario por 28 slots fijos con apilado y swap (backend). v1.0.0
 * @author Onyx
 * @version 1.0.0
 *
 * @param slotCount
 * @text Cantidad de slots (fijo)
 * @type number
 * @default 28
 *
 * @param maxStack
 * @text Máximo por stack (items)
 * @type number
 * @default 99
 *
 * @param openWithB
 * @text Abrir inventario con tecla B en mapa
 * @type boolean
 * @default true
 *
 * @param blockBDuringEvent
 * @text No abrir B si hay evento en marcha
 * @type boolean
 * @default true
 *
 * @param goldXIconIndex
 * @text Icono para "X" del oro (0 = mostrar texto "X")
 * @type number
 * @default 0
 *
 * @param qCircleRadius
 * @text Radio del circulo blanco Q (pestañas)
 * @type number
 * @default 8
 *
 * @param qCircleOffsetX
 * @text Offset X del circulo Q (desde el borde izquierdo de su celda)
 * @type number
 * @default 2
 *
 * @param qCircleOffsetY
 * @text Offset Y del circulo Q (desde la linea superior de su celda)
 * @type number
 * @default 0
 *
 * @param qLetterOffsetY
 * @text Offset Y de la letra Q dentro del circulo
 * @type number
 * @default 0
 *
 * @param qLetterOffsetX
 * @text Offset X de la letra Q dentro del circulo
 * @type number
 * @default 0
 *
 * @param eCircleRadius
 * @text Radio del circulo blanco E (pestañas)
 * @type number
 * @default 8
 *
 * @param eCircleOffsetX
 * @text Offset X del circulo E (desde el borde derecho de su celda)
 * @type number
 * @default 2
 *
 * @param eCircleOffsetY
 * @text Offset Y del circulo E (desde la linea superior de su celda)
 * @type number
 * @default 0
 *
 * @param eLetterOffsetY
 * @text Offset Y de la letra E dentro del circulo
 * @type number
 * @default 0
 *
 * @param eLetterOffsetX
 * @text Offset X de la letra E dentro del circulo
 * @type number
 * @default 0
 *
 * @help
 * Reglas:
 * - Inventario siempre tiene 28 slots (configurable pero pensado fijo).
 * - Items (DataManager.isItem) apilan hasta 99 por slot.
 * - Armas y armaduras NO apilan (1 por slot).
 * - Si inventario está lleno, no se guardan más ítems.
 * - Si un stack llega a 99 y queda sobrante, usa otro slot si existe.
 * - Cada slot tiene un id (0..27) y guarda { kind, id, amount }.
 *
 * Nota: Este plugin redefine Game_Party gainItem/loseItem/numItems/allItems
 * para que el resto del juego (menús/tienda/eventos) consulte el inventario por slots.
 */

(function() {
  "use strict";

  var P = PluginManager.parameters("Onyx_InventorySlots");
  var SLOT_COUNT = Math.max(1, Math.floor(Number(P.slotCount || 28)));
  var MAX_STACK = Math.max(1, Math.floor(Number(P.maxStack || 99)));
  var OPEN_WITH_B = P.openWithB !== "false";
  var BLOCK_B_EVENT = P.blockBDuringEvent !== "false";

  // Oro: icono X configurable
  var GOLD_X_ICON_INDEX = Math.max(0, Math.floor(Number(P.goldXIconIndex || 0)));

  // Q/E (en ventana de pestañas)
  var Q_CIRCLE_RADIUS = Math.max(1, Math.floor(Number(P.qCircleRadius || 8)));
  var Q_CIRCLE_OFFSET_X = Math.floor(Number(P.qCircleOffsetX || 2));
  var Q_CIRCLE_OFFSET_Y = Math.floor(Number(P.qCircleOffsetY || 0));
  var Q_LETTER_OFFSET_Y = Math.floor(Number(P.qLetterOffsetY || 0));
  var Q_LETTER_OFFSET_X = Math.floor(Number(P.qLetterOffsetX || 0));

  var E_CIRCLE_RADIUS = Math.max(1, Math.floor(Number(P.eCircleRadius || 8)));
  var E_CIRCLE_OFFSET_X = Math.floor(Number(P.eCircleOffsetX || 2));
  var E_CIRCLE_OFFSET_Y = Math.floor(Number(P.eCircleOffsetY || 0));
  var E_LETTER_OFFSET_Y = Math.floor(Number(P.eLetterOffsetY || 0));
  var E_LETTER_OFFSET_X = Math.floor(Number(P.eLetterOffsetX || 0));

  var HOTKEY_INV = "onyxInventoryKeyB";
  Input.keyMapper[66] = HOTKEY_INV; // B

  // Tabs inventario: Q/E
  // Q y E: mapeamos para que la navegación sea con teclas reales.
  var HOTKEY_TAB_RIGHT = "onyxInvTabRight";
  Input.keyMapper[69] = HOTKEY_TAB_RIGHT; // E
  var HOTKEY_TAB_LEFT = "onyxInvTabLeft";
  Input.keyMapper[81] = HOTKEY_TAB_LEFT; // Q

  // Intercambiar slot (R) y borrar item (T)
  var HOTKEY_INV_SWAP_R = "onyxInvSwapR";
  Input.keyMapper[82] = HOTKEY_INV_SWAP_R; // R
  var HOTKEY_INV_DELETE_T = "onyxInvDeleteT";
  Input.keyMapper[84] = HOTKEY_INV_DELETE_T; // T

  function isDbItem(obj) { return !!obj && DataManager.isItem(obj); }
  function isDbWeapon(obj) { return !!obj && DataManager.isWeapon(obj); }
  function isDbArmor(obj) { return !!obj && DataManager.isArmor(obj); }

  function kindOf(obj) {
    if (isDbItem(obj)) return "item";
    if (isDbWeapon(obj)) return "weapon";
    if (isDbArmor(obj)) return "armor";
    return null;
  }

  function slotEmpty(s) {
    return !s || !s.kind || !s.id || !s.amount;
  }

  function normalizeSlots(party) {
    if (!party._onyxInvSlots || !Array.isArray(party._onyxInvSlots)) {
      party._onyxInvSlots = [];
    }
    // forzar tamaño fijo
    if (party._onyxInvSlots.length !== SLOT_COUNT) {
      var next = new Array(SLOT_COUNT);
      for (var i = 0; i < SLOT_COUNT; i++) next[i] = null;
      for (var j = 0; j < Math.min(SLOT_COUNT, party._onyxInvSlots.length); j++) next[j] = party._onyxInvSlots[j];
      party._onyxInvSlots = next;
    }
    // limpiar entradas inválidas
    for (var k = 0; k < SLOT_COUNT; k++) {
      var s = party._onyxInvSlots[k];
      if (!s) continue;
      if (!s.kind || !s.id || !s.amount || s.amount <= 0) party._onyxInvSlots[k] = null;
    }
  }

  function isStackable(obj) {
    return isDbItem(obj);
  }

  function maxPerSlot(obj) {
    return isStackable(obj) ? MAX_STACK : 1;
  }

  function sumAmount(party, obj) {
    normalizeSlots(party);
    var k = kindOf(obj);
    if (!k) return 0;
    var id = Number(obj.id) || 0;
    var sum = 0;
    for (var i = 0; i < SLOT_COUNT; i++) {
      var s = party._onyxInvSlots[i];
      if (s && s.kind === k && Number(s.id) === id) sum += Number(s.amount) || 0;
    }
    return sum;
  }

  function firstEmptySlotIndex(party) {
    normalizeSlots(party);
    for (var i = 0; i < SLOT_COUNT; i++) {
      if (!party._onyxInvSlots[i]) return i;
    }
    return -1;
  }

  function addToSlots(party, obj, amount) {
    normalizeSlots(party);
    var k = kindOf(obj);
    if (!k) return 0;
    var id = Number(obj.id) || 0;
    var left = Math.max(0, Math.floor(Number(amount) || 0));
    if (left <= 0) return 0;

    // apilar primero (solo items)
    if (isStackable(obj)) {
      for (var i = 0; i < SLOT_COUNT && left > 0; i++) {
        var s = party._onyxInvSlots[i];
        if (!s || s.kind !== k || Number(s.id) !== id) continue;
        var cap = MAX_STACK - (Number(s.amount) || 0);
        if (cap <= 0) continue;
        var add = Math.min(cap, left);
        s.amount = (Number(s.amount) || 0) + add;
        left -= add;
      }
    }

    // usar slots vacíos
    while (left > 0) {
      var idx = firstEmptySlotIndex(party);
      if (idx < 0) break;
      var take = Math.min(maxPerSlot(obj), left);
      party._onyxInvSlots[idx] = { kind: k, id: id, amount: take };
      left -= take;
      // armas/armaduras: 1 por slot; repetimos loop si left>0
    }

    return Math.max(0, Math.floor(Number(amount) || 0) - left);
  }

  function removeFromSlots(party, obj, amount) {
    normalizeSlots(party);
    var k = kindOf(obj);
    if (!k) return 0;
    var id = Number(obj.id) || 0;
    var left = Math.max(0, Math.floor(Number(amount) || 0));
    if (left <= 0) return 0;

    // quitar desde el final (más intuitivo con stacks)
    for (var i = SLOT_COUNT - 1; i >= 0 && left > 0; i--) {
      var s = party._onyxInvSlots[i];
      if (!s || s.kind !== k || Number(s.id) !== id) continue;
      var have = Number(s.amount) || 0;
      var take = Math.min(have, left);
      var newAmt = have - take;
      left -= take;
      if (newAmt <= 0) party._onyxInvSlots[i] = null;
      else s.amount = newAmt;
    }

    return Math.max(0, Math.floor(Number(amount) || 0) - left);
  }

  function uniqueObjectsFromSlots(party, kindFilter) {
    normalizeSlots(party);
    var seen = {};
    var out = [];
    for (var i = 0; i < SLOT_COUNT; i++) {
      var s = party._onyxInvSlots[i];
      if (!s) continue;
      if (kindFilter && s.kind !== kindFilter) continue;
      var key = s.kind + ":" + s.id;
      if (seen[key]) continue;
      seen[key] = true;
      var obj = null;
      if (s.kind === "item") obj = $dataItems[Number(s.id)];
      else if (s.kind === "weapon") obj = $dataWeapons[Number(s.id)];
      else if (s.kind === "armor") obj = $dataArmors[Number(s.id)];
      if (obj) out.push(obj);
    }
    return out;
  }

  // Exponer API mínima para UI/swap
  window.OnyxInv = window.OnyxInv || {};
  window.OnyxInv.slotCount = function() { return SLOT_COUNT; };
  window.OnyxInv.maxStack = function() { return MAX_STACK; };
  window.OnyxInv.slots = function() { normalizeSlots($gameParty); return $gameParty._onyxInvSlots; };
  window.OnyxInv.swapSlots = function(a, b) {
    normalizeSlots($gameParty);
    a = Math.floor(Number(a));
    b = Math.floor(Number(b));
    if (a < 0 || b < 0 || a >= SLOT_COUNT || b >= SLOT_COUNT) return false;
    var tmp = $gameParty._onyxInvSlots[a];
    $gameParty._onyxInvSlots[a] = $gameParty._onyxInvSlots[b];
    $gameParty._onyxInvSlots[b] = tmp;
    if ($gameMap) $gameMap.requestRefresh();
    return true;
  };
  window.OnyxInv.clearSlot = function(i) {
    normalizeSlots($gameParty);
    i = Math.floor(Number(i));
    if (i < 0 || i >= SLOT_COUNT) return false;
    var s = $gameParty._onyxInvSlots[i];
    if (!s) return false;
    // Si el slot corresponde a arma/armadura, también descartamos equipamientos.
    if (s.kind === "weapon" || s.kind === "armor") {
      var obj = s.kind === "weapon" ? $dataWeapons[Number(s.id)] : $dataArmors[Number(s.id)];
      if (obj) $gameParty.discardMembersEquip(obj, Number(s.amount) || 1);
    }
    $gameParty._onyxInvSlots[i] = null;
    if ($gameMap) $gameMap.requestRefresh();
    return true;
  };

  // ---------------------------------------------------------------------------
  // Scene Inventario (UI básica por ahora, 28 slots)
  // ---------------------------------------------------------------------------
  function Scene_OnyxInventory() {
    this.initialize.apply(this, arguments);
  }

  Scene_OnyxInventory.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_OnyxInventory.prototype.constructor = Scene_OnyxInventory;

  Scene_OnyxInventory.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
  };

  Scene_OnyxInventory.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._helpWindow = new Window_Help(1);
    this._helpWindow.setText("INVENTARIO");
    // Centrar el título del inventario.
    var help = this._helpWindow;
    var oldRefresh = help.refresh;
    help.refresh = function() {
      this.contents.clear();
      var text = this._text || "";
      // drawText soporta alineación (drawTextEx no permite center sin textWidthEx).
      this.drawText(text, 0, 0, this.contentsWidth(), "center");
    };
    help.refresh();

    var wy = this._helpWindow.height;
    var wh = Graphics.boxHeight - wy;

    // Ventana de slots: 5 items por fila (48x48)
    var invCols = 5;
    var invItemW = 48;
    var invPad = 18; // Window_Base.standardPadding()
    var leftW = invCols * invItemW + invPad * 2;
    var rightW = Graphics.boxWidth - leftW;

    var goldH = 48;
    // Asegurar que la ventana de oro quede visible y con altura 48 (si hay espacio).
    if (wh < goldH) goldH = wh;
    var slotsH = wh - goldH;

    // Panel izquierdo: slots
    this._slotsWindow = new Window_OnyxInvSlots(0, wy, leftW, slotsH);
    this._slotsWindow.setHandler("cancel", this.popScene.bind(this));

    // Panel derecho: nombre + tabs + contenido
    var rx = leftW;
    var headerH = this._helpWindow.fittingHeight(2);
    var tabsH = this._helpWindow.fittingHeight(1);
    var contentH = wh - headerH - tabsH;

    this._itemHeaderWindow = new Window_OnyxInvItemHeader(rx, wy, rightW, headerH);
    this._tabsWindow = new Window_OnyxInvTabs(rx, wy + headerH, rightW, tabsH);
    this._contentWindow = new Window_OnyxInvContent(rx, wy + headerH + tabsH, rightW, contentH);

    this._tabsWindow.setContentWindow(this._contentWindow);
    this._slotsWindow.setDetailWindows(this._itemHeaderWindow, this._contentWindow);

    this.addWindow(this._helpWindow);
    this.addWindow(this._slotsWindow);
    this.addWindow(this._itemHeaderWindow);
    this.addWindow(this._tabsWindow);
    this.addWindow(this._contentWindow);

    // Ventana oro (parte inferior izquierda)
    this._goldWindow = new Window_OnyxInvGold(0, wy + slotsH, leftW, goldH);
    this.addWindow(this._goldWindow);

    this._slotsWindow.activate();
    var sel = 0;
    if ($gameTemp && $gameTemp._onyxInvSelectIndexAfterReopen != null) {
      sel = Number($gameTemp._onyxInvSelectIndexAfterReopen) || 0;
      $gameTemp._onyxInvSelectIndexAfterReopen = null;
    }
    var maxSel = this._slotsWindow.maxItems() - 1;
    if (sel < 0) sel = 0;
    if (sel > maxSel) sel = maxSel;
    this._slotsWindow.select(sel);
  };

  Scene_OnyxInventory.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    this.updateInvDelete();
  };

  Scene_OnyxInventory.prototype.startInvDelete = function(slotIndex) {
    var slots = window.OnyxInv.slots();
    var s = slots[slotIndex];
    if (!s) return;

    var obj = slotToObject(s);
    var qty = Number(s.amount) || 0;
    var name = obj && obj.name ? obj.name : "este item";
    if (s.kind === "item" && qty > 1) name = name + " x" + qty;

    if (this._invDeleteLoading) {
      try { this.removeChild(this._invDeleteLoading); } catch (e) {}
      this._invDeleteLoading = null;
    }

    // Mostrar el loading sobre el icono del slot seleccionado.
    var cx = Graphics.boxWidth / 2;
    var cy = Graphics.boxHeight / 2;
    if (this._slotsWindow && this._slotsWindow.itemRect) {
      var rect = this._slotsWindow.itemRect(slotIndex);
      cx = this._slotsWindow.x + rect.x + rect.width / 2;
      cy = this._slotsWindow.y + rect.y + rect.height / 2;
    }

    this._invDeleteState = {
      slotIndex: slotIndex,
      phase: "loading",
      startFrame: Graphics.frameCount,
      itemName: name,
      waitChoice: false
    };

    this._invDeleteLoading = new PIXI.Graphics();
    this._invDeleteLoading.x = cx;
    this._invDeleteLoading.y = cy;
    this.addChild(this._invDeleteLoading);

    this._slotsWindow.deactivate();
    this._tabsWindow.deactivate();
    if (this._itemHeaderWindow && this._itemHeaderWindow.deactivate) this._itemHeaderWindow.deactivate();
    if (this._contentWindow && this._contentWindow.deactivate) this._contentWindow.deactivate();
    if (this._goldWindow && this._goldWindow.deactivate) this._goldWindow.deactivate();
  };

  Scene_OnyxInventory.prototype.updateInvDelete = function() {
    if (!this._invDeleteState) {
      if ($gameTemp && $gameTemp._onyxInvDeleteSlotIndex != null) {
        var idx = $gameTemp._onyxInvDeleteSlotIndex;
        $gameTemp._onyxInvDeleteSlotIndex = null;
        this.startInvDelete(idx);
      }
      return;
    }

    // Interceptar OK/Cancel mientras el confirmador está abierto.
    // Esto evita que el Window_Command no cierre bien dependiendo de la versión/inputs.
    if (this._invDeleteState.phase === "confirming") {
      if (Input.isTriggered("cancel") || Input.isRepeated("cancel")) {
        this._invDeleteState = null;
        if (this._invConfirmWindow) {
          try { this.removeChild(this._invConfirmWindow); } catch (e) {}
        }
        this._invConfirmWindow = null;

        if (this._invDeletePrevHelpText != null) {
          this._helpWindow.setText(this._invDeletePrevHelpText);
          this._helpWindow.refresh();
        }
        this._invDeletePrevHelpText = null;

        this._slotsWindow.activate();
        this._tabsWindow.activate();
        this._contentWindow.activate();
        return;
      }

      if (Input.isTriggered("ok") || Input.isRepeated("ok")) {
        var idx2 = this._invConfirmWindow && this._invConfirmWindow.index ? this._invConfirmWindow.index() : 0;
        var slotIndex2 = this._invDeleteState.slotIndex;
        this._invDeleteState = null;

        if (idx2 === 0) {
          window.OnyxInv.clearSlot(slotIndex2);
          if (this._slotsWindow) {
            this._slotsWindow.refresh();
            this._slotsWindow.select(Math.min(slotIndex2, this._slotsWindow.maxItems() - 1));
          }
        }

        if (this._invConfirmWindow) {
          try { this.removeChild(this._invConfirmWindow); } catch (e) {}
        }
        this._invConfirmWindow = null;

        if (this._invDeletePrevHelpText != null) {
          this._helpWindow.setText(this._invDeletePrevHelpText);
          this._helpWindow.refresh();
        }
        this._invDeletePrevHelpText = null;

        this._slotsWindow.activate();
        this._tabsWindow.activate();
        this._contentWindow.activate();
        return;
      }

      return;
    }

    if (this._invDeleteState.phase === "loading") {
      var totalFrames = 180; // 3 segundos aprox a 60fps
      var elapsed = Graphics.frameCount - this._invDeleteState.startFrame;
      var p = Math.max(0, Math.min(1, elapsed / totalFrames));

      if (this._invDeleteLoading) {
        var g = this._invDeleteLoading;
        g.clear();

        var r = 22;
        // Anillo/contorno blanco
        g.lineStyle(4, 0xffffff, 1);
        g.drawCircle(0, 0, r);

        // Llenado rojo tipo "sector"
        if (p > 0) {
          g.beginFill(0xff0000, 0.95);
          g.moveTo(0, 0);
          g.arc(0, 0, r - 3, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
          g.lineTo(0, 0);
          g.endFill();
        }

        // Dot central para que se vea como "icono"
        g.beginFill(0xffffff, 1);
        g.drawCircle(0, 0, 4);
        g.endFill();
      }

      if (p >= 1) {
        if (this._invDeleteLoading) {
          try { this.removeChild(this._invDeleteLoading); } catch (e) {}
          this._invDeleteLoading = null;
        }

        this._invDeleteState.phase = "confirming";

        var slotIndex = this._invDeleteState.slotIndex;
        var itemName = this._invDeleteState.itemName;

        if (this._invConfirmWindow) {
          try { this.removeChild(this._invConfirmWindow); } catch (e) {}
          this._invConfirmWindow = null;
        }

        var w = 240;
        var h = this._helpWindow ? this._helpWindow.fittingHeight(2) : 96;
        var x = Math.floor((Graphics.boxWidth - w) / 2);
        var y = Math.floor(Graphics.boxHeight * 0.45);

        this._invConfirmWindow = new Window_OnyxInvDeleteConfirm(x, y, w, h);
        // Pregunta en el help del inventario (evita problemas con Window_ChoiceList).
        if (!this._invDeletePrevHelpText) this._invDeletePrevHelpText = this._helpWindow._text;
        this._helpWindow.setText("¿Eliminar " + itemName + "?");
        this._helpWindow.refresh();

        var scene = this;
        // Asegurar que 'OK' siempre conteste, aunque el símbolo no se resuelva.
        this._invConfirmWindow.setHandler("ok", function() {
          var idx = this.index ? this.index() : 0;
          if (idx === 0) this.callHandler("yes");
          else this.callHandler("no");
        }.bind(this._invConfirmWindow));

        // Permitir cancelar y restaurar si el usuario presiona cancel.
        this._invConfirmWindow.setHandler("cancel", function() {
          scene._invDeleteState = null;
          if (scene._invConfirmWindow) {
            try { scene.removeChild(scene._invConfirmWindow); } catch (e) {}
          }
          scene._invConfirmWindow = null;

          if (scene._invDeletePrevHelpText != null) {
            scene._helpWindow.setText(scene._invDeletePrevHelpText);
            scene._helpWindow.refresh();
          }
          scene._invDeletePrevHelpText = null;

          scene._slotsWindow.activate();
          scene._tabsWindow.activate();
          scene._contentWindow.activate();
        });

        this._invConfirmWindow.setHandler("yes", function() {
          window.OnyxInv.clearSlot(slotIndex);
          scene._slotsWindow.refresh();
          scene._slotsWindow.select(Math.min(slotIndex, scene._slotsWindow.maxItems() - 1));

          scene._invDeleteState = null;
          if (scene._invConfirmWindow) {
            try { scene.removeChild(scene._invConfirmWindow); } catch (e) {}
          }
          scene._invConfirmWindow = null;

          if (scene._invDeletePrevHelpText != null) {
            scene._helpWindow.setText(scene._invDeletePrevHelpText);
            scene._helpWindow.refresh();
          }
          scene._invDeletePrevHelpText = null;

          scene._slotsWindow.activate();
          scene._tabsWindow.activate();
          scene._contentWindow.activate();
        });

        this._invConfirmWindow.setHandler("no", function() {
          scene._invDeleteState = null;
          if (scene._invConfirmWindow) {
            try { scene.removeChild(scene._invConfirmWindow); } catch (e) {}
          }
          scene._invConfirmWindow = null;

          if (scene._invDeletePrevHelpText != null) {
            scene._helpWindow.setText(scene._invDeletePrevHelpText);
            scene._helpWindow.refresh();
          }
          scene._invDeletePrevHelpText = null;

          scene._slotsWindow.activate();
          scene._tabsWindow.activate();
          scene._contentWindow.activate();
        });

        this.addWindow(this._invConfirmWindow);
        this._invConfirmWindow.activate();
        this._invConfirmWindow.select(0);
      }
    }
  };

  function slotToObject(slot) {
    if (!slot) return null;
    var id = Number(slot.id) || 0;
    if (slot.kind === "item") return $dataItems && $dataItems[id];
    if (slot.kind === "weapon") return $dataWeapons && $dataWeapons[id];
    if (slot.kind === "armor") return $dataArmors && $dataArmors[id];
    return null;
  }

  function Window_OnyxInvSlots(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }

  Window_OnyxInvSlots.prototype = Object.create(Window_Selectable.prototype);
  Window_OnyxInvSlots.prototype.constructor = Window_OnyxInvSlots;

  Window_OnyxInvSlots.prototype.initialize = function(x, y, width, height) {
    this._swapFrom = null;
    this._headerWindow = null;
    this._contentWindow = null;
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
    this.select(0);
  };

  Window_OnyxInvSlots.prototype.maxItems = function() {
    return SLOT_COUNT;
  };

  Window_OnyxInvSlots.prototype.maxCols = function() {
    return 5; // 5 items por fila
  };

  Window_OnyxInvSlots.prototype.spacing = function() {
    return 0;
  };

  Window_OnyxInvSlots.prototype.itemWidth = function() {
    return 48;
  };

  Window_OnyxInvSlots.prototype.itemHeight = function() {
    return 48;
  };

  Window_OnyxInvSlots.prototype.itemRect = function(index) {
    var cols = this.maxCols();
    var w = this.itemWidth();
    var h = this.itemHeight();
    var x = (index % cols) * (w + this.spacing());
    var y = Math.floor(index / cols) * (h + this.spacing());
    return new Rectangle(x, y, w, h);
  };

  Window_OnyxInvSlots.prototype.setDetailWindows = function(headerWindow, contentWindow) {
    this._headerWindow = headerWindow;
    this._contentWindow = contentWindow;
    this.updateDetail();
  };

  Window_OnyxInvSlots.prototype.refresh = function() {
    normalizeSlots($gameParty);
    this.createContents();
    this.drawAllItems();
    this.updateDetail();
  };

  Window_OnyxInvSlots.prototype.drawItem = function(index) {
    var rect = this.itemRect(index);
    var slots = window.OnyxInv.slots();
    var s = slots[index];
    this.resetTextColor();

    // Marco de slot (Bitmap no tiene drawRect en MV; si queremos borde, lo hacemos luego con fillRect)
    this.contents.paintOpacity = 255;

    if (!s) {
      this.changePaintOpacity(true);
      return;
    }

    if (this._swapFrom === index) this.contents.paintOpacity = 160;
    else this.contents.paintOpacity = 255;

    var obj = null;
    if (s.kind === "item") obj = $dataItems[Number(s.id)];
    else if (s.kind === "weapon") obj = $dataWeapons[Number(s.id)];
    else if (s.kind === "armor") obj = $dataArmors[Number(s.id)];

    if (obj) {
      // Centrar icono dentro de 48x48
      var ix = rect.x + Math.floor((rect.width - Window_Base._iconWidth) / 2);
      var iy = rect.y + Math.floor((rect.height - Window_Base._iconHeight) / 2);
      this.drawIcon(obj.iconIndex, ix, iy);
      var amt = Number(s.amount) || 0;
      // Mostrar cantidad en la esquina inferior derecha del ICONO (no del slot)
      // Items: mostramos siempre (incluye x1). Armas/armaduras: solo si > 1 (por seguridad).
      var showQty = false;
      if (s.kind === "item") showQty = true;
      else if (amt > 1) showQty = true;
      if (showQty) {
        // Número más pequeño (MV tiene lineHeight fijo, así que posicionamos manual)
        this.contents.fontSize = 10;
        var qtyY = iy + 18; // esquina inferior derecha dentro del icono
        var qtyX = ix;
        this.drawText(String(amt), qtyX, qtyY, Window_Base._iconWidth, "right");
        this.contents.fontSize = this.standardFontSize();
      }
    }

    // Restaurar opacidad por si el slot siguiente depende del estado de dibujo.
    this.contents.paintOpacity = 255;
  };

  Window_OnyxInvSlots.prototype.update = function() {
    Window_Selectable.prototype.update.call(this);
    this.updateDetail();
  };

  Window_OnyxInvSlots.prototype.updateDetail = function() {
    if (!this._headerWindow && !this._contentWindow) return;
    var slots = window.OnyxInv.slots();
    var s = slots[this.index()];
    var obj = slotToObject(s);
    var qty = s ? (Number(s.amount) || 0) : 0;
    if (this._headerWindow) this._headerWindow.setItem(obj, qty);
    if (this._contentWindow) this._contentWindow.setItem(obj, qty);
  };

  Window_OnyxInvSlots.prototype.processHandling = function() {
    Window_Selectable.prototype.processHandling.call(this);
    if (!this.isOpenAndActive()) return;
    if (Input.isTriggered(HOTKEY_INV_SWAP_R) || Input.isTriggered("r")) {
      this.onSwapKey();
      return;
    }
    if (Input.isTriggered(HOTKEY_INV_DELETE_T) || Input.isTriggered("t")) {
      if (this._swapFrom == null) this.requestDeleteSlot();
      return;
    }
  };

  Window_OnyxInvSlots.prototype.onSwapKey = function() {
    if (this._swapFrom == null) {
      this._swapFrom = this.index();
      SoundManager.playCursor();
      this.refresh();
      return;
    }
    var to = this.index();
    var from = this._swapFrom;
    this._swapFrom = null;
    window.OnyxInv.swapSlots(from, to);
    SoundManager.playOk();
    this.refresh();
  };

  Window_OnyxInvSlots.prototype.requestDeleteSlot = function() {
    if ($gameMessage && $gameMessage.isBusy()) return;
    var idx = this.index();
    var slots = window.OnyxInv.slots();
    var s = slots[idx];
    if (!s) return;
    $gameTemp._onyxInvDeleteSlotIndex = idx;
  };

  function Window_OnyxInvDeleteConfirm(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }

  Window_OnyxInvDeleteConfirm.prototype = Object.create(Window_Command.prototype);
  Window_OnyxInvDeleteConfirm.prototype.constructor = Window_OnyxInvDeleteConfirm;

  Window_OnyxInvDeleteConfirm.prototype.initialize = function(x, y, width, height) {
    this._message = "";
    this._customWidth = width;
    this._customHeight = height;
    Window_Command.prototype.initialize.call(this, x, y);
  };

  Window_OnyxInvDeleteConfirm.prototype.setMessage = function(itemName) {
    this._message = String(itemName || "");
    this.refresh();
  };

  Window_OnyxInvDeleteConfirm.prototype.windowWidth = function() {
    return this._customWidth || 240;
  };

  Window_OnyxInvDeleteConfirm.prototype.windowHeight = function() {
    return this._customHeight || this.fittingHeight(this.numVisibleRows());
  };

  Window_OnyxInvDeleteConfirm.prototype.makeCommandList = function() {
    this.addCommand("Sí", "yes");
    this.addCommand("No", "no");
  };

  Window_OnyxInvDeleteConfirm.prototype.refresh = function() {
    Window_Command.prototype.refresh.call(this);
  };

  // ---------------------------------------------------------------------------
  // Panel derecho
  // ---------------------------------------------------------------------------
  function Window_OnyxInvItemHeader(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }

  Window_OnyxInvItemHeader.prototype = Object.create(Window_Base.prototype);
  Window_OnyxInvItemHeader.prototype.constructor = Window_OnyxInvItemHeader;

  Window_OnyxInvItemHeader.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._item = null;
    this._qty = 0;
    this.refresh();
  };

  Window_OnyxInvItemHeader.prototype.setItem = function(item, qty) {
    if (this._item === item && this._qty === qty) return;
    this._item = item;
    this._qty = qty || 0;
    this.refresh();
  };

  Window_OnyxInvItemHeader.prototype.refresh = function() {
    this.contents.clear();
    var name = "—";
    if (this._item && this._item.name) name = this._item.name;
    this.contents.fontSize = this.standardFontSize() + 6;
    this.drawText(name, 12, 0, this.contentsWidth() - 24, "center");
    this.contents.fontSize = this.standardFontSize();
  };

  function Window_OnyxInvTabs(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }

  Window_OnyxInvTabs.prototype = Object.create(Window_HorzCommand.prototype);
  Window_OnyxInvTabs.prototype.constructor = Window_OnyxInvTabs;

  Window_OnyxInvTabs.prototype.initialize = function(x, y, width, height) {
    this._contentWindow = null;
    Window_HorzCommand.prototype.initialize.call(this, x, y);
    this.width = width;
    this.height = height;
    this.refresh();
    this.select(0);
    this.activate();
  };

  Window_OnyxInvTabs.prototype.windowWidth = function() {
    return this.width;
  };

  Window_OnyxInvTabs.prototype.maxCols = function() {
    return 5;
  };

  Window_OnyxInvTabs.prototype.makeCommandList = function() {
    this.addCommand("Descripcion", "desc");
    this.addCommand("Habilidad", "skill");
    this.addCommand("Recetas", "recipes");
    this.addCommand("Obtencion", "obtain");
    this.addCommand("Historia", "history");
  };

  // Cajas tipo "botón" para indicar Q/E en las pestañas.
  // Descripcion (índice 0) -> Q (izquierda), Historia (índice 4) -> E (derecha)
  Window_OnyxInvTabs.prototype.drawItem = function(index) {
    // Render normal (como las pestañas originales).
    Window_HorzCommand.prototype.drawItem.call(this, index);

    // Solo superponemos Q/E amarillas.
    if (index !== 0 && index !== 4) return;

    var rect = this.itemRectForText(index);
    var ctx = this.contents._context;
    if (!ctx) return;

    // Recortar el dibujo de Q/E para que no afecte a pestañas vecinas.
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();

    // Letra un poco más pequeña que la normal.
    var fs = Math.max(10, this.standardFontSize() - 4);
    this.contents.fontSize = fs;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = fs + "px " + this.standardFontFace();
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#FFD400";
    ctx.lineWidth = 1;

    if (index === 0) {
      var r = Q_CIRCLE_RADIUS;
      var qCx = rect.x + Q_CIRCLE_OFFSET_X + r + Q_LETTER_OFFSET_X;
      var qCy = rect.y + Q_CIRCLE_OFFSET_Y + r + Q_LETTER_OFFSET_Y;
      ctx.strokeText("Q", qCx, qCy);
      ctx.fillText("Q", qCx, qCy);
    } else if (index === 4) {
      var r2 = E_CIRCLE_RADIUS;
      var eCx = rect.x + rect.width - r2 - E_CIRCLE_OFFSET_X + E_LETTER_OFFSET_X;
      var eCy = rect.y + E_CIRCLE_OFFSET_Y + r2 + E_LETTER_OFFSET_Y;
      ctx.strokeText("E", eCx, eCy);
      ctx.fillText("E", eCx, eCy);
    }

    ctx.restore();
  };

  Window_OnyxInvTabs.prototype.setContentWindow = function(w) {
    this._contentWindow = w;
    this.updateContent();
  };

  Window_OnyxInvTabs.prototype.update = function() {
    Window_HorzCommand.prototype.update.call(this);
    this.updateContent();
  };

  // Solo permite mover con Q/E (nada de flechas).
  Window_OnyxInvTabs.prototype.processCursorMove = function() {
    if (!this.isOpenAndActive()) return;
    if (Input.isTriggered(HOTKEY_TAB_LEFT)) {
      this.cursorLeft(false);
      SoundManager.playCursor();
    } else if (Input.isTriggered(HOTKEY_TAB_RIGHT)) {
      this.cursorRight(false);
      SoundManager.playCursor();
    }
  };

  Window_OnyxInvTabs.prototype.updateContent = function() {
    if (!this._contentWindow) return;
    var sym = this.currentSymbol();
    this._contentWindow.setTab(sym);
  };

  function Window_OnyxInvContent(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }

  Window_OnyxInvContent.prototype = Object.create(Window_Base.prototype);
  Window_OnyxInvContent.prototype.constructor = Window_OnyxInvContent;

  Window_OnyxInvContent.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._item = null;
    this._qty = 0;
    this._tab = "desc";
    this.refresh();
  };

  Window_OnyxInvContent.prototype.setItem = function(item, qty) {
    // Al cambiar de item, volver a la pestaña Descripcion.
    if (this._item !== item) this._tab = "desc";
    this._item = item;
    this._qty = qty || 0;
    this.refresh();
  };

  Window_OnyxInvContent.prototype.setTab = function(tab) {
    if (this._tab === tab) return;
    this._tab = tab;
    this.refresh();
  };

  function plainText(s) {
    return String(s || "").replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  Window_OnyxInvContent.prototype.wrapText = function(text, maxWidth) {
    var words = String(text || "").split(" ");
    var lines = [];
    var line = "";
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w) continue;
      var test = line ? (line + " " + w) : w;
      if (this.textWidth(test) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  };

  // Para medir/anidar saltos de línea manteniendo los códigos de texto para dibujarlos con drawTextEx
  Window_OnyxInvContent.prototype.stripEscapeCodesForMeasure = function(text) {
    // Quita secuencias tipo \C[1], \FS[20], \i[10], etc (para medir ancho) y también códigos sueltos como \G
    return String(text || "")
      .replace(/\\[A-Za-z]+\[[^\]]*\]/g, "")
      .replace(/\\[A-Za-z]+/g, "")
      .replace(/\x1b/g, "");
  };

  // Devuelve un string con \n insertados para que drawTextEx aplique colores y comandos.
  Window_OnyxInvContent.prototype.wrapTextEx = function(text, maxWidth) {
    var words = String(text || "").split(" ");
    var lines = [];
    var line = "";
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w) continue;
      var test = line ? (line + " " + w) : w;
      var measure = this.stripEscapeCodesForMeasure(test);
      if (this.textWidth(measure) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.join("\n");
  };

  // ---------------------------------------------------------------------------
  // Oro (ventana inferior izquierda)
  // ---------------------------------------------------------------------------
  function Window_OnyxInvGold(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }

  Window_OnyxInvGold.prototype = Object.create(Window_Base.prototype);
  Window_OnyxInvGold.prototype.constructor = Window_OnyxInvGold;

  // El padding estándar (18) hace que con altura 48 el área útil sea ~12px y recorte el icono.
  // Reducimos padding para que se dibuje correctamente.
  Window_OnyxInvGold.prototype.standardPadding = function() {
    return 0;
  };

  Window_OnyxInvGold.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
  };

  Window_OnyxInvGold.prototype.formatGold = function(v) {
    var n = Number(v) || 0;
    var s = String(Math.floor(n));
    // separadores de miles
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  Window_OnyxInvGold.prototype.refresh = function() {
    this.contents.clear();
    var pad = 8;
    var y0 = Math.floor((this.contentsHeight() - this.lineHeight()) / 2);

    var iconX = GOLD_X_ICON_INDEX;
    if (iconX > 0) {
      this.drawIcon(iconX, pad, y0);
      pad += Window_Base._iconWidth + 4;
    } else {
      this.changeTextColor(this.systemColor());
      this.drawText("X", pad, y0, 20, "left");
      this.resetTextColor();
      pad += 20;
    }

    var gold = $gameParty && $gameParty.gold ? $gameParty.gold() : 0;
    var txt = this.formatGold(gold);
    this.resetTextColor();
    this.contents.fontSize = this.standardFontSize();
    this.drawText(txt, pad, y0, this.contentsWidth() - pad - 4, "left");
  };

  Window_OnyxInvContent.prototype.refresh = function() {
    this.contents.clear();
    var x = 12;
    var y = 8;
    var w = this.contentsWidth() - 24;

    if (!this._item) {
      this.drawText("Sin item.", x, y, w);
      return;
    }

    if (this._tab === "desc") {
      var desc = plainText(this._item.description);
      if (!desc) desc = "—";
      var wrapped = this.wrapTextEx(desc, w);
      // drawTextEx procesa comandos de texto (colores, variables, etc.) y respeta \n
      this.resetTextColor();
      this.drawTextEx(wrapped, x, y);
      return;
    }

    // Las demás tabs estarán listas pero por ahora sin contenido
    this.drawText("Próximamente.", x, y, w);
  };

  function canOpenInventoryFromMap() {
    if (!$gamePlayer || !$gameMap) return false;
    if ($gameMessage && $gameMessage.isBusy()) return false;
    if (SceneManager.isSceneChanging()) return false;
    if (BLOCK_B_EVENT && $gameMap.isEventRunning()) return false;
    return true;
  }

  if (OPEN_WITH_B) {
    var _Scene_Map_update = Scene_Map.prototype.update;
    Scene_Map.prototype.update = function() {
      _Scene_Map_update.call(this);
      if (Input.isTriggered(HOTKEY_INV) && canOpenInventoryFromMap()) {
        SceneManager.push(Scene_OnyxInventory);
      }
    };
  }

  window.Scene_OnyxInventory = Scene_OnyxInventory;

  // ---------------------------------------------------------------------------
  // Overrides Game_Party (backend)
  // ---------------------------------------------------------------------------
  var _Game_Party_initAllItems = Game_Party.prototype.initAllItems;
  Game_Party.prototype.initAllItems = function() {
    _Game_Party_initAllItems.call(this);
    normalizeSlots(this);
  };

  var _Game_Party_numItems = Game_Party.prototype.numItems;
  Game_Party.prototype.numItems = function(item) {
    var k = kindOf(item);
    if (!k) return _Game_Party_numItems.call(this, item);
    return sumAmount(this, item);
  };

  var _Game_Party_maxItems = Game_Party.prototype.maxItems;
  Game_Party.prototype.maxItems = function(item) {
    var k = kindOf(item);
    if (!k) return _Game_Party_maxItems.call(this, item);
    // por diseño: max stack por slot, no max total del inventario
    return isStackable(item) ? MAX_STACK : 1;
  };

  var _Game_Party_hasMaxItems = Game_Party.prototype.hasMaxItems;
  Game_Party.prototype.hasMaxItems = function(item) {
    var k = kindOf(item);
    if (!k) return _Game_Party_hasMaxItems.call(this, item);
    // max por slot no impide tener más stacks; aquí interpretamos "tiene max" como "no hay espacio para sumar 1"
    normalizeSlots(this);
    if (!item) return false;
    if (!isStackable(item)) {
      return firstEmptySlotIndex(this) < 0;
    }
    // si hay stack con espacio o slot vacío, no está al máximo "global"
    var id = Number(item.id) || 0;
    for (var i = 0; i < SLOT_COUNT; i++) {
      var s = this._onyxInvSlots[i];
      if (!s) return false;
      if (s.kind === "item" && Number(s.id) === id && (Number(s.amount) || 0) < MAX_STACK) return false;
    }
    return true;
  };

  var _Game_Party_allItems = Game_Party.prototype.allItems;
  Game_Party.prototype.allItems = function() {
    // para menús: devolver lista única por objeto (cantidad se consulta por numItems)
    normalizeSlots(this);
    return uniqueObjectsFromSlots(this, null);
  };

  var _Game_Party_items = Game_Party.prototype.items;
  Game_Party.prototype.items = function() {
    normalizeSlots(this);
    return uniqueObjectsFromSlots(this, "item");
  };

  var _Game_Party_weapons = Game_Party.prototype.weapons;
  Game_Party.prototype.weapons = function() {
    normalizeSlots(this);
    return uniqueObjectsFromSlots(this, "weapon");
  };

  var _Game_Party_armors = Game_Party.prototype.armors;
  Game_Party.prototype.armors = function() {
    normalizeSlots(this);
    return uniqueObjectsFromSlots(this, "armor");
  };

  var _Game_Party_gainItem = Game_Party.prototype.gainItem;
  Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
    var k = kindOf(item);
    if (!k) return _Game_Party_gainItem.call(this, item, amount, includeEquip);

    normalizeSlots(this);
    var n = Math.floor(Number(amount) || 0);
    if (n === 0) return;

    if (n > 0) {
      // Si está lleno, no agrega más (regla 4)
      addToSlots(this, item, n);
    } else {
      // quitar
      var removed = removeFromSlots(this, item, -n);
      if (includeEquip && removed < (-n)) {
        this.discardMembersEquip(item, (-n) - removed);
      }
    }

    if ($gameMap) $gameMap.requestRefresh();
  };

  var _Game_Party_loseItem = Game_Party.prototype.loseItem;
  Game_Party.prototype.loseItem = function(item, amount, includeEquip) {
    var k = kindOf(item);
    if (!k) return _Game_Party_loseItem.call(this, item, amount, includeEquip);
    this.gainItem(item, -amount, includeEquip);
  };

})();


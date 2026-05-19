/*:
 * @plugindesc (Onyx) Banco 450 slots con oro en 1 espacio (storage).
 * @author Onyx
 * @version 0.1.0
 *
 * @help
 * Plugin command:
 *   OnyxBank open
 *
 * Ventana "Cantidad" (oro / retirar ítems):
 *   ↑↓ ±1  ←→ ±10
 *   Ctrl+↑↓ ±1000  Ctrl+→ máximo  Ctrl+← mínimo (0)
 *   Guardar oro: solo muestra la cantidad (sin tope en pantalla); Ctrl+→ = todo el oro de la mochila.
 *
 * Lista del banco: barra de scroll vertical a la derecha (rueda del ratón, flechas del cursor,
 * toque/arrastre en la barra). Las flechas del skin de ventana indican más contenido arriba/abajo.
 *   (En MV, Alt comparte la tecla "control" del teclado.)
 *
 * @param bankGoldXIconIndex
 * @text Icono para "Oro" del banco (0 = texto "Oro")
 * @type number
 * @default 0
 *
 * @param partyGoldXIconIndex
 * @text Icono para "Oro" de la mochila (0 = texto "Oro")
 * @type number
 * @default 0
 *
 * Requiere:
 *  - Onyx_InventorySlots (window.OnyxInv)
 *  - Onyx_MaxValues (window.OnyxMaxValues)
 */

(function() {
  "use strict";

  var P = PluginManager.parameters("Onyx_Bank");
  var BANK_GOLD_X_ICON_INDEX = Math.max(0, Math.floor(Number(P.bankGoldXIconIndex || 0)));
  var PARTY_GOLD_X_ICON_INDEX = Math.max(0, Math.floor(Number(P.partyGoldXIconIndex || 0)));

  var BANK_SLOT_COUNT = 450;
  var BANK_COLS = 9; // 9 espacios por fila
  var SLOT_SIZE = 48;
  /** Ancho reservado a la derecha del área de contenido para la barra de desplazamiento. */
  var BANK_SCROLLBAR_W = 12;

  var MAX_STACK = 99; // el inventario usa 99 por slot
  var GOLD_SLOT_INDEX = 0; // oro consume 1 espacio del banco

  function bankMaxPerType() {
    var base = 999;
    if (window.OnyxMaxValues && window.OnyxMaxValues.maxBankItems) base = Number(window.OnyxMaxValues.maxBankItems()) || base;
    var bonus = 0;
    if ($gameSystem && $gameSystem._onyxBankMaxItemsBonus != null) bonus = Number($gameSystem._onyxBankMaxItemsBonus) || 0;
    return Math.max(1, base + bonus);
  }

  function bankMaxGold() {
    var g = 99999999;
    if (window.OnyxMaxValues && window.OnyxMaxValues.maxGold) g = Number(window.OnyxMaxValues.maxGold()) || g;
    return Math.max(1, g);
  }

  function isDbItem(obj) { return !!obj && DataManager.isItem(obj); }
  function isDbWeapon(obj) { return !!obj && DataManager.isWeapon(obj); }
  function isDbArmor(obj) { return !!obj && DataManager.isArmor(obj); }

  function kindOf(obj) {
    if (isDbItem(obj)) return "item";
    if (isDbWeapon(obj)) return "weapon";
    if (isDbArmor(obj)) return "armor";
    return null;
  }

  function keyOf(kind, id) {
    return kind + ":" + Number(id || 0);
  }

  function bankClamp(n, min, max) {
    var v = Number(n);
    if (isNaN(v)) v = min;
    if (v < min) v = min;
    if (v > max) v = max;
    return v;
  }

  /** Formato cantidades (delega en OnyxInv si existe — mismo criterio en inventario y banco). */
  function bankFormatBankSlotNumber(n) {
    if (window.OnyxInv && window.OnyxInv.formatStackDisplay) return window.OnyxInv.formatStackDisplay(n);
    n = Math.max(0, Math.floor(Number(n) || 0));
    if (n < 10000) return { text: String(n), tier: "white" };
    if (n < 10000000) return { text: String(Math.floor(n / 1000)) + "k", tier: "white" };
    if (n < 1000000000) return { text: String(Math.min(999, Math.floor(n / 1000000))) + "M", tier: "green" };
    if (n < 1000000000000) return { text: String(Math.min(999, Math.floor(n / 1000000000))) + "B", tier: "green" };
    if (n < 1e15) return { text: String(Math.min(999, Math.floor(n / 1e12))) + "T", tier: "yellow" };
    if (n < 1e18) return { text: String(Math.min(999, Math.floor(n / 1e15))) + "C", tier: "yellow" };
    return { text: String(Math.min(999, Math.floor(n / 1e18))) + "Q", tier: "yellow" };
  }

  function bankApplyBankSlotNumberColor(win, tier) {
    if (window.OnyxInv && window.OnyxInv.applyStackDisplayColor) {
      window.OnyxInv.applyStackDisplayColor(win, tier);
      return;
    }
    if (tier === "green") win.changeTextColor(win.textColor(6));
    else if (tier === "yellow") win.changeTextColor(win.textColor(17));
    else win.resetTextColor();
  }

  /** Oro en slot 0: objeto siempre presente; "vacío" = cantidad 0. */
  function bankSlotHasContent(slot) {
    if (!slot) return false;
    if (slot.kind === "gold") return (Number(slot.amount) || 0) > 0;
    return true;
  }

  function bankAdaptiveFontSize(win, minFs, maxFs) {
    var cw = win.contentsWidth ? win.contentsWidth() : win.width;
    var ch = win.contentsHeight ? win.contentsHeight() : win.height;
    var dim = Math.min(Number(cw) || 0, Number(ch) || 0);
    if (dim <= 0) return minFs;

    // lineHeight estándar en MV suele ser 36; lo usamos como referencia.
    var ratio = dim / 36;
    var fs = Math.floor(Number(maxFs) * ratio);
    fs = bankClamp(fs, minFs, maxFs);
    return fs;
  }

  /** Contenido de <bank:...> hasta el primer '>' (respeta saltos de línea internos). */
  function bankExtractBankNote(note) {
    var m = String(note || "").match(/<bank:([\s\S]*?)>/i);
    return m ? m[1] : "";
  }

  /** Altura mínima de línea para texto con outline (MV outlineWidth ~4; fs*1.3 se quedaba corto). */
  function bankGoldMinTextLineHeight(win, fs) {
    var ow = 4;
    if (win.contents && typeof win.contents.outlineWidth === "number") ow = win.contents.outlineWidth;
    return Math.max(10, Math.ceil(Number(fs) + ow * 2 + 6));
  }

  /**
   * Tras redimensionar con move(), contents puede seguir con el bitmap antiguo mientras
   * contentsHeight() ya refleja la ventana nueva → texto centrado "abajo" y recortado.
   */
  function bankEffectiveContentsHeight(win) {
    var logical = (win.contentsHeight && win.contentsHeight()) || 0;
    var bh = win.contents && win.contents.height;
    if (bh > 0 && logical > 0) return Math.min(logical, bh);
    return logical || bh || 0;
  }

  function bankGoldFitMetrics(win, text, maxWidth, availHeight) {
    var minFs = 8;
    var baseFs = win.standardFontSize ? win.standardFontSize() : 28;
    var maxFs = bankAdaptiveFontSize(win, minFs, baseFs);
    var s = String(text);
    var ah = Math.max(10, availHeight);
    var fs = maxFs;
    for (;;) {
      win.contents.fontSize = fs;
      var needH = bankGoldMinTextLineHeight(win, fs);
      if (win.textWidth(s) <= maxWidth && needH <= ah) break;
      if (fs <= minFs) break;
      fs--;
    }
    var drawLh = Math.min(ah, Math.max(bankGoldMinTextLineHeight(win, fs), win.lineHeight()));
    win.contents.fontSize = baseFs;
    return { fs: fs, drawLh: drawLh, text: s, baseFs: baseFs };
  }

  function bankDrawGoldWithMetrics(win, m, x, y, maxWidth, align) {
    win.contents.fontSize = m.fs;
    win.contents.drawText(m.text, x, y, maxWidth, m.drawLh, align || "left");
    win.contents.fontSize = m.baseFs;
  }

  /** Dibuja oro ajustado a ancho y alto útil desde y (sin recorte vertical por lineHeight). */
  function bankDrawFittedGoldAmount(win, text, x, y, maxWidth, align) {
    var ch = bankEffectiveContentsHeight(win);
    var availH = Math.max(10, ch - y);
    var m = bankGoldFitMetrics(win, text, maxWidth, availH);
    bankDrawGoldWithMetrics(win, m, x, y, maxWidth, align);
  }

  function bankReadWindowLayouts() {
    try {
      var s = localStorage.getItem("onyx_window_layouts");
      if (!s) return {};
      return JSON.parse(s) || {};
    } catch (e) {
      return {};
    }
  }

  function bankApplySavedLayout(sceneName, windowId, win) {
    if (!win) return;
    var layouts = bankReadWindowLayouts();
    var key = sceneName + "::" + windowId;
    var saved = layouts[key];
    if (!saved) return;
    if (typeof saved.x !== "number" || typeof saved.y !== "number") return;
    if (typeof saved.w !== "number" || typeof saved.h !== "number") return;
    if (saved.w < 10 || saved.h < 10) return;

    var boxW = Graphics.boxWidth || 816;
    var boxH = Graphics.boxHeight || 624;
    if (saved.x > boxW + 10 || saved.y > boxH + 10) return;

    var prevW = win.width;
    var prevH = win.height;
    if (typeof win.move === "function") {
      win.move(saved.x, saved.y, saved.w, saved.h);
    } else {
      win.x = saved.x;
      win.y = saved.y;
      win.width = saved.w;
      win.height = saved.h;
    }
    // MV no recrea el bitmap al move(); sin esto, contents queda pequeño y el oro se recorta abajo.
    if (typeof win.createContents === "function" && (win.width !== prevW || win.height !== prevH)) {
      win.createContents();
    }
    if (win.refresh) win.refresh();
  }

  function normalizeBankSlots() {
    if (!$gameSystem) return;
    if (!$gameSystem._onyxBankSlots || !Array.isArray($gameSystem._onyxBankSlots)) {
      $gameSystem._onyxBankSlots = new Array(BANK_SLOT_COUNT);
    }
    if ($gameSystem._onyxBankSlots.length !== BANK_SLOT_COUNT) {
      var next = new Array(BANK_SLOT_COUNT);
      for (var i = 0; i < BANK_SLOT_COUNT; i++) next[i] = null;
      for (var j = 0; j < Math.min(BANK_SLOT_COUNT, $gameSystem._onyxBankSlots.length); j++) {
        next[j] = $gameSystem._onyxBankSlots[j];
      }
      $gameSystem._onyxBankSlots = next;
    }
    // Slot 0 = oro siempre: icono fijo; cantidad 0..max (incluye 0 visible).
    var goldAmount = Number($gameSystem._onyxBankGold || 0);
    if (goldAmount < 0) goldAmount = 0;
    if (goldAmount > bankMaxGold()) goldAmount = bankMaxGold();
    $gameSystem._onyxBankGold = goldAmount;
    $gameSystem._onyxBankSlots[GOLD_SLOT_INDEX] = { kind: "gold", id: 0, amount: goldAmount };

    // Limpiar entradas inválidas y clamplear tipos.
    for (var s = 0; s < BANK_SLOT_COUNT; s++) {
      if (s === GOLD_SLOT_INDEX) continue;
      var slot = $gameSystem._onyxBankSlots[s];
      if (!slot) continue;
      if (!slot.kind || !slot.id || slot.amount == null) {
        $gameSystem._onyxBankSlots[s] = null;
        continue;
      }
      if (slot.kind !== "item" && slot.kind !== "weapon" && slot.kind !== "armor") {
        $gameSystem._onyxBankSlots[s] = null;
        continue;
      }
      if (Number(slot.amount) <= 0) $gameSystem._onyxBankSlots[s] = null;
    }
  }

  function bankSlots() {
    normalizeBankSlots();
    return $gameSystem._onyxBankSlots;
  }

  function findBankSlotIndex(kind, id) {
    var slots = bankSlots();
    var k = keyOf(kind, id);
    for (var i = 1; i < BANK_SLOT_COUNT; i++) {
      var s = slots[i];
      if (!s) continue;
      if (s.kind === kind && Number(s.id) === Number(id)) return i;
    }
    return -1;
  }

  function firstEmptyBankSlotIndex() {
    var slots = bankSlots();
    for (var i = 1; i < BANK_SLOT_COUNT; i++) {
      if (!slots[i]) return i;
    }
    return -1;
  }

  function bankGetAmount(kind, id) {
    var idx = findBankSlotIndex(kind, id);
    if (idx < 0) return 0;
    return Number(bankSlots()[idx].amount) || 0;
  }

  // Agrega al banco con regla 13: solo 1 slot por tipo (kind+id).
  // Retorna cuántas unidades efectivamente se agregaron.
  function bankAdd(kind, id, amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (amount <= 0) return 0;

    var maxPerType = bankMaxPerType();
    var slots = bankSlots();
    var idx = findBankSlotIndex(kind, id);
    if (idx < 0) {
      idx = firstEmptyBankSlotIndex();
      if (idx < 0) return 0;
      slots[idx] = { kind: kind, id: Number(id) || 0, amount: 0 };
    }

    var current = Number(slots[idx].amount) || 0;
    var capLeft = maxPerType - current;
    if (capLeft <= 0) return 0;
    var add = Math.min(capLeft, amount);
    slots[idx].amount = current + add;
    return add;
  }

  function bankRemove(kind, id, amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (amount <= 0) return 0;

    var slots = bankSlots();
    var idx = findBankSlotIndex(kind, id);
    if (idx < 0) return 0;
    var current = Number(slots[idx].amount) || 0;
    var take = Math.min(current, amount);
    var newAmt = current - take;
    if (newAmt <= 0) slots[idx] = null;
    else slots[idx].amount = newAmt;
    return take;
  }

  function bankGetGold() {
    normalizeBankSlots();
    return Number($gameSystem._onyxBankGold) || 0;
  }

  function bankSetGold(amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    var maxG = bankMaxGold();
    if (amount > maxG) amount = maxG;
    $gameSystem._onyxBankGold = amount;
    normalizeBankSlots();
  }

  function bankAddGold(amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (amount <= 0) return 0;
    var current = bankGetGold();
    var left = bankMaxGold() - current;
    if (left <= 0) return 0;
    var add = Math.min(left, amount);
    bankSetGold(current + add);
    return add;
  }

  function bankRemoveGold(amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (amount <= 0) return 0;
    var current = bankGetGold();
    var take = Math.min(current, amount);
    bankSetGold(current - take);
    return take;
  }

  // Unidades que aún caben en la mochila para un ítem (huecos en pilas + slots vacíos * max por pila).
  function inventorySpaceForItemUnits(itemId) {
    var obj = $dataItems[Number(itemId)];
    if (!obj) return 0;
    var cap = (window.OnyxInv && window.OnyxInv.maxStackForItem) ? window.OnyxInv.maxStackForItem(obj) : MAX_STACK;
    if (!window.OnyxInv || !window.OnyxInv.slots) return 0;
    var slots = window.OnyxInv.slots();
    var space = 0;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (!s) {
        space += cap;
        continue;
      }
      if (s.kind === "item" && Number(s.id) === Number(itemId)) {
        space += Math.max(0, cap - (Number(s.amount) || 0));
      }
    }
    return space;
  }

  function maxWithdrawForItem(itemId, bankAmount) {
    var maxAdd = inventorySpaceForItemUnits(itemId);
    return Math.max(0, Math.min(Number(bankAmount) || 0, maxAdd));
  }

  function gainToInventory(obj, amount) {
    amount = Math.max(0, Math.floor(Number(amount) || 0));
    if (amount <= 0) return 0;

    var before = $gameParty.numItems(obj);
    $gameParty.gainItem(obj, amount, false);
    var after = $gameParty.numItems(obj);
    return Math.max(0, after - before);
  }

  function withdrawFromInventorySlot(slotIndex, amount) {
    // Para depositar al banco usamos el slot seleccionado para descontar,
    // evitando que loseItem quite de otro stack.
    var invSlots = window.OnyxInv.slots();
    var s = invSlots[slotIndex];
    if (!s) return 0;
    var canTake = Math.min(Number(s.amount) || 0, Math.floor(Number(amount) || 0));
    if (canTake <= 0) return 0;
    s.amount = Number(s.amount) - canTake;
    if (Number(s.amount) <= 0) invSlots[slotIndex] = null;
    if ($gameMap) $gameMap.requestRefresh();
    return canTake;
  }

  function depositFromInventorySlotToBank(slotIndex) {
    var invSlots = window.OnyxInv.slots();
    var s = invSlots[slotIndex];
    if (!s) return 0;
    if (s.kind === "gold") return 0;

    var kind = s.kind;
    var id = Number(s.id) || 0;
    var amount = Number(s.amount) || 0;

    // Regla 5/13: el banco agrega todo lo que quepa (hasta MAX por tipo) en su único slot.
    var added = bankAdd(kind, id, amount);
    if (added > 0) withdrawFromInventorySlot(slotIndex, added);
    return added;
  }

  // Retirar de banco hacia inventario (regla 5 con ventana para items, y sin ventana para arma/armadura).
  function withdrawFromBankToInventory(bankSlotIndex, amount) {
    var slots = bankSlots();
    var s = slots[bankSlotIndex];
    if (!s) return 0;
    if (s.kind === "gold") {
      var takeG = bankRemoveGold(amount);
      if (takeG > 0) $gameParty.gainGold(takeG);
      return takeG;
    }

    var kind = s.kind;
    var id = Number(s.id) || 0;
    var qty = Math.max(0, Math.floor(Number(amount) || 0));

    var obj = null;
    if (kind === "item") obj = $dataItems[id];
    else if (kind === "weapon") obj = $dataWeapons[id];
    else if (kind === "armor") obj = $dataArmors[id];

    if (!obj) return 0;

    var beforeBank = Number(s.amount) || 0;
    if (qty > beforeBank) qty = beforeBank;

    var gained = gainToInventory(obj, qty);
    if (gained > 0) bankRemove(kind, id, gained);
    return gained;
  }

  // ---------------------------------------------------------------------------
  // Ventanas
  // ---------------------------------------------------------------------------
  function Window_OnyxBankSlots(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }
  Window_OnyxBankSlots.prototype = Object.create(Window_Selectable.prototype);
  Window_OnyxBankSlots.prototype.constructor = Window_OnyxBankSlots;
  Window_OnyxBankSlots.prototype.initialize = function(x, y, width, height) {
    this._swapFrom = null;
    this._onBankScrollbarDrag = false;
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
    if (this.maxItems() > 0) this.select(0);
  };

  Window_OnyxBankSlots.prototype.refresh = function() {
    Window_Selectable.prototype.refresh.call(this);
    this.paintBankScrollbar();
  };

  Window_OnyxBankSlots.prototype.paintBankScrollbar = function() {
    if (!this.contents) return;
    var sbw = BANK_SCROLLBAR_W;
    var bx = this.contents.width - sbw;
    var ch = this.contents.height;
    if (bx < 0 || sbw < 4) return;
    var pad = 2;
    var trackX = bx + pad;
    var trackW = sbw - pad * 2;
    if (trackW < 2) return;
    var trackTop = 4;
    var trackH = Math.max(8, ch - 8);
    this.contents.paintOpacity = 200;
    this.contents.fillRect(trackX, trackTop, trackW, trackH, "rgba(24,28,36,0.92)");
    this.contents.paintOpacity = 255;
    var maxTop = this.maxTopRow();
    if (maxTop <= 0) return;
    var rows = this.maxRows();
    var pageRows = this.maxPageRows();
    var thumbH = Math.max(14, Math.floor(trackH * Math.min(1, pageRows / Math.max(1, rows))));
    var span = Math.max(1, trackH - thumbH);
    var ty = trackTop + Math.floor((this.topRow() / maxTop) * span);
    if (ty + thumbH > trackTop + trackH) ty = trackTop + trackH - thumbH;
    this.contents.fillRect(trackX, ty, trackW, thumbH, "rgba(210,215,230,0.95)");
  };

  Window_OnyxBankSlots.prototype.onBankScrollbarPointerY = function(localY) {
    var maxTop = this.maxTopRow();
    if (maxTop <= 0) return;
    var innerTop = this.padding;
    var innerH = Math.max(1, this.height - this.padding * 2);
    var r = (localY - innerTop) / innerH;
    if (r < 0) r = 0;
    if (r > 1) r = 1;
    this.setTopRow(Math.round(r * maxTop));
  };

  var _Window_OnyxBankSlots_processTouch = Window_Selectable.prototype.processTouch;
  Window_OnyxBankSlots.prototype.processTouch = function() {
    if (!this.isOpenAndActive()) {
      this._onBankScrollbarDrag = false;
      _Window_OnyxBankSlots_processTouch.call(this);
      return;
    }
    var sbRight = this.width - this.standardPadding();
    var sbLeft = sbRight - BANK_SCROLLBAR_W;
    if (TouchInput.isTriggered() && this.isTouchedInsideFrame()) {
      var lx = this.canvasToLocalX(TouchInput.x);
      var ly = this.canvasToLocalY(TouchInput.y);
      if (lx >= sbLeft && lx < sbRight && ly >= this.padding && ly < this.height - this.padding) {
        this._onBankScrollbarDrag = true;
        this.onBankScrollbarPointerY(ly);
        return;
      }
    }
    if (this._onBankScrollbarDrag) {
      if (TouchInput.isPressed()) {
        this.onBankScrollbarPointerY(this.canvasToLocalY(TouchInput.y));
      } else {
        this._onBankScrollbarDrag = false;
      }
      return;
    }
    _Window_OnyxBankSlots_processTouch.call(this);
  };
  Window_OnyxBankSlots.prototype.maxItems = function() {
    return BANK_SLOT_COUNT;
  };
  Window_OnyxBankSlots.prototype.maxCols = function() {
    return BANK_COLS;
  };
  Window_OnyxBankSlots.prototype.spacing = function() { return 0; };
  Window_OnyxBankSlots.prototype.itemWidth = function() { return SLOT_SIZE; };
  Window_OnyxBankSlots.prototype.itemHeight = function() { return SLOT_SIZE; };
  Window_OnyxBankSlots.prototype.itemRect = function(index) {
    var cols = this.maxCols();
    var w = this.itemWidth();
    var h = this.itemHeight();
    var x = (index % cols) * (w + this.spacing());
    var y = Math.floor(index / cols) * (h + this.spacing());
    return new Rectangle(x, y, w, h);
  };
  Window_OnyxBankSlots.prototype.drawItem = function(index) {
    var rect = this.itemRect(index);
    var slots = bankSlots();
    var s = slots[index];
    this.resetTextColor();
    this.contents.paintOpacity = 255;

    if (index === GOLD_SLOT_INDEX) {
      var g = Number(s && s.amount) || bankGetGold() || 0;
      var ix = rect.x + Math.floor((rect.width - Window_Base._iconWidth) / 2);
      var iy = rect.y + Math.floor((rect.height - Window_Base._iconHeight) / 2);
      if (BANK_GOLD_X_ICON_INDEX > 0) {
        this.drawIcon(BANK_GOLD_X_ICON_INDEX, ix, iy);
      } else {
        this.changeTextColor(this.systemColor());
        this.drawText("Oro", ix, iy + 8, Window_Base._iconWidth, "center");
        this.resetTextColor();
      }
      var fmtG = bankFormatBankSlotNumber(g);
      this.contents.fontSize = 10;
      bankApplyBankSlotNumberColor(this, fmtG.tier);
      this.drawText(fmtG.text, ix, iy + 18, Window_Base._iconWidth, "right");
      this.resetTextColor();
      this.contents.fontSize = this.standardFontSize();
      return;
    }

    if (!s) return;

    var obj = null;
    if (s.kind === "item") obj = $dataItems[Number(s.id)];
    else if (s.kind === "weapon") obj = $dataWeapons[Number(s.id)];
    else if (s.kind === "armor") obj = $dataArmors[Number(s.id)];

    if (!obj) return;

    var ix = rect.x + Math.floor((rect.width - Window_Base._iconWidth) / 2);
    var iy = rect.y + Math.floor((rect.height - Window_Base._iconHeight) / 2);
    this.drawIcon(obj.iconIndex, ix, iy);

    var amt = Number(s.amount) || 0;
    this.contents.fontSize = 10;
    var fmt = bankFormatBankSlotNumber(amt);
    bankApplyBankSlotNumberColor(this, fmt.tier);
    this.drawText(fmt.text, ix, iy + 18, Window_Base._iconWidth, "right");
    this.resetTextColor();
    this.contents.fontSize = this.standardFontSize();
  };

  // Ventana inventario para la escena banco (28 slots, mismos datos que OnyxInv)
  function Window_OnyxBankInvSlots(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }
  Window_OnyxBankInvSlots.prototype = Object.create(Window_Selectable.prototype);
  Window_OnyxBankInvSlots.prototype.constructor = Window_OnyxBankInvSlots;
  Window_OnyxBankInvSlots.prototype.initialize = function(x, y, width, height) {
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
    if (this.maxItems() > 0) this.select(0);
  };
  Window_OnyxBankInvSlots.prototype.maxItems = function() {
    if (window.OnyxInv && window.OnyxInv.slotCount) return window.OnyxInv.slotCount();
    return 28;
  };
  Window_OnyxBankInvSlots.prototype.maxCols = function() {
    return 6; // 6 columnas para soportar 28 slots
  };
  Window_OnyxBankInvSlots.prototype.spacing = function() { return 0; };
  Window_OnyxBankInvSlots.prototype.itemWidth = function() { return SLOT_SIZE; };
  Window_OnyxBankInvSlots.prototype.itemHeight = function() { return SLOT_SIZE; };
  Window_OnyxBankInvSlots.prototype.itemRect = function(index) {
    var cols = this.maxCols();
    var w = this.itemWidth();
    var h = this.itemHeight();
    var x = (index % cols) * (w + this.spacing());
    var y = Math.floor(index / cols) * (h + this.spacing());
    return new Rectangle(x, y, w, h);
  };
  Window_OnyxBankInvSlots.prototype.drawItem = function(index) {
    var rect = this.itemRect(index);
    var slots = window.OnyxInv.slots ? window.OnyxInv.slots() : [];
    var s = slots[index];
    if (!s) return;

    var obj = null;
    if (s.kind === "item") obj = $dataItems[Number(s.id)];
    else if (s.kind === "weapon") obj = $dataWeapons[Number(s.id)];
    else if (s.kind === "armor") obj = $dataArmors[Number(s.id)];

    if (!obj) return;

    var ix = rect.x + Math.floor((rect.width - Window_Base._iconWidth) / 2);
    var iy = rect.y + Math.floor((rect.height - Window_Base._iconHeight) / 2);
    this.drawIcon(obj.iconIndex, ix, iy);

    var amt = Number(s.amount) || 0;
    if (amt > 0) {
      this.contents.fontSize = 10;
      var fmtInv = bankFormatBankSlotNumber(amt);
      bankApplyBankSlotNumberColor(this, fmtInv.tier);
      this.drawText(fmtInv.text, ix, iy + 18, Window_Base._iconWidth, "right");
      this.resetTextColor();
      this.contents.fontSize = this.standardFontSize();
    }
  };

  // Ventana simple de cantidad para retirar (items no arma/armadura)
  function Window_OnyxBankQty(x, y, width, height, initial, maxValue, hideMaxDisplay) {
    this._value = initial || 1;
    this._max = Math.max(0, Math.floor(Number(maxValue) || 0));
    this._hideMaxDisplay = !!hideMaxDisplay;
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
  }
  Window_OnyxBankQty.prototype = Object.create(Window_Base.prototype);
  Window_OnyxBankQty.prototype.constructor = Window_OnyxBankQty;
  Window_OnyxBankQty.prototype.standardPadding = function() { return 18; };
  Window_OnyxBankQty.prototype.refresh = function() {
    this.contents.clear();
    var label = "Cantidad";
    this.changeTextColor(this.systemColor());
    this.drawText(label, 0, 0, this.contentsWidth(), "center");
    this.resetTextColor();
    var v = Math.max(0, Math.floor(Number(this._value) || 0));
    var fs = bankAdaptiveFontSize(this, 12, this.standardFontSize());
    this.contents.fontSize = fs;
    var txt = this._hideMaxDisplay ? String(v) : (String(v) + " / " + String(this._max));
    this.drawText(txt, 0, this.lineHeight(), this.contentsWidth(), "center");
  };
  Window_OnyxBankQty.prototype.setValue = function(v) {
    v = Math.floor(Number(v) || 0);
    if (v < 0) v = 0;
    if (v > this._max) v = this._max;
    this._value = v;
    this.refresh();
  };

  // ---------------------------------------------------------------------------
  // Scene Banco
  // ---------------------------------------------------------------------------

  function Window_OnyxBankGoldHeader(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }
  Window_OnyxBankGoldHeader.prototype = Object.create(Window_Base.prototype);
  Window_OnyxBankGoldHeader.prototype.constructor = Window_OnyxBankGoldHeader;
  Window_OnyxBankGoldHeader.prototype.standardPadding = function() {
    return 6;
  };
  Window_OnyxBankGoldHeader.prototype.lineHeight = function() {
    var ch = this.contentsHeight ? this.contentsHeight() : this.height;
    var base = Window_Base.prototype.lineHeight.call(this);
    if (ch < base) return Math.max(10, ch);
    return base;
  };
  Window_OnyxBankGoldHeader.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
  };
  Window_OnyxBankGoldHeader.prototype.refresh = function() {
    this.contents.clear();
    var g = bankGetGold();
    var pad0 = 8;
    var ch = bankEffectiveContentsHeight(this);
    var cw = this.contentsWidth();
    var s = String(Math.floor(g));
    var iconW = Window_Base._iconWidth;
    var iconH = Window_Base._iconHeight;
    if (BANK_GOLD_X_ICON_INDEX > 0) {
      var maxW = Math.max(40, cw - pad0 - iconW - 4);
      var m = bankGoldFitMetrics(this, s, maxW, ch);
      var blockH = Math.max(iconH, m.drawLh);
      var yRow = Math.max(0, Math.floor((ch - blockH) / 2));
      this.drawIcon(BANK_GOLD_X_ICON_INDEX, pad0, yRow + Math.floor((blockH - iconH) / 2));
      var xGold = pad0 + iconW + 4;
      bankDrawGoldWithMetrics(this, m, xGold, yRow + Math.floor((blockH - m.drawLh) / 2), cw - xGold, "left");
    } else {
      var oroW = 80;
      var xGold = pad0 + oroW;
      var maxW = Math.max(40, cw - xGold);
      var m = bankGoldFitMetrics(this, s, maxW, ch);
      var lh = this.lineHeight();
      var blockH = Math.max(lh, m.drawLh);
      var yRow = Math.max(0, Math.floor((ch - blockH) / 2));
      this.changeTextColor(this.systemColor());
      this.drawText("Oro", pad0, yRow + Math.floor((blockH - lh) / 2), oroW, "left");
      this.resetTextColor();
      bankDrawGoldWithMetrics(this, m, xGold, yRow + Math.floor((blockH - m.drawLh) / 2), maxW, "left");
    }
  };

  // Header superior izquierdo: muestra el nombre del item seleccionado (banco o mochila).
  function Window_OnyxBankSlotHeader(x, y, width, height) {
    this._slot = null;
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
  }
  Window_OnyxBankSlotHeader.prototype = Object.create(Window_Base.prototype);
  Window_OnyxBankSlotHeader.prototype.constructor = Window_OnyxBankSlotHeader;
  Window_OnyxBankSlotHeader.prototype.standardPadding = function() {
    return 6;
  };
  Window_OnyxBankSlotHeader.prototype.lineHeight = function() {
    var ch = this.contentsHeight ? this.contentsHeight() : this.height;
    var base = Window_Base.prototype.lineHeight.call(this);
    if (ch < base) return Math.max(10, ch);
    return base;
  };

  Window_OnyxBankSlotHeader.prototype.setSlot = function(slot) {
    this._slot = slot || null;
    this.refresh();
  };

  Window_OnyxBankSlotHeader.prototype.refresh = function() {
    this.contents.clear();
    var slot = this._slot;
    if (!slot) {
      this.changeTextColor(this.systemColor());
      this.drawText("Banco", 0, 0, this.contentsWidth(), "center");
      this.resetTextColor();
      return;
    }

    if (slot.kind === "gold") {
      this.changeTextColor(this.systemColor());
      var gold = Number(slot.amount) || bankGetGold();
      var txt = "Oro: " + String(gold);
      var ch = bankEffectiveContentsHeight(this);
      var cw = this.contentsWidth();
      var m = bankGoldFitMetrics(this, txt, cw, ch);
      var y0 = Math.max(0, Math.floor((ch - m.drawLh) / 2));
      bankDrawGoldWithMetrics(this, m, 0, y0, cw, "center");
      this.resetTextColor();
      return;
    }

    var kind = slot.kind;
    var id = Number(slot.id) || 0;
    var qty = Number(slot.amount) || 0;
    var obj = null;
    if (kind === "item") obj = $dataItems[id];
    else if (kind === "weapon") obj = $dataWeapons[id];
    else if (kind === "armor") obj = $dataArmors[id];

    var name = obj && obj.name ? obj.name : "—";

    this.contents.fontSize = bankAdaptiveFontSize(this, 10, this.standardFontSize());
    this.changeTextColor(this.normalColor());
    this.drawText(name, 0, 0, this.contentsWidth(), "center");
    this.resetTextColor();
  };

  function Window_OnyxPartyGoldHeader(x, y, width, height, iconIndex) {
    this._iconIndex = iconIndex || 0;
    this.initialize.apply(this, arguments);
  }
  Window_OnyxPartyGoldHeader.prototype = Object.create(Window_Base.prototype);
  Window_OnyxPartyGoldHeader.prototype.constructor = Window_OnyxPartyGoldHeader;
  Window_OnyxPartyGoldHeader.prototype.standardPadding = function() {
    return 6;
  };
  Window_OnyxPartyGoldHeader.prototype.lineHeight = function() {
    var ch = this.contentsHeight ? this.contentsHeight() : this.height;
    var base = Window_Base.prototype.lineHeight.call(this);
    if (ch < base) return Math.max(10, ch);
    return base;
  };
  Window_OnyxPartyGoldHeader.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
  };
  Window_OnyxPartyGoldHeader.prototype.refresh = function() {
    this.contents.clear();
    var g = $gameParty && $gameParty.gold ? $gameParty.gold() : 0;
    var pad = 4;
    var ch = bankEffectiveContentsHeight(this);
    var cw = this.contentsWidth();
    var iconH = Window_Base._iconHeight;
    var iconW = Window_Base._iconWidth;
    var s = String(Math.floor(g));
    if (this._iconIndex > 0) {
      var maxW = Math.max(24, cw - pad - iconW - 4);
      var m = bankGoldFitMetrics(this, s, maxW, ch);
      var blockH = Math.max(iconH, m.drawLh);
      var yRow = Math.max(0, Math.floor((ch - blockH) / 2));
      this.drawIcon(this._iconIndex, pad, yRow + Math.floor((blockH - iconH) / 2));
      var xGold = pad + iconW + 4;
      bankDrawGoldWithMetrics(this, m, xGold, yRow + Math.floor((blockH - m.drawLh) / 2), cw - xGold, "left");
    } else {
      var label = "Oro";
      var labelW = Math.ceil(this.textWidth(label));
      var xGold = pad + labelW + 4;
      var maxW = Math.max(24, cw - xGold);
      var m = bankGoldFitMetrics(this, s, maxW, ch);
      var lh = this.lineHeight();
      var blockH = Math.max(lh, m.drawLh);
      var yRow = Math.max(0, Math.floor((ch - blockH) / 2));
      this.changeTextColor(this.systemColor());
      this.drawText(label, pad, yRow + Math.floor((blockH - lh) / 2), labelW, "left");
      this.resetTextColor();
      bankDrawGoldWithMetrics(this, m, xGold, yRow + Math.floor((blockH - m.drawLh) / 2), maxW, "left");
    }
  };

  function Window_OnyxBankItemDesc(x, y, width, height) {
    this.initialize.apply(this, arguments);
  }
  Window_OnyxBankItemDesc.prototype = Object.create(Window_Base.prototype);
  Window_OnyxBankItemDesc.prototype.constructor = Window_OnyxBankItemDesc;
  Window_OnyxBankItemDesc.prototype.standardPadding = function() {
    return 8;
  };
  Window_OnyxBankItemDesc.prototype.initialize = function(x, y, width, height) {
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this._slot = null;
    this.refresh();
  };
  Window_OnyxBankItemDesc.prototype.setSlot = function(slot) {
    this._slot = slot || null;
    this.refresh();
  };

  function stripEscapeCodesForMeasure(text) {
    return String(text || "")
      .replace(/\\[A-Za-z]+\[[^\]]*\]/g, "")
      .replace(/\\[A-Za-z]+/g, "")
      .replace(/\x1b/g, "");
  }
  function wrapTextEx(text, maxWidth, win) {
    var words = String(text || "").split(" ");
    var lines = [];
    var line = "";
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!w) continue;
      var test = line ? (line + " " + w) : w;
      var measure = stripEscapeCodesForMeasure(test);
      if (win.textWidth(measure) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines.join("\n");
  }
  Window_OnyxBankItemDesc.prototype.refresh = function() {
    this.contents.clear();
    if (!this._slot) {
      this.drawText("—", 6, 0, this.contentsWidth() - 6, "left");
      return;
    }
    if (this._slot.kind === "gold") {
      var gQty = Number(this._slot.amount) || bankGetGold() || 0;
      var gStr = (window.OnyxInv && window.OnyxInv.formatQuantityThousands)
        ? window.OnyxInv.formatQuantityThousands(gQty)
        : String(Math.max(0, Math.floor(gQty))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      this.changeTextColor(this.systemColor());
      this.drawText("Cantidad: " + gStr, 6, 0, this.contentsWidth() - 12, "left");
      this.resetTextColor();
      return;
    }
    var kind = this._slot.kind;
    var id = Number(this._slot.id) || 0;
    var qty = Number(this._slot.amount) || 0;
    var obj = null;
    if (kind === "item") obj = $dataItems[id];
    else if (kind === "weapon") obj = $dataWeapons[id];
    else if (kind === "armor") obj = $dataArmors[id];
    if (!obj) {
      this.drawText("—", 6, 0, this.contentsWidth() - 6, "left");
      return;
    }
    var ix = 6;
    var y0 = 0;
    var lh = this.lineHeight();
    var maxW = this.contentsWidth() - ix - 6;
    var qtyStr = (window.OnyxInv && window.OnyxInv.formatQuantityThousands)
      ? window.OnyxInv.formatQuantityThousands(qty)
      : String(Math.max(0, Math.floor(qty))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    this.changeTextColor(this.systemColor());
    this.drawText("Cantidad: " + qtyStr, ix, y0, maxW, "left");
    this.resetTextColor();
    var fsDesc = bankAdaptiveFontSize(this, 10, this.standardFontSize());
    this.contents.fontSize = fsDesc;
    var bankBlock = bankExtractBankNote(obj.note || "").replace(/\r/g, "");
    var paras = bankBlock.split("\n");
    var wrappedParts = [];
    var hasAny = false;
    for (var pi = 0; pi < paras.length; pi++) {
      var rawLine = paras[pi];
      if (rawLine === "") {
        wrappedParts.push("");
        continue;
      }
      if (String(rawLine).replace(/\s/g, "") !== "") hasAny = true;
      wrappedParts.push(wrapTextEx(String(rawLine), maxW, this));
    }
    var wrapped = hasAny ? wrappedParts.join("\n") : "—";
    var yDesc = y0 + lh;
    this.drawTextEx(wrapped, ix, yDesc);
    this.contents.fontSize = this.standardFontSize();

    var params = obj.params || null;
    if (params && (kind === "weapon" || kind === "armor")) {
      var wrappedLines = String(wrapped || "").split("\n").length;
      var yStats = yDesc + wrappedLines * lh;
      var maxLines = 4;
      var drawn = 0;
      for (var p = 0; p < params.length && drawn < maxLines; p++) {
        var v = Number(params[p]) || 0;
        if (v === 0) continue;
        var label = (TextManager && TextManager.param) ? TextManager.param(p) : ("P" + p);
        var sign = v > 0 ? "+" : "";
        this.drawText(label + ": " + sign + String(v), ix, yStats + drawn * lh, maxW, "left");
        drawn += 1;
      }
    }
  };

  function Scene_OnyxBank() {
    this.initialize.apply(this, arguments);
  }
  Scene_OnyxBank.prototype = Object.create(Scene_MenuBase.prototype);
  Scene_OnyxBank.prototype.constructor = Scene_OnyxBank;

  function Window_OnyxBankActions(x, y, width, height) {
    this._customWidth = width;
    this._customHeight = height;
    Window_HorzCommand.prototype.initialize.call(this, x, y);
  }
  Window_OnyxBankActions.prototype = Object.create(Window_HorzCommand.prototype);
  Window_OnyxBankActions.prototype.constructor = Window_OnyxBankActions;
  Window_OnyxBankActions.prototype.windowWidth = function() {
    return this._customWidth || Graphics.boxWidth;
  };
  Window_OnyxBankActions.prototype.windowHeight = function() {
    return this._customHeight || this.fittingHeight(1);
  };
  Window_OnyxBankActions.prototype.makeCommandList = function() {
    this.addCommand("guardar todo", "saveAll");
    this.addCommand("guardar oro", "saveGold");
  };

  Scene_OnyxBank.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
  };

  Scene_OnyxBank.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);

    normalizeBankSlots();

    this._helpWindow = new Window_Help(2);
    this._helpWindow.setText("Banco");
    this.addWindow(this._helpWindow);

    var wy = this._helpWindow.height;
    var wh = Graphics.boxHeight - wy;

    var invCols = 6; // 6 slots por fila
    var invRows = Math.ceil(28 / invCols); // 5 filas
    var invSlotsH = invRows * SLOT_SIZE + 36; // incluye padding extra

    // Altura banco igual a la altura del inventario (para regla 3)
    var bankSlotsH = invSlotsH;

    // Ancho de banco (9 slots por fila + franja de scroll)
    var paddingX = 36;
    var bankW = BANK_COLS * SLOT_SIZE + paddingX + BANK_SCROLLBAR_W;
    if (bankW > Graphics.boxWidth - 220) bankW = Graphics.boxWidth - 220;
    var invW = Graphics.boxWidth - bankW;

    var headerH = 48;

    // Encabezado superior izquierdo: nombre del item (en vez de oro del banco)
    this._bankSlotHeader = new Window_OnyxBankSlotHeader(0, wy, bankW, headerH);
    this.addWindow(this._bankSlotHeader);
    this._bankSlotsWindow = new Window_OnyxBankSlots(0, wy + headerH, bankW, bankSlotsH);
    this._bankSlotsWindow.setHandler("ok", this.onBankOk.bind(this));
    this._bankSlotsWindow.setHandler("cancel", this.popScene.bind(this));
    this.addWindow(this._bankSlotsWindow);
    this._invGoldHeader = new Window_OnyxPartyGoldHeader(bankW, wy, invW, headerH, PARTY_GOLD_X_ICON_INDEX);
    this.addWindow(this._invGoldHeader);
    this._invSlotsWindow = new Window_OnyxBankInvSlots(bankW, wy + headerH, invW, invSlotsH);
    this._invSlotsWindow.setHandler("ok", this.onInvDeposit.bind(this));
    this.addWindow(this._invSlotsWindow);
    if (window.OnyxWindowEditor) {
      window.OnyxWindowEditor.registerWindow(this._helpWindow, "bank_help");
      window.OnyxWindowEditor.registerWindow(this._bankSlotHeader, "bank_header");
      window.OnyxWindowEditor.registerWindow(this._bankSlotsWindow, "bank_slots");
      window.OnyxWindowEditor.registerWindow(this._invGoldHeader, "bank_inv_gold");
      window.OnyxWindowEditor.registerWindow(this._invSlotsWindow, "bank_inv_slots");
    }

    // Below bank: description + stats window
    var belowY = wy + headerH + bankSlotsH;
    var cmdH = 44;
    var descH = Math.max(96, Graphics.boxHeight - belowY - cmdH);
    this._itemDescWindow = new Window_OnyxBankItemDesc(0, belowY, bankW, descH);
    this.addWindow(this._itemDescWindow);
    var yCmd = belowY + descH;
    this._cmdWindow = new Window_OnyxBankActions(bankW, yCmd, invW, cmdH);
    this._cmdWindow.setHandler("saveAll", this.onSaveAll.bind(this));
    this._cmdWindow.setHandler("saveGold", this.onSaveGold.bind(this));
    this._cmdWindow.setHandler("cancel", this.onCmdCancel.bind(this));
    this.addWindow(this._cmdWindow);
    if (window.OnyxWindowEditor) {
      window.OnyxWindowEditor.registerWindow(this._itemDescWindow, "bank_desc");
      window.OnyxWindowEditor.registerWindow(this._cmdWindow, "bank_actions");
    }

    // Si existen datos guardados en localStorage, aplicarlos para que el banco
    // conserve el layout incluso sin usar el editor.
    var sceneName = this.constructor && this.constructor.name ? this.constructor.name : "Scene_OnyxBank";
    bankApplySavedLayout(sceneName, "bank_help", this._helpWindow);
    bankApplySavedLayout(sceneName, "bank_header", this._bankSlotHeader);
    bankApplySavedLayout(sceneName, "bank_slots", this._bankSlotsWindow);
    bankApplySavedLayout(sceneName, "bank_inv_gold", this._invGoldHeader);
    bankApplySavedLayout(sceneName, "bank_inv_slots", this._invSlotsWindow);
    bankApplySavedLayout(sceneName, "bank_desc", this._itemDescWindow);
    bankApplySavedLayout(sceneName, "bank_actions", this._cmdWindow);

    this._cmdWindow.deactivate();
    this._bankSlotsWindow.activate();
    this._invSlotsWindow.deactivate();
  };

  function selectNearestNonEmptySlot(win, arr, startIndex, hasContentFn) {
    if (!win || !arr) return;
    var has = hasContentFn || function(s) {
      return !!s;
    };
    var maxI = win.maxItems ? win.maxItems() - 1 : (arr.length - 1);
    var i0 = Math.max(0, Math.min(maxI, startIndex));
    if (has(arr[i0])) {
      win.select(i0);
      return;
    }
    for (var d = 1; d <= maxI; d++) {
      var i1 = i0 - d;
      if (i1 >= 0 && has(arr[i1])) {
        win.select(i1);
        return;
      }
      var i2 = i0 + d;
      if (i2 <= maxI && has(arr[i2])) {
        win.select(i2);
        return;
      }
    }
    win.select(i0);
  }

  Scene_OnyxBank.prototype.update = function() {
    Scene_MenuBase.prototype.update.call(this);
    if (!this._qtyActive) {
      if (Input.isTriggered("onyxInvTabLeft")) {
        this._bankSlotsWindow.activate();
        this._invSlotsWindow.deactivate();
        this._cmdWindow.deactivate();
      } else if (Input.isTriggered("onyxInvTabRight")) {
        this._invSlotsWindow.activate();
        this._bankSlotsWindow.deactivate();
        this._cmdWindow.deactivate();
      } else if (Input.isTriggered("tab")) {
        this._cmdWindow.activate();
        this._bankSlotsWindow.deactivate();
        this._invSlotsWindow.deactivate();
      }
    }
    this.updateQtyPrompt();

    // Hotkeys simples para acciones (por si el jugador no usa mouse).
    if (!this._qtyActive) {
      if (Input.isTriggered("pageup")) {
        this.onSaveAll();
      } else if (Input.isTriggered("pagedown")) {
        this.onSaveGold();
      }
    }

    // Actualizar headers y descripción según el foco.
    if (!this._qtyActive) {
      if (this._invGoldHeader) this._invGoldHeader.refresh();

      var slot = null;
      if (this._bankSlotsWindow && this._bankSlotsWindow.active) {
        var bi = this._bankSlotsWindow.index();
        slot = bankSlots()[bi] || null;
      } else if (this._invSlotsWindow && this._invSlotsWindow.active) {
        var ii = this._invSlotsWindow.index();
        var invSlots = window.OnyxInv && window.OnyxInv.slots ? window.OnyxInv.slots() : [];
        slot = invSlots[ii] || null;
      }
      if (this._itemDescWindow) this._itemDescWindow.setSlot(slot);
      if (this._bankSlotHeader) this._bankSlotHeader.setSlot(slot);
    }
  };

  Scene_OnyxBank.prototype.onCmdCancel = function() {
    this._cmdWindow.deactivate();
    this._bankSlotsWindow.activate();
  };

  Scene_OnyxBank.prototype.onSaveAll = function() {
    // Regla 11: guardar todo inventario en el banco.
    // Depositar por tipo para respetar regla 13 (1 slot por tipo).
    if (!window.OnyxInv) return;
    var invItems = $gameParty.items();
    var invWeapons = $gameParty.weapons();
    var invArmors = $gameParty.armors();

    // items (stack)
    for (var i = 0; i < invItems.length; i++) {
      var obj = invItems[i];
      var kind = kindOf(obj);
      if (!kind) continue;
      var total = $gameParty.numItems(obj);
      var bankCurrent = bankGetAmount(kind, obj.id);
      var capLeft = bankMaxPerType() - bankCurrent;
      if (capLeft <= 0) continue;
      var toMove = Math.min(total, capLeft);
      if (toMove <= 0) continue;

      var bankIdx = findBankSlotIndex(kind, obj.id);
      if (bankIdx < 0 && firstEmptyBankSlotIndex() < 0) continue;

      var added = bankAdd(kind, obj.id, toMove);
      if (added <= 0) continue;

      var beforeInv = $gameParty.numItems(obj);
      $gameParty.loseItem(obj, added, false);
      var afterInv = $gameParty.numItems(obj);
      var removed = Math.max(0, beforeInv - afterInv);
      if (removed < added) bankRemove(kind, obj.id, added - removed);
    }

    // weapons
    for (var w = 0; w < invWeapons.length; w++) {
      var wObj = invWeapons[w];
      var wKind = kindOf(wObj);
      var wTotal = $gameParty.numItems(wObj);
      var wCurrent = bankGetAmount(wKind, wObj.id);
      var wCapLeft = bankMaxPerType() - wCurrent;
      if (wCapLeft <= 0) continue;
      var wMove = Math.min(wTotal, wCapLeft);
      if (wMove <= 0) continue;

      var wIdx = findBankSlotIndex(wKind, wObj.id);
      if (wIdx < 0 && firstEmptyBankSlotIndex() < 0) continue;

      var wAdded = bankAdd(wKind, wObj.id, wMove);
      if (wAdded <= 0) continue;

      var beforeW = $gameParty.numItems(wObj);
      $gameParty.loseItem(wObj, wAdded, false);
      var afterW = $gameParty.numItems(wObj);
      var removedW = Math.max(0, beforeW - afterW);
      if (removedW < wAdded) bankRemove(wKind, wObj.id, wAdded - removedW);
    }

    // armors
    for (var a = 0; a < invArmors.length; a++) {
      var aObj = invArmors[a];
      var aKind = kindOf(aObj);
      var aTotal = $gameParty.numItems(aObj);
      var aCurrent = bankGetAmount(aKind, aObj.id);
      var aCapLeft = bankMaxPerType() - aCurrent;
      if (aCapLeft <= 0) continue;
      var aMove = Math.min(aTotal, aCapLeft);
      if (aMove <= 0) continue;

      var aIdx = findBankSlotIndex(aKind, aObj.id);
      if (aIdx < 0 && firstEmptyBankSlotIndex() < 0) continue;

      var aAdded = bankAdd(aKind, aObj.id, aMove);
      if (aAdded <= 0) continue;

      var beforeA = $gameParty.numItems(aObj);
      $gameParty.loseItem(aObj, aAdded, false);
      var afterA = $gameParty.numItems(aObj);
      var removedA = Math.max(0, beforeA - afterA);
      if (removedA < aAdded) bankRemove(aKind, aObj.id, aAdded - removedA);
    }

    normalizeBankSlots();
    this._bankSlotsWindow.refresh();
    this._invSlotsWindow.refresh();
  };

  Scene_OnyxBank.prototype.onSaveGold = function() {
    // Regla 12: abrir ventana para elegir cantidad y guardar oro.
    var goldHave = $gameParty.gold();
    if (goldHave <= 0) return;
    var bankGold = bankGetGold();
    var maxCanStore = Math.max(0, bankMaxGold() - bankGold);
    if (maxCanStore <= 0) return;
    var initial = Math.min(1, goldHave);
    // Tope de la ventana = oro en mochila (Ctrl+→ = todo el oro que llevas). Al confirmar se respeta cupo del banco.
    this.openQtyPrompt(function(qty) {
      if (qty <= 0) return;
      var toStore = Math.min(qty, goldHave, maxCanStore);
      var removedGold = Math.min(toStore, $gameParty.gold());
      if (removedGold > 0) {
        $gameParty.loseGold(removedGold);
        bankAddGold(removedGold);
        this._bankSlotsWindow.refresh();
        this._invSlotsWindow.refresh();
      }
    }.bind(this), initial, goldHave, { hideMax: true });
  };

  Scene_OnyxBank.prototype.openQtyPrompt = function(callback, initial, maxValue, opts) {
    opts = opts || {};
    // Default 1 si procede.
    var w = 360;
    var h = this.fittingHeight ? this.fittingHeight(3) : 120;
    var x = Math.floor((Graphics.boxWidth - w) / 2);
    var y = Math.floor(Graphics.boxHeight * 0.45);
    this._qtyCallback = callback;
    this._qtyMax = Math.floor(Number(maxValue) || 0);
    this._qtyWindow = new Window_OnyxBankQty(x, y, w, h, initial, this._qtyMax, opts.hideMax);
    this._qtyWindow.setHandler = function() {};
    this.addWindow(this._qtyWindow);

    this._qtyPrevFocus = {
      bankActive: !!(this._bankSlotsWindow && this._bankSlotsWindow.active),
      invActive: !!(this._invSlotsWindow && this._invSlotsWindow.active),
      cmdActive: !!(this._cmdWindow && this._cmdWindow.active)
    };

    this._bankSlotsWindow.deactivate();
    this._invSlotsWindow.deactivate();
    this._cmdWindow.deactivate();
    this._qtyActive = true;
  };

  Scene_OnyxBank.prototype.updateQtyPrompt = function() {
    if (!this._qtyActive || !this._qtyWindow) return;

    var maxV = this._qtyWindow._max;
    var stepBig = 10;
    var stepSmall = 1;
    var stepCtrl = 1000;
    var ctrl = Input.isPressed("control");

    if (ctrl && Input.isRepeated("right")) {
      // maxV ya es el tope de la ventana (retirar ítems = máx retirable; guardar oro = oro en mochila).
      this._qtyWindow.setValue(maxV);
      SoundManager.playCursor();
    } else if (ctrl && Input.isRepeated("left")) {
      this._qtyWindow.setValue(0);
      SoundManager.playCursor();
    } else if (ctrl && Input.isRepeated("up")) {
      this._qtyWindow.setValue(this._qtyWindow._value + stepCtrl);
      SoundManager.playCursor();
    } else if (ctrl && Input.isRepeated("down")) {
      this._qtyWindow.setValue(this._qtyWindow._value - stepCtrl);
      SoundManager.playCursor();
    } else if (Input.isRepeated("up")) {
      this._qtyWindow.setValue(this._qtyWindow._value + stepSmall);
      SoundManager.playCursor();
    } else if (Input.isRepeated("down")) {
      this._qtyWindow.setValue(this._qtyWindow._value - stepSmall);
      SoundManager.playCursor();
    } else if (Input.isRepeated("right")) {
      this._qtyWindow.setValue(this._qtyWindow._value + stepBig);
      SoundManager.playCursor();
    } else if (Input.isRepeated("left")) {
      this._qtyWindow.setValue(this._qtyWindow._value - stepBig);
      SoundManager.playCursor();
    }

    if (Input.isTriggered("ok") || Input.isRepeated("ok")) {
      var v = this._qtyWindow._value;
      var cb = this._qtyCallback;
      this.closeQtyPrompt();
      if (cb) cb(v);
      return;
    }

    if (Input.isTriggered("cancel") || Input.isRepeated("cancel")) {
      this.closeQtyPrompt();
      return;
    }
  };

  Scene_OnyxBank.prototype.closeQtyPrompt = function() {
    this._qtyActive = false;
    if (this._qtyWindow) {
      try {
        if (this._windowLayer && this._windowLayer.removeChild) {
          this._windowLayer.removeChild(this._qtyWindow);
        } else if (this.removeChild) {
          this.removeChild(this._qtyWindow);
        }
      } catch (e) {}
    }
    this._qtyWindow = null;
    this._qtyCallback = null;

    if (this._cmdWindow) this._cmdWindow.deactivate();

    // Restaurar foco anterior (para que el jugador no se sienta "pegado")
    if (this._qtyPrevFocus && this._qtyPrevFocus.bankActive && this._bankSlotsWindow) {
      this._bankSlotsWindow.activate();
    } else if (this._qtyPrevFocus && this._qtyPrevFocus.invActive && this._invSlotsWindow) {
      this._invSlotsWindow.activate();
    } else if (this._bankSlotsWindow) {
      this._bankSlotsWindow.activate();
    }
    this._qtyPrevFocus = null;
  };

  Scene_OnyxBank.prototype.onBankOk = function() {
    var bankIndex = this._bankSlotsWindow.index();
    var s = bankSlots()[bankIndex];
    if (!s) return;

    // Regla 5: si no es arma/armadura, ventana X cantidad con default 1.
    if (s.kind === "item") {
      var maxW = maxWithdrawForItem(s.id, s.amount);
      if (maxW <= 0) return;
      this.openQtyPrompt(function(qty) {
        var gained = withdrawFromBankToInventory(bankIndex, qty);
        if (gained > 0) {
          this._bankSlotsWindow.refresh();
          this._invSlotsWindow.refresh();
          var bs = bankSlots();
          selectNearestNonEmptySlot(this._bankSlotsWindow, bs, bankIndex, bankSlotHasContent);
          this._bankSlotsWindow.activate();
        }
      }.bind(this), 1, maxW);
      return;
    }

    // Armas/armaduras: retirar 1 (sin ventana).
    if (s.kind === "weapon" || s.kind === "armor") {
      var g1 = withdrawFromBankToInventory(bankIndex, 1);
      if (g1 > 0) {
        this._bankSlotsWindow.refresh();
        this._invSlotsWindow.refresh();
        var bs2 = bankSlots();
        selectNearestNonEmptySlot(this._bankSlotsWindow, bs2, bankIndex, bankSlotHasContent);
        this._bankSlotsWindow.activate();
      }
      return;
    }

    // Oro del banco: retirar a la mochila hasta su tope en oro.
    if (s.kind === "gold") {
      var goldInBank = bankGetGold();
      if (goldInBank <= 0) return;
      var maxPartyGold = $gameParty.maxGold();
      var space = Math.max(0, maxPartyGold - $gameParty.gold());
      var take = Math.min(goldInBank, space);
      if (take > 0) {
        bankRemoveGold(take);
        $gameParty.gainGold(take);
        this._bankSlotsWindow.refresh();
        this._invSlotsWindow.refresh();
        var bs3 = bankSlots();
        selectNearestNonEmptySlot(this._bankSlotsWindow, bs3, bankIndex, bankSlotHasContent);
        this._bankSlotsWindow.activate();
      }
      return;
    }
  };

  // Depositar desde inventario hacia banco con OK en inventario (podemos usar R también).
  Scene_OnyxBank.prototype.onInvDeposit = function() {
    var invIndex = this._invSlotsWindow.index();
    depositFromInventorySlotToBank(invIndex);
    this._bankSlotsWindow.refresh();
    this._invSlotsWindow.refresh();
    var invSlots = window.OnyxInv && window.OnyxInv.slots ? window.OnyxInv.slots() : [];
    selectNearestNonEmptySlot(this._invSlotsWindow, invSlots, invIndex);
    this._invSlotsWindow.activate();
  };

  Window_OnyxBankSlots.prototype.processHandling = function() {
    Window_Selectable.prototype.processHandling.call(this);
    if (!this.isOpenAndActive()) return;
    if (Input.isTriggered("r")) {
      // Retirar con R igual que OK.
      this.deactivate();
      if (this._scene && this._scene.onBankOk) this._scene.onBankOk();
    }
  };

  Window_OnyxBankInvSlots.prototype.processHandling = function() {
    Window_Selectable.prototype.processHandling.call(this);
    if (!this.isOpenAndActive()) return;
    if (Input.isTriggered("r")) {
      this.deactivate();
      if (this._scene && this._scene.onInvDeposit) this._scene.onInvDeposit();
    }
  };

  // Pasar referencia de escena a ventanas (para processHandling de R).
  var _createSceneOnyxBank = Scene_OnyxBank.prototype.create;
  Scene_OnyxBank.prototype.create = function() {
    _createSceneOnyxBank.call(this);
    this._bankSlotsWindow._scene = this;
    this._invSlotsWindow._scene = this;
  };

  // ---------------------------------------------------------------------------
  // Plugin command para abrir banco desde un evento
  // ---------------------------------------------------------------------------
  var _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === "OnyxBank") {
      if (args[0] === "open") {
        if (SceneManager.isSceneChanging()) return;
        SceneManager.push(Scene_OnyxBank);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // API para mejorar (slot extras) => incrementar max por tipo
  // ---------------------------------------------------------------------------
  window.OnyxBank = window.OnyxBank || {};
  window.OnyxBank.addItemStack = function(itemId, amount) {
    return bankAdd("item", Number(itemId) || 0, amount);
  };
  window.OnyxBank.removeItemStack = function(itemId, amount) {
    return bankRemove("item", Number(itemId) || 0, amount);
  };
  window.OnyxBank.getItemAmount = function(itemId) {
    return bankGetAmount("item", Number(itemId) || 0);
  };
  window.OnyxBank.canAddItemStack = function(itemId, amount) {
    var id = Number(itemId) || 0;
    var amt = Math.max(0, Math.floor(Number(amount) || 0));
    if (amt <= 0) return 0;
    var maxPerType = bankMaxPerType();
    var current = bankGetAmount("item", id);
    var capLeft = maxPerType - current;
    if (capLeft <= 0 && findBankSlotIndex("item", id) < 0 && firstEmptyBankSlotIndex() < 0) return 0;
    if (capLeft <= 0 && findBankSlotIndex("item", id) < 0) return 0;
    return Math.min(amt, capLeft > 0 ? capLeft : maxPerType);
  };
  window.OnyxBank.hasEmptyItemSlot = function() {
    return firstEmptyBankSlotIndex() >= 0;
  };
  window.OnyxBank.increaseMaxBankItems = function(delta) {
    if (!$gameSystem) return;
    delta = Math.floor(Number(delta) || 0);
    if (delta <= 0) return;
    if ($gameSystem._onyxBankMaxItemsBonus == null) $gameSystem._onyxBankMaxItemsBonus = 0;
    $gameSystem._onyxBankMaxItemsBonus += delta;
    normalizeBankSlots();
  };

  window.Scene_OnyxBank = Scene_OnyxBank;
})();


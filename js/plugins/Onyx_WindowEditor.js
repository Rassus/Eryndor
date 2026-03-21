//=============================================================================
// Onyx_WindowEditor.js
// (Onyx) Editor visual de ventanas sin código - mover, redimensionar, guardar
//=============================================================================

/*:
 * @plugindesc (Onyx) Modo edición de ventanas: selecciona, mueve, redimensiona. Guarda en localStorage. Mensaje al activar/desactivar.
 * @author Onyx
 * @version 1.1.0
 *
 * @param hotkey
 * @text Combinación de teclas
 * @desc Tecla adicional para activar modo edición
 * @type select
 * @option Ninguna
 * @value none
 * @option Control
 * @value control
 * @option Shift
 * @value shift
 * @option Alt
 * @value alt
 * @default shift
 *
 * @param mainKey
 * @text Tecla principal
 * @desc Código (70=F, 69=E). Con shift: activa editor. Evita 69 si usas Q/E en banco.
 * @type text
 * @default 70
 *
 * @param handleSize
 * @text Tamaño de handles
 * @type number
 * @default 8
 *
 * @param minWidth
 * @text Ancho mínimo
 * @type number
 * @default 48
 *
 * @param minHeight
 * @text Alto mínimo
 * @type number
 * @default 32
 *
 * @param msgActivated
 * @text Mensaje activado
 * @desc Texto al activar modo edición
 * @type string
 * @default Modo edición de ventanas: ACTIVADO
 *
 * @param msgDeactivated
 * @text Mensaje desactivado
 * @desc Texto al desactivar modo edición
 * @type string
 * @default Modo edición de ventanas: DESACTIVADO
 */

(function() {
  "use strict";

  var params = PluginManager.parameters("Onyx_WindowEditor");
  var HOTKEY = (params["hotkey"] || "shift").toLowerCase();
  var MAIN_KEY_RAW = String(params["mainKey"] || "70");
  var MAIN_KEY_CODE = parseInt(MAIN_KEY_RAW, 10);
  if (isNaN(MAIN_KEY_CODE)) MAIN_KEY_CODE = 70;
  var MAIN_KEY_NAME = "onyxWindowEditor_" + MAIN_KEY_RAW;
  var HANDLE_SIZE = Number(params["handleSize"] || 8);
  var MIN_WIDTH = Number(params["minWidth"] || 48);
  var MIN_HEIGHT = Number(params["minHeight"] || 32);
  var MSG_ACTIVATED = params["msgActivated"] || "Modo edición de ventanas: ACTIVADO";
  var MSG_DEACTIVATED = params["msgDeactivated"] || "Modo edición de ventanas: DESACTIVADO";

  var LAYOUT_STORAGE_KEY = "onyx_window_layouts";

  var isModifierPressed = function() {
    if (HOTKEY === "none") return true;
    if (HOTKEY === "control") return Input.isPressed("control");
    if (HOTKEY === "shift") return Input.isPressed("shift");
    if (HOTKEY === "alt") return Input.isPressed("alt");
    return false;
  };

  if (typeof Input !== "undefined" && Input.keyMapper) {
    if (MAIN_KEY_CODE !== 69 && MAIN_KEY_CODE !== 81) {
      Input.keyMapper[MAIN_KEY_CODE] = MAIN_KEY_NAME;
    } else {
      Input.keyMapper[70] = MAIN_KEY_NAME;
    }
    Input.keyMapper[219] = "onyxEditorFontDown";
    Input.keyMapper[221] = "onyxEditorFontUp";
  }

  var isHotkeyTriggered = function() {
    if (!isModifierPressed()) return false;
    return Input.isTriggered(MAIN_KEY_NAME);
  };

  var getWindowLayer = function() {
    var scene = SceneManager._scene;
    if (!scene || !scene._windowLayer) return null;
    return scene._windowLayer;
  };

  var getSceneName = function() {
    var scene = SceneManager._scene;
    return scene && scene.constructor ? scene.constructor.name : "";
  };

  var getEditableObjects = function() {
    var layer = getWindowLayer();
    if (!layer || !layer.children) return [];
    var list = [];
    for (var i = 0; i < layer.children.length; i++) {
      var c = layer.children[i];
      if (!c || !c.visible) continue;
      if (c._isWindow !== false && typeof c.move === "function") {
        list.push(c);
      }
    }
    return list;
  };

  var getObjectBounds = function(obj, windowLayer) {
    if (obj.getBounds && typeof obj.getBounds === "function") {
      try {
        var b = obj.getBounds();
        if (b && b.width > 0 && b.height > 0) {
          return { x: b.x, y: b.y, width: b.width, height: b.height };
        }
      } catch (e) {}
    }
    var lx = windowLayer ? windowLayer.x : 0;
    var ly = windowLayer ? windowLayer.y : 0;
    var x = (obj.x != null ? obj.x : (obj._x || 0)) + lx;
    var y = (obj.y != null ? obj.y : (obj._y || 0)) + ly;
    var w = obj.width != null ? obj.width : (obj._width || 0);
    var h = obj.height != null ? obj.height : (obj._height || 0);
    if (obj.parent && obj.parent !== windowLayer) {
      var p = obj.parent;
      while (p && p !== windowLayer) {
        x += p.x || 0;
        y += p.y || 0;
        p = p.parent;
      }
    }
    return { x: x, y: y, width: w, height: h };
  };

  var hitTestObject = function(obj, px, py, layer) {
    var b = getObjectBounds(obj, layer);
    return b.width > 0 && b.height > 0 && px >= b.x && px < b.x + b.width && py >= b.y && py < b.y + b.height;
  };

  var findObjectAt = function(px, py) {
    var layer = getWindowLayer();
    if (!layer) return null;
    var list = getEditableObjects();
    for (var i = list.length - 1; i >= 0; i--) {
      if (hitTestObject(list[i], px, py, layer)) return list[i];
    }
    return null;
  };

  var canMoveObject = function(obj) {
    if (typeof obj.move === "function") return true;
    if (typeof obj.x === "number" && typeof obj.y === "number") return true;
    return false;
  };

  var canResizeObject = function(obj) {
    return typeof obj.move === "function";
  };

  var setObjectPosition = function(obj, x, y, w, h) {
    if (typeof obj.move === "function") {
      var ow = obj.width;
      var oh = obj.height;
      obj.move(x, y, w != null ? w : obj.width, h != null ? h : obj.height);
      if (typeof obj.createContents === "function" && (obj.width !== ow || obj.height !== oh)) {
        obj.createContents();
      }
      return;
    }
    obj.x = x;
    obj.y = y;
    if (w != null && (obj.width !== undefined || obj._width !== undefined)) obj.width = w;
    if (h != null && (obj.height !== undefined || obj._height !== undefined)) obj.height = h;
  };

  var getObjectPosition = function(obj) {
    var x = obj.x != null ? obj.x : 0;
    var y = obj.y != null ? obj.y : 0;
    var w = obj.width != null ? obj.width : (obj._width || 0);
    var h = obj.height != null ? obj.height : (obj._height || 0);
    return { x: x, y: y, width: w, height: h };
  };

  var STANDARD_FONT_SIZE = 28;

  var computeAdaptiveFontSize = function(window, w, h) {
    if (!window || !window.contents) return STANDARD_FONT_SIZE;
    var cw = w != null ? w : (window.width || window._width || 200);
    var ch = h != null ? h : (window.height || window._height || 100);
    var minDim = Math.min(cw, ch);
    if (minDim <= 0) return STANDARD_FONT_SIZE;
    var ratio = minDim / 100;
    if (ratio >= 1) return STANDARD_FONT_SIZE;
    var fs = Math.floor(STANDARD_FONT_SIZE * ratio);
    if (fs < 12) fs = 12;
    return Math.min(fs, STANDARD_FONT_SIZE);
  };

  var applyAdaptiveFont = function(window) {
    if (!window || !window.contents) return;
    var w = window.width != null ? window.width : (window._width || 0);
    var h = window.height != null ? window.height : (window._height || 0);
    var fs = computeAdaptiveFontSize(window, w, h);
    window.contents.fontSize = fs;
    if (window.resetFontSettings) window.resetFontSettings();
    if (window.refresh) window.refresh();
  };

  var isLayoutValid = function(saved, boxW, boxH) {
    if (!saved || typeof saved.x !== "number" || typeof saved.y !== "number") return false;
    var w = saved.w != null ? saved.w : 100;
    var h = saved.h != null ? saved.h : 50;
    if (w < MIN_WIDTH || h < MIN_HEIGHT) return false;
    if (saved.x + w < -10 || saved.y + h < -10) return false;
    if (saved.x > boxW + 10 || saved.y > boxH + 10) return false;
    if (saved.y + h > boxH + 20) return false;
    return true;
  };

  var validateLayoutsData = function(data) {
    if (!data || typeof data !== "object") return {};
    var out = {};
    var boxW = Graphics.boxWidth || 816;
    var boxH = Graphics.boxHeight || 624;
    for (var k in data) {
      if (k.indexOf("_props") >= 0) {
        out[k] = data[k];
        continue;
      }
      var v = data[k];
      if (isLayoutValid(v, boxW, boxH)) {
        out[k] = v;
      }
    }
    return out;
  };

  var HANDLE_NONE = 0;
  var HANDLE_TOP = 1;
  var HANDLE_BOTTOM = 2;
  var HANDLE_LEFT = 3;
  var HANDLE_RIGHT = 4;
  var HANDLE_TL = 5;
  var HANDLE_TR = 6;
  var HANDLE_BL = 7;
  var HANDLE_BR = 8;

  var hitTestHandle = function(bounds, px, py) {
    var hs = HANDLE_SIZE;
    var x = bounds.x;
    var y = bounds.y;
    var w = bounds.width;
    var h = bounds.height;
    var inLeft = px >= x - hs && px < x + hs;
    var inRight = px >= x + w - hs && px < x + w + hs;
    var inTop = py >= y - hs && py < y + hs;
    var inBottom = py >= y + h - hs && py < y + h + hs;
    if (inTop && inLeft) return HANDLE_TL;
    if (inTop && inRight) return HANDLE_TR;
    if (inBottom && inLeft) return HANDLE_BL;
    if (inBottom && inRight) return HANDLE_BR;
    if (inTop) return HANDLE_TOP;
    if (inBottom) return HANDLE_BOTTOM;
    if (inLeft) return HANDLE_LEFT;
    if (inRight) return HANDLE_RIGHT;
    return HANDLE_NONE;
  };

  var isInMoveArea = function(bounds, px, py) {
    var hs = HANDLE_SIZE;
    return px >= bounds.x + hs && px < bounds.x + bounds.width - hs &&
           py >= bounds.y + hs && py < bounds.y + bounds.height - hs;
  };

  Window.prototype.setOnyxEditorId = function(id) {
    this._onyxEditorId = id;
  };

  Window.prototype.getOnyxEditorId = function() {
    return this._onyxEditorId || null;
  };

  window.OnyxWindowEditor = {
    _active: false,
    _selected: null,
    _dragState: null,
    _overlaySprite: null,
    _blockInput: false,
    _toggleMessage: null,
    _toggleMessageFrames: 0,

    getLayoutKey: function(sceneName, windowId) {
      return sceneName + "::" + windowId;
    },

    loadLayouts: function() {
      try {
        var s = localStorage.getItem(LAYOUT_STORAGE_KEY);
        var data = s ? JSON.parse(s) : {};
        return validateLayoutsData(data);
      } catch (e) {
        return {};
      }
    },

    saveLayouts: function(data) {
      try {
        localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {}
    },

    registerWindow: function(window, id) {
      if (!window) return;
      window.setOnyxEditorId(id);
      this.applyLayout(window);
    },

    applyLayout: function(window) {
      var id = window.getOnyxEditorId ? window.getOnyxEditorId() : window._onyxEditorId;
      if (!id) return;
      var sceneName = getSceneName();
      var key = this.getLayoutKey(sceneName, id);
      var layouts = this.loadLayouts();
      var saved = layouts[key];
      var boxW = Graphics.boxWidth || 816;
      var boxH = Graphics.boxHeight || 624;
      if (saved && isLayoutValid(saved, boxW, boxH)) {
        var w = saved.w != null ? saved.w : (window.width || window._width);
        var h = saved.h != null ? saved.h : (window.height || window._height);
        if (typeof window.move === "function") {
          var ow = window.width;
          var oh = window.height;
          window.move(saved.x, saved.y, w, h);
          if (typeof window.createContents === "function" && (window.width !== ow || window.height !== oh)) {
            window.createContents();
          }
        } else {
          var ow2 = window.width;
          var oh2 = window.height;
          window.x = saved.x;
          window.y = saved.y;
          if (saved.w != null) window.width = saved.w;
          if (saved.h != null) window.height = saved.h;
          if (typeof window.createContents === "function" && (window.width !== ow2 || window.height !== oh2)) {
            window.createContents();
          }
        }
      }
      applyAdaptiveFont(window);
    },

    saveLayout: function(obj) {
      var id = obj.getOnyxEditorId ? obj.getOnyxEditorId() : obj._onyxEditorId;
      if (!id) return;
      var sceneName = getSceneName();
      if (!sceneName) return;
      var pos = getObjectPosition(obj);
      var key = this.getLayoutKey(sceneName, id);
      var layouts = this.loadLayouts();
      layouts[key] = { x: pos.x, y: pos.y, w: pos.width, h: pos.height };
      this.saveLayouts(layouts);
    },

    saveWindowProperties: function(window, props) {
      var id = window.getOnyxEditorId ? window.getOnyxEditorId() : window._onyxEditorId;
      if (!id) return;
      var sceneName = getSceneName();
      if (!sceneName) return;
      var key = this.getLayoutKey(sceneName, id) + "_props";
      var layouts = this.loadLayouts();
      layouts[key] = props;
      this.saveLayouts(layouts);
    },

    loadWindowProperties: function(window) {
      var id = window.getOnyxEditorId ? window.getOnyxEditorId() : window._onyxEditorId;
      if (!id) return null;
      var sceneName = getSceneName();
      if (!sceneName) return null;
      var key = this.getLayoutKey(sceneName, id) + "_props";
      var layouts = this.loadLayouts();
      return layouts[key] || null;
    },

    isActive: function() {
      return this._active;
    },

    activate: function() {
      if (this._active) return;
      this._active = true;
      this._selected = null;
      this._dragState = null;
      this._blockInput = false;
      this._toggleMessage = MSG_ACTIVATED;
      this._toggleMessageFrames = 120;
      this._createOverlay();
    },

    deactivate: function() {
      this._active = false;
      this._selected = null;
      this._dragState = null;
      this._blockInput = false;
      this._toggleMessage = MSG_DEACTIVATED;
      this._toggleMessageFrames = 120;
      this._removeOverlay();
    },

    toggle: function() {
      if (this._active) {
        this.deactivate();
      } else {
        this.activate();
      }
    },

    _createOverlay: function() {
      this._removeOverlay();
      var layer = getWindowLayer();
      if (!layer) return;
      var spr = new PIXI.Graphics();
      spr.visible = true;
      spr.interactive = false;
      spr.interactiveChildren = false;
      this._overlaySprite = spr;
      layer.addChild(spr);
    },

    _ensureOverlay: function() {
      var layer = getWindowLayer();
      if (!layer) return;
      if (!this._overlaySprite || this._overlaySprite.parent !== layer) {
        this._createOverlay();
      }
    },

    _removeOverlay: function() {
      if (this._overlaySprite && this._overlaySprite.parent) {
        this._overlaySprite.parent.removeChild(this._overlaySprite);
      }
      this._overlaySprite = null;
    },

    _drawOverlay: function() {
      var spr = this._overlaySprite;
      if (!spr) return;
      spr.clear();
      var layer = getWindowLayer();

      if (this._toggleMessageFrames > 0) {
        this._ensureOverlay();
        if (layer && spr.parent && !spr._tempText) {
          var msg = this._toggleMessage || "";
          if (msg && typeof PIXI.Text !== "undefined") {
            var txt = new PIXI.Text(msg, {
              fontFamily: "GameFont, sans-serif",
              fontSize: 22,
              fill: "#ffff00",
              stroke: "#000000",
              strokeThickness: 3
            });
            txt.anchor.x = 0.5;
            txt.anchor.y = 0.5;
            var lw = layer.width || Graphics.boxWidth;
            txt.x = lw / 2;
            txt.y = 40;
            spr.addChild(txt);
            spr._tempText = txt;
          }
        }
        this._toggleMessageFrames--;
        if (this._toggleMessageFrames <= 0 && spr._tempText) {
          spr.removeChild(spr._tempText);
          spr._tempText = null;
        }
      }

      if (spr._tempText) return;

      if (!layer || !this._selected) return;

      var bounds = getObjectBounds(this._selected, layer);
      var wx = this._selected.x != null ? this._selected.x : 0;
      var wy = this._selected.y != null ? this._selected.y : 0;
      if (this._selected.parent && this._selected.parent !== layer) {
        var p = this._selected.parent;
        while (p && p !== layer) {
          wx += p.x || 0;
          wy += p.y || 0;
          p = p.parent;
        }
      }

      spr.lineStyle(2, 0xffc800, 0.9);
      spr.drawRect(wx, wy, bounds.width, bounds.height);

      var hs = HANDLE_SIZE;
      var drawH = function(px, py) {
        spr.beginFill(0xffc800, 0.8);
        spr.drawRect(px - hs / 2, py - hs / 2, hs, hs);
        spr.endFill();
      };

      if (canResizeObject(this._selected)) {
        drawH(wx, wy);
        drawH(wx + bounds.width, wy);
        drawH(wx, wy + bounds.height);
        drawH(wx + bounds.width, wy + bounds.height);
        drawH(wx + bounds.width / 2, wy);
        drawH(wx + bounds.width / 2, wy + bounds.height);
        drawH(wx, wy + bounds.height / 2);
        drawH(wx + bounds.width, wy + bounds.height / 2);
      }
    },

    update: function() {
      if (!this._active) return;

      this._ensureOverlay();
      var layer = getWindowLayer();
      if (!layer) return;

      if (this._toggleMessageFrames > 0) {
        this._drawOverlay();
        return;
      }

      if (Input.isTriggered("onyxEditorFontDown") && this._selected && this._selected.contents) {
        var fs = (this._selected.contents.fontSize || 28) - 2;
        if (fs < 12) fs = 12;
        this._selected.contents.fontSize = fs;
        if (this._selected.resetFontSettings) this._selected.resetFontSettings();
        if (this._selected.refresh) this._selected.refresh();
        var props = this.loadWindowProperties(this._selected) || {};
        props.fontSize = fs;
        this.saveWindowProperties(this._selected, props);
      }
      if (Input.isTriggered("onyxEditorFontUp") && this._selected && this._selected.contents) {
        var fs2 = (this._selected.contents.fontSize || 28) + 2;
        if (fs2 > STANDARD_FONT_SIZE) fs2 = STANDARD_FONT_SIZE;
        this._selected.contents.fontSize = fs2;
        if (this._selected.resetFontSettings) this._selected.resetFontSettings();
        if (this._selected.refresh) this._selected.refresh();
        var props2 = this.loadWindowProperties(this._selected) || {};
        props2.fontSize = fs2;
        this.saveWindowProperties(this._selected, props2);
      }

      var mx = TouchInput.x;
      var my = TouchInput.y;

      if (this._dragState) {
        this._updateDrag(mx, my);
        return;
      }

      if (TouchInput.isTriggered()) {
        var win = findObjectAt(mx, my);
        if (win) {
          var b = getObjectBounds(win, layer);
          var handle = canResizeObject(win) ? hitTestHandle(b, mx, my) : HANDLE_NONE;
          if (handle !== HANDLE_NONE) {
            this._dragState = {
              window: win,
              mode: "resize",
              handle: handle,
              startX: mx,
              startY: my,
              startBounds: getObjectPosition(win)
            };
            this._blockInput = true;
          } else if (canMoveObject(win) && isInMoveArea(b, mx, my)) {
            this._dragState = {
              window: win,
              mode: "move",
              startX: mx,
              startY: my,
              startPos: getObjectPosition(win)
            };
            this._blockInput = true;
          } else {
            this._selected = win;
            this._drawOverlay();
          }
        } else {
          this._selected = null;
          this._drawOverlay();
        }
      }

      if (!this._dragState) {
        this._drawOverlay();
      }
    },

    _updateDrag: function(mx, my) {
      if (!TouchInput.isPressed()) {
        if (this._dragState && this._dragState.window) {
          this.saveLayout(this._dragState.window);
        }
        this._dragState = null;
        this._blockInput = false;
        return;
      }

      var s = this._dragState;
      if (!s || !s.window) return;

      if (s.mode === "move") {
        var dx = mx - s.startX;
        var dy = my - s.startY;
        var nwx = Math.max(0, s.startPos.x + dx);
        var nwy = Math.max(0, s.startPos.y + dy);
        setObjectPosition(s.window, nwx, nwy);
      } else if (s.mode === "resize" && canResizeObject(s.window)) {
        var h = s.handle;
        var sb = s.startBounds;
        var dx = mx - s.startX;
        var dy = my - s.startY;
        var nx = sb.x;
        var ny = sb.y;
        var nw = sb.width;
        var nh = sb.height;

        if (h === HANDLE_LEFT || h === HANDLE_TL || h === HANDLE_BL) {
          nx = sb.x + dx;
          nw = sb.width - dx;
          if (nw < MIN_WIDTH) {
            nx = sb.x + sb.width - MIN_WIDTH;
            nw = MIN_WIDTH;
          }
        }
        if (h === HANDLE_RIGHT || h === HANDLE_TR || h === HANDLE_BR) {
          nw = sb.width + dx;
          if (nw < MIN_WIDTH) nw = MIN_WIDTH;
        }
        if (h === HANDLE_TOP || h === HANDLE_TL || h === HANDLE_TR) {
          ny = sb.y + dy;
          nh = sb.height - dy;
          if (nh < MIN_HEIGHT) {
            ny = sb.y + sb.height - MIN_HEIGHT;
            nh = MIN_HEIGHT;
          }
        }
        if (h === HANDLE_BOTTOM || h === HANDLE_BL || h === HANDLE_BR) {
          nh = sb.height + dy;
          if (nh < MIN_HEIGHT) nh = MIN_HEIGHT;
        }

        setObjectPosition(s.window, nx, ny, nw, nh);
        this._selected = s.window;
        applyAdaptiveFont(s.window);
      }

      this._drawOverlay();
    },

    blockInput: function() {
      return this._blockInput && this._active;
    }
  };

  var _Scene_Base_update = Scene_Base.prototype.update;
  Scene_Base.prototype.update = function() {
    if (isHotkeyTriggered()) {
      window.OnyxWindowEditor.toggle();
    }

    if (window.OnyxWindowEditor.isActive()) {
      window.OnyxWindowEditor.update();
      if (window.OnyxWindowEditor.blockInput()) {
        return;
      }
    }

    _Scene_Base_update.call(this);
  };

})();

/**
 * Pluck inspector controller.
 *
 * Owns inspect-mode: a Shadow-DOM overlay that highlights the element under the
 * cursor, keyboard refinement (parent/child), and capture-phase event handling
 * so the page never reacts to the selection click. On capture it builds the
 * element facts, formats them per the saved mode, writes the clipboard, shows a
 * toast, records history, and tears down.
 *
 * Idempotent: re-injection reuses the single controller on window.__pluck.
 */
(function () {
  'use strict';

  var ns = (window.__pluck = window.__pluck || {});
  if (ns.controller) return; // already injected into this isolated world

  var VOID_TAGS = {
    area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1,
    link: 1, meta: 1, param: 1, source: 1, track: 1, wbr: 1,
  };

  function createController() {
    var active = false;
    var host = null;
    var shadow = null;
    var box = null;
    var label = null;
    var hint = null;
    var toast = null;
    var toastTimer = null;
    var current = null; // currently highlighted element
    var mode = 'context';
    var scrollRaf = 0;
    var gen = 0; // bumped each activation so stale timers can't kill a new overlay
    var finalizing = false; // true between a capture click and its async teardown
    var isTop = window.top === window.self;

    // ----- lifecycle -------------------------------------------------------

    function toggle() {
      if (active) deactivate(false);
      else activate();
    }

    function activate() {
      if (active) return;
      if (!document.documentElement) return;
      gen++;
      if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
      if (host) teardownOverlay(); // clear any leftover overlay from a prior run
      active = true;
      finalizing = false;
      mode = 'context';
      loadMode();
      buildOverlay();
      addListeners();
      showHint(true);
      // If the pointer is already somewhere useful, prime the highlight.
      current = null;
    }

    function deactivate(keepToast) {
      if (!active) return;
      active = false;
      removeListeners();
      current = null;
      if (host) {
        if (keepToast && toast) {
          // Detach interactive bits but let the toast finish, then remove host.
          if (box) box.classList.remove('is-on');
          if (label) label.classList.remove('is-on');
          if (hint) hint.classList.remove('is-on');
        } else {
          teardownOverlay();
        }
      }
    }

    function loadMode() {
      try {
        if (chrome && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get({ mode: 'context' }, function (res) {
            if (res && typeof res.mode === 'string') mode = res.mode;
          });
        }
      } catch (e) {
        /* storage unavailable — stick with default */
      }
    }

    // ----- overlay ---------------------------------------------------------

    function buildOverlay() {
      host = document.createElement('pluck-host');
      host.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;margin:0;padding:0;border:0;';
      shadow = host.attachShadow({ mode: 'open' });

      var style = document.createElement('style');
      style.textContent = ns.css || '';
      shadow.appendChild(style);

      var layer = document.createElement('div');
      layer.className = 'pluck-layer';
      layer.innerHTML =
        '<div class="pluck-box"></div>' +
        '<div class="pluck-label"></div>' +
        '<div class="pluck-hint"><kbd>↑</kbd><kbd>↓</kbd> refine · click to copy · <kbd>esc</kbd> cancel</div>' +
        '<div class="pluck-toast" role="status" aria-live="polite"><span class="pluck-check">' +
        '<svg viewBox="0 0 12 12" fill="none"><path d="M2.5 6.2l2.2 2.3 4.8-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</span><span class="pluck-sel"></span></div>';
      shadow.appendChild(layer);

      box = shadow.querySelector('.pluck-box');
      label = shadow.querySelector('.pluck-label');
      hint = shadow.querySelector('.pluck-hint');
      toast = shadow.querySelector('.pluck-toast');

      document.documentElement.appendChild(host);
    }

    function teardownOverlay() {
      if (toastTimer) {
        clearTimeout(toastTimer);
        toastTimer = null;
      }
      if (scrollRaf) {
        cancelAnimationFrame(scrollRaf);
        scrollRaf = 0;
      }
      if (host && host.parentNode) host.parentNode.removeChild(host);
      host = shadow = box = label = hint = toast = null;
    }

    function showHint(on) {
      // Only the top frame shows the persistent hint, so a page full of iframes
      // doesn't stack one chip per frame.
      if (hint) hint.classList.toggle('is-on', !!on && isTop);
    }

    // ----- painting --------------------------------------------------------

    function paint(el) {
      if (!el || el.nodeType !== 1 || !box) return;
      current = el;
      var rect = el.getBoundingClientRect();

      box.style.top = rect.top + 'px';
      box.style.left = rect.left + 'px';
      box.style.width = Math.max(0, rect.width) + 'px';
      box.style.height = Math.max(0, rect.height) + 'px';
      box.classList.add('is-on');

      paintLabel(el, rect);
    }

    function paintLabel(el, rect) {
      if (!label) return;
      label.textContent = '';

      var tag = (el.tagName || '').toLowerCase();
      var tagSpan = document.createElement('span');
      tagSpan.className = 'pluck-tag';
      tagSpan.textContent = tag;
      label.appendChild(tagSpan);

      var sel = ns.selector;
      if (el.id && !/\s/.test(el.id) && !(sel && sel.isJunkClass(el.id))) {
        var idSpan = document.createElement('span');
        idSpan.className = 'pluck-id';
        idSpan.textContent = '#' + el.id;
        label.appendChild(idSpan);
      }

      var classes = sel ? sel.meaningfulClasses(el, 4) : [];
      for (var i = 0; i < classes.length; i++) {
        var clsSpan = document.createElement('span');
        clsSpan.className = 'pluck-cls';
        clsSpan.textContent = '.' + classes[i];
        label.appendChild(clsSpan);
      }

      var dim = document.createElement('span');
      dim.className = 'pluck-dim';
      dim.textContent = '  ' + Math.round(rect.width) + '×' + Math.round(rect.height);
      label.appendChild(dim);

      label.classList.add('is-on');

      // Position after content is set so we can measure.
      var lw = label.offsetWidth;
      var lh = label.offsetHeight;
      var vw = window.innerWidth;
      var top = rect.top - lh - 6;
      if (top < 4) top = Math.min(rect.bottom + 6, window.innerHeight - lh - 4);
      var left = rect.left;
      if (left + lw > vw - 4) left = vw - lw - 4;
      if (left < 4) left = 4;
      label.style.top = Math.max(4, top) + 'px';
      label.style.left = left + 'px';
    }

    // ----- facts + capture -------------------------------------------------

    function rgbToHex(rgb) {
      var m = /^rgba?\(([^)]+)\)$/.exec(rgb || '');
      if (!m) return rgb || '';
      var parts = m[1].split(',').map(function (p) { return p.trim(); });
      var r = parseInt(parts[0], 10);
      var g = parseInt(parts[1], 10);
      var b = parseInt(parts[2], 10);
      var a = parts.length > 3 ? parseFloat(parts[3]) : 1;
      if ([r, g, b].some(isNaN)) return rgb;
      if (a === 0) return 'transparent';
      var hex = '#' + [r, g, b].map(function (n) {
        var h = n.toString(16);
        return h.length === 1 ? '0' + h : h;
      }).join('');
      return a < 1 ? rgb : hex;
    }

    function buildHtmlPreview(el, text) {
      var tag = (el.tagName || '').toLowerCase();
      var open = '<' + tag;
      var attrs = el.attributes || [];
      for (var i = 0; i < attrs.length; i++) {
        var a = attrs[i];
        var val = a.value || '';
        if (val.length > 40) val = val.slice(0, 39) + '…';
        open += ' ' + a.name + (a.value === '' ? '' : '="' + val + '"');
        if (open.length > 200) { open += ' …'; break; }
      }
      open += '>';
      if (VOID_TAGS[tag]) return open;
      var inner = text ? (text.length > 40 ? text.slice(0, 39) + '…' : text) : '';
      return open + inner + '</' + tag + '>';
    }

    function buildStyles(el) {
      var cs;
      try { cs = window.getComputedStyle(el); } catch (e) { return ''; }
      if (!cs) return '';
      var bits = [];
      var color = rgbToHex(cs.color);
      if (color) bits.push('color:' + color);
      var bg = rgbToHex(cs.backgroundColor);
      if (bg && bg !== 'transparent') bits.push('background:' + bg);
      var fam = (cs.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
      var font = (cs.fontWeight || '') + ' ' + (cs.fontSize || '') +
        (cs.lineHeight && cs.lineHeight !== 'normal' ? '/' + cs.lineHeight : '') +
        (fam ? ' ' + fam : '');
      bits.push('font:' + font.trim());
      var pad = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft]
        .map(function (p) { return p || '0px'; });
      if (pad.some(function (p) { return p !== '0px'; })) {
        bits.push('padding:' + collapseBox(pad));
      }
      if (cs.borderRadius && cs.borderRadius !== '0px') bits.push('border-radius:' + cs.borderRadius);
      if (cs.display) bits.push('display:' + cs.display);
      return bits.join('; ');
    }

    function collapseBox(sides) {
      var t = sides[0], r = sides[1], b = sides[2], l = sides[3];
      if (t === r && r === b && b === l) return t;
      if (t === b && l === r) return t + ' ' + r;
      return t + ' ' + r + ' ' + b + ' ' + l;
    }

    function elementText(el) {
      var t = '';
      try { t = el.innerText || el.textContent || ''; } catch (e) { t = el.textContent || ''; }
      return t.replace(/\s+/g, ' ').trim();
    }

    function buildFacts(el) {
      var sel = ns.selector;
      var built = sel ? sel.buildSelector(el, document) : { headline: el.tagName.toLowerCase(), unique: el.tagName.toLowerCase() };
      var text = elementText(el);
      return {
        headline: built.headline,
        selector: built.unique,
        isUnique: built.isUnique,
        text: text,
        html: buildHtmlPreview(el, text),
        styles: buildStyles(el),
      };
    }

    function finalize(el) {
      if (!el || el.nodeType !== 1 || finalizing) return;
      finalizing = true; // stop further clicks re-entering during the async write
      var facts = buildFacts(el);
      var out = ns.format ? ns.format.formatElement(facts, mode) : facts.selector;

      // Expose the last capture for debugging / integration tests.
      ns.lastResult = { text: out, facts: facts, mode: mode };

      // Write clipboard synchronously within the click gesture.
      var ok = writeClipboard(out);

      Promise.resolve(ok).then(function (success) {
        recordHistory(facts, out);
        var state = !success ? 'error' : (facts.isUnique ? 'ok' : 'warn');
        showToast(state, facts.headline);
        // Keep the toast; remove the rest of the overlay interaction.
        deactivate(true);
        scheduleToastHide();
      });
    }

    function writeClipboard(text) {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(text).then(
            function () { return true; },
            function () { return legacyCopy(text); }
          );
        }
      } catch (e) { /* fall through */ }
      return legacyCopy(text);
    }

    function legacyCopy(text) {
      var mount = document.body || document.documentElement;
      if (!mount) return false;
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
        mount.appendChild(ta);
        ta.select();
        ta.setSelectionRange(0, text.length);
        var ok = document.execCommand('copy');
        mount.removeChild(ta);
        return ok;
      } catch (e) {
        return false;
      }
    }

    function recordHistory(facts, full) {
      try {
        chrome.runtime.sendMessage({
          type: 'pluck:captured',
          payload: {
            headline: facts.headline,
            selector: facts.selector,
            full: full,
            url: location.href,
            isUnique: facts.isUnique,
          },
        });
      } catch (e) { /* no receiver — fine */ }
    }

    // state: 'ok' | 'warn' | 'error'
    function showToast(state, headline) {
      if (!toast) return;
      toast.classList.toggle('is-error', state === 'error');
      toast.classList.toggle('is-warn', state === 'warn');
      var selSpan = toast.querySelector('.pluck-sel');
      if (selSpan) {
        if (state === 'error') selSpan.textContent = 'Copy blocked — try again';
        else if (state === 'warn') selSpan.textContent = headline + ' — may match multiple';
        else selSpan.textContent = headline;
      }
      // force reflow so the transition runs even right after creation
      void toast.offsetWidth;
      toast.classList.add('is-on');
    }

    function scheduleToastHide() {
      if (toastTimer) clearTimeout(toastTimer);
      var g = gen;
      toastTimer = setTimeout(function () {
        if (g !== gen) return; // a newer activation owns the overlay now
        if (toast) toast.classList.remove('is-on');
        setTimeout(function () { if (g === gen) teardownOverlay(); }, 220);
      }, 1600);
    }

    // ----- event handlers --------------------------------------------------

    // The deepest element under the pointer, piercing open shadow roots (where
    // e.target is retargeted to the shadow host).
    function pickTarget(e) {
      var path = e.composedPath && e.composedPath();
      var t = path && path.length ? path[0] : e.target;
      return t;
    }

    function onMouseMove(e) {
      var t = pickTarget(e);
      if (!t || t === host || t.nodeType !== 1) return;
      if (t === current) return;
      paint(t);
    }

    function onKeyDown(e) {
      if (!active) return;
      var k = e.key;
      if (k === 'Escape') {
        swallow(e);
        deactivate(false); // already tears the overlay down when keepToast is false
      } else if (k === 'ArrowUp') {
        swallow(e);
        if (current && current.parentElement && current.parentElement.nodeType === 1) {
          paint(current.parentElement);
        }
      } else if (k === 'ArrowDown') {
        swallow(e);
        if (current && current.children && current.children.length) {
          paint(current.children[0]);
        }
      } else if (k === 'Enter') {
        swallow(e);
        if (current && !finalizing) finalize(current);
      }
    }

    function onClick(e) {
      if (!active) return;
      swallow(e);
      if (finalizing) return;
      if (typeof e.button === 'number' && e.button !== 0) return;
      var target = current || pickTarget(e);
      finalize(target);
    }

    function onPointerNoise(e) {
      if (active) swallow(e);
    }

    function onScroll() {
      if (!active || !current) return;
      if (scrollRaf) return;
      var g = gen;
      scrollRaf = requestAnimationFrame(function () {
        scrollRaf = 0;
        if (g === gen && active && current && current.isConnected !== false) paint(current);
      });
    }

    function swallow(e) {
      e.preventDefault();
      e.stopPropagation();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    }

    var capture = { capture: true };
    var capturePassive = { capture: true, passive: true };

    function addListeners() {
      window.addEventListener('mousemove', onMouseMove, capture);
      window.addEventListener('click', onClick, capture);
      window.addEventListener('keydown', onKeyDown, capture);
      window.addEventListener('mousedown', onPointerNoise, capture);
      window.addEventListener('mouseup', onPointerNoise, capture);
      window.addEventListener('pointerdown', onPointerNoise, capture);
      window.addEventListener('pointerup', onPointerNoise, capture);
      window.addEventListener('dblclick', onPointerNoise, capture);
      window.addEventListener('auxclick', onPointerNoise, capture);
      window.addEventListener('contextmenu', onPointerNoise, capture);
      window.addEventListener('scroll', onScroll, capturePassive);
      window.addEventListener('resize', onScroll, capturePassive);
    }

    function removeListeners() {
      window.removeEventListener('mousemove', onMouseMove, capture);
      window.removeEventListener('click', onClick, capture);
      window.removeEventListener('keydown', onKeyDown, capture);
      window.removeEventListener('mousedown', onPointerNoise, capture);
      window.removeEventListener('mouseup', onPointerNoise, capture);
      window.removeEventListener('pointerdown', onPointerNoise, capture);
      window.removeEventListener('pointerup', onPointerNoise, capture);
      window.removeEventListener('dblclick', onPointerNoise, capture);
      window.removeEventListener('auxclick', onPointerNoise, capture);
      window.removeEventListener('contextmenu', onPointerNoise, capture);
      window.removeEventListener('scroll', onScroll, capturePassive);
      window.removeEventListener('resize', onScroll, capturePassive);
    }

    return { toggle: toggle, activate: activate, deactivate: deactivate, isActive: function () { return active; } };
  }

  ns.controller = createController();
})();

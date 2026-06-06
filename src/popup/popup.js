'use strict';

var MODE_HINTS = {
  selector: 'Just the unique CSS selector.',
  context: 'Selector + headline, text & opening tag. Recommended.',
  full: 'Adds key computed styles (color, font, padding…).',
};

var MODIFIER_KEYS = ['Meta', 'Control', 'Alt', 'Shift', 'OS', 'ContextMenu'];

var els = {};
var currentCombo = null;
var recording = false;

document.addEventListener('DOMContentLoaded', function () {
  els.start = document.getElementById('start');
  els.hotkey = document.getElementById('hotkey');
  els.shortcutBtn = document.getElementById('shortcut-btn');
  els.resetShortcut = document.getElementById('reset-shortcut');
  els.segBtns = Array.prototype.slice.call(document.querySelectorAll('.seg-btn'));
  els.modeHint = document.getElementById('mode-hint');
  els.list = document.getElementById('history-list');
  els.empty = document.getElementById('history-empty');
  els.clear = document.getElementById('clear');
  els.copied = document.getElementById('copied');

  init();
  wire();
});

function isMac() {
  var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  return /mac/i.test(p);
}

function defaultCombo() {
  return isMac()
    ? { ctrl: false, alt: false, shift: true, meta: true, code: 'KeyE' }
    : { ctrl: true, alt: false, shift: true, meta: false, code: 'KeyE' };
}

function init() {
  chrome.storage.local.get({ mode: 'context', history: [], shortcut: null }, function (res) {
    setActiveMode(res.mode || 'context');
    renderHistory(res.history || []);
    currentCombo = res.shortcut && res.shortcut.code ? res.shortcut : defaultCombo();
    renderShortcut(currentCombo);
  });
}

function wire() {
  els.start.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: 'pluck:start' }, function () {
      window.close(); // hand focus back to the page for the selection gesture
    });
  });

  els.segBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectMode(btn.getAttribute('data-mode'), false);
    });
    btn.addEventListener('keydown', function (e) {
      var i = els.segBtns.indexOf(btn);
      var next = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % els.segBtns.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + els.segBtns.length) % els.segBtns.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = els.segBtns.length - 1;
      if (next === -1) return;
      e.preventDefault();
      selectMode(els.segBtns[next].getAttribute('data-mode'), true);
    });
  });

  els.shortcutBtn.addEventListener('click', startRecording);
  els.resetShortcut.addEventListener('click', function () {
    currentCombo = defaultCombo();
    chrome.storage.local.set({ shortcut: currentCombo });
    renderShortcut(currentCombo);
  });

  els.clear.addEventListener('click', function () {
    chrome.storage.local.set({ history: [] }, function () { renderHistory([]); });
  });
}

// ----- shortcut recorder ---------------------------------------------------

function startRecording() {
  if (recording) return;
  recording = true;
  els.shortcutBtn.classList.add('recording');
  els.shortcutBtn.textContent = 'Press keys…';
  document.addEventListener('keydown', onRecordKey, true);
}

function stopRecording() {
  recording = false;
  els.shortcutBtn.classList.remove('recording');
  document.removeEventListener('keydown', onRecordKey, true);
  renderShortcut(currentCombo);
}

function onRecordKey(e) {
  e.preventDefault();
  e.stopPropagation();
  if (MODIFIER_KEYS.indexOf(e.key) !== -1) return; // wait for the real key
  if (e.key === 'Escape') { stopRecording(); return; }
  if (!(e.ctrlKey || e.altKey || e.metaKey)) {
    els.shortcutBtn.textContent = isMac() ? 'Add ⌘ ⌃ or ⌥' : 'Add Ctrl/Alt';
    return; // require a non-shift modifier so it doesn't fire on plain typing
  }
  currentCombo = { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey, code: e.code };
  chrome.storage.local.set({ shortcut: currentCombo });
  stopRecording();
}

function renderShortcut(combo) {
  var label = comboToLabel(combo);
  els.shortcutBtn.textContent = label;
  els.hotkey.textContent = label;
}

function comboToLabel(c) {
  if (!c || !c.code) return '—';
  if (isMac()) {
    return (c.ctrl ? '⌃' : '') + (c.alt ? '⌥' : '') + (c.shift ? '⇧' : '') + (c.meta ? '⌘' : '') + keyLabel(c.code);
  }
  var parts = [];
  if (c.ctrl) parts.push('Ctrl');
  if (c.alt) parts.push('Alt');
  if (c.shift) parts.push('Shift');
  if (c.meta) parts.push('Meta');
  parts.push(keyLabel(c.code));
  return parts.join('+');
}

function keyLabel(code) {
  var m;
  if ((m = /^Key([A-Z])$/.exec(code))) return m[1];
  if ((m = /^Digit(\d)$/.exec(code))) return m[1];
  var map = {
    Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'",
    BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=',
    Backquote: '`', Space: 'Space', Enter: 'Enter', Tab: 'Tab',
  };
  return map[code] || code;
}

// ----- modes ---------------------------------------------------------------

function selectMode(mode, focus) {
  setActiveMode(mode, focus);
  chrome.storage.local.set({ mode: mode });
}

function setActiveMode(mode, focus) {
  els.segBtns.forEach(function (btn) {
    var on = btn.getAttribute('data-mode') === mode;
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
    btn.tabIndex = on ? 0 : -1; // roving tabindex
    if (on && focus) btn.focus();
  });
  els.modeHint.textContent = MODE_HINTS[mode] || '';
}

// ----- history -------------------------------------------------------------

function renderHistory(history) {
  els.list.textContent = '';
  var has = history && history.length;
  els.empty.hidden = !!has;
  els.clear.hidden = !has;
  if (!has) return;

  history.forEach(function (item) {
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.className = 'history-item';
    btn.title = 'Click to copy again';

    var sel = document.createElement('span');
    sel.className = 'h-sel';
    sel.textContent = item.headline || item.selector || '(element)';

    var meta = document.createElement('span');
    meta.className = 'h-meta';
    var warn = item.isUnique === false ? '⚠ may match multiple · ' : '';
    meta.textContent = warn + hostOf(item.url) + ' · ' + timeAgo(item.ts);

    btn.appendChild(sel);
    btn.appendChild(meta);
    btn.addEventListener('click', function () { recopy(item); });
    li.appendChild(btn);
    els.list.appendChild(li);
  });
}

function recopy(item) {
  var text = item.full || item.selector || item.headline || '';
  if (!text) { flash('Nothing to copy', true); return; }
  navigator.clipboard.writeText(text).then(
    function () { flash('Copied', false); },
    function () {
      var ok = legacyCopyText(text);
      flash(ok ? 'Copied' : 'Copy failed', !ok);
    }
  );
}

function legacyCopyText(text) {
  try {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
    document.body.appendChild(ta);
    ta.select();
    var ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

function flash(message, isError) {
  els.copied.textContent = message;
  els.copied.classList.toggle('is-error', !!isError);
  els.copied.hidden = false;
  void els.copied.offsetWidth;
  els.copied.classList.add('is-on');
  setTimeout(function () {
    els.copied.classList.remove('is-on');
    setTimeout(function () { els.copied.hidden = true; }, 200);
  }, 1100);
}

function hostOf(url) {
  if (!url) return '';
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

function timeAgo(ts) {
  if (!ts) return '';
  var s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return s + 's ago';
  var m = Math.round(s / 60);
  if (m < 60) return m + 'm ago';
  var h = Math.round(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.round(h / 24) + 'd ago';
}

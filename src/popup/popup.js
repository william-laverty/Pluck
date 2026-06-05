'use strict';

var MODE_HINTS = {
  selector: 'Just the unique CSS selector.',
  context: 'Selector + headline, text & opening tag. Recommended.',
  full: 'Adds key computed styles (color, font, padding…).',
};

var els = {};

document.addEventListener('DOMContentLoaded', function () {
  els.start = document.getElementById('start');
  els.hotkey = document.getElementById('hotkey');
  els.segBtns = Array.prototype.slice.call(document.querySelectorAll('.seg-btn'));
  els.modeHint = document.getElementById('mode-hint');
  els.list = document.getElementById('history-list');
  els.empty = document.getElementById('history-empty');
  els.clear = document.getElementById('clear');
  els.shortcut = document.getElementById('shortcut');
  els.copied = document.getElementById('copied');

  init();
  wire();
});

function init() {
  showPlatformHotkey();
  chrome.storage.local.get({ mode: 'context', history: [] }, function (res) {
    setActiveMode(res.mode || 'context');
    renderHistory(res.history || []);
  });
}

function showPlatformHotkey() {
  // Reflect the actual configured shortcut when available.
  if (chrome.commands && chrome.commands.getAll) {
    chrome.commands.getAll(function (cmds) {
      var cmd = (cmds || []).find(function (c) { return c.name === 'toggle-inspect'; });
      if (cmd && cmd.shortcut) els.hotkey.textContent = cmd.shortcut;
      else if (!isMac()) els.hotkey.textContent = 'Ctrl+Shift+E';
    });
  } else if (!isMac()) {
    els.hotkey.textContent = 'Ctrl+Shift+E';
  }
}

function isMac() {
  var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  return /mac/i.test(p);
}

function wire() {
  els.start.addEventListener('click', function () {
    chrome.runtime.sendMessage({ type: 'pluck:start' }, function () {
      window.close(); // hand focus back to the page for the selection gesture
    });
  });

  els.segBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mode = btn.getAttribute('data-mode');
      setActiveMode(mode);
      chrome.storage.local.set({ mode: mode });
    });
  });

  els.shortcut.addEventListener('click', function () {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  els.clear.addEventListener('click', function () {
    chrome.storage.local.set({ history: [] }, function () { renderHistory([]); });
  });
}

function setActiveMode(mode) {
  els.segBtns.forEach(function (btn) {
    var on = btn.getAttribute('data-mode') === mode;
    btn.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  els.modeHint.textContent = MODE_HINTS[mode] || '';
}

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
    meta.textContent = hostOf(item.url) + ' · ' + timeAgo(item.ts);

    btn.appendChild(sel);
    btn.appendChild(meta);
    btn.addEventListener('click', function () { recopy(item); });
    li.appendChild(btn);
    els.list.appendChild(li);
  });
}

function recopy(item) {
  var text = item.full || item.selector || item.headline || '';
  navigator.clipboard.writeText(text).then(showCopied, showCopied);
}

function showCopied() {
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

/**
 * Pluck in-page shortcut listener.
 *
 * This is why the shortcut "just works" everywhere: rather than relying on
 * chrome.commands (which needs the MV3 service worker to wake — unreliable in
 * some Chromium browsers such as Arc), the shortcut is detected by a capture-
 * phase keydown listener that lives right here in the page. No service worker,
 * no injection timing, no activeTab. The combo is read from storage (set in the
 * popup) and updates live via storage.onChanged.
 *
 * Loaded as a declared content script after inspector.js, so ns.controller
 * already exists. Idempotent.
 */
(function () {
  'use strict';

  var ns = (window.__pluck = window.__pluck || {});
  if (ns.shortcutBound) return;
  ns.shortcutBound = true;

  function isMac() {
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
    return /mac/i.test(p);
  }

  // Default combo: ⌘⇧E on macOS, Ctrl+Shift+E elsewhere.
  var combo = isMac()
    ? { ctrl: false, alt: false, shift: true, meta: true, code: 'KeyE' }
    : { ctrl: true, alt: false, shift: true, meta: false, code: 'KeyE' };

  try {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ shortcut: null }, function (res) {
        if (res && res.shortcut && res.shortcut.code) combo = res.shortcut;
      });
      chrome.storage.onChanged.addListener(function (changes, area) {
        if (area === 'local' && changes.shortcut && changes.shortcut.newValue) {
          combo = changes.shortcut.newValue;
        }
      });
    }
  } catch (e) { /* storage unavailable — stay on default */ }

  function matches(e) {
    return (
      e.code === combo.code &&
      !!e.ctrlKey === !!combo.ctrl &&
      !!e.altKey === !!combo.alt &&
      !!e.shiftKey === !!combo.shift &&
      !!e.metaKey === !!combo.meta
    );
  }

  window.addEventListener('keydown', function (e) {
    if (!ns.controller || !matches(e)) return;
    e.preventDefault();
    e.stopPropagation();
    ns.controller.toggle();
  }, true);

  // Also accept a toggle pushed from the popup / service worker (covers tabs
  // opened before the extension was installed, and the toolbar button).
  try {
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(function (msg) {
        if (msg && msg.type === 'pluck:toggle' && ns.controller) ns.controller.toggle();
      });
    }
  } catch (e) { /* no runtime — fine */ }
})();

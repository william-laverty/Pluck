/**
 * Pluck background service worker (MV3).
 *
 * Triggers inspect mode on the keyboard command or a request from the popup by
 * injecting the content scripts into the active tab and toggling the controller.
 * Also stores capture history in chrome.storage.local.
 */

var CONTENT_FILES = [
  'src/content/styles.js',
  'src/content/selector.js',
  'src/content/format.js',
  'src/content/inspector.js',
];

var HISTORY_LIMIT = 10;
var RESTRICTED = /^(chrome|edge|brave|arc|about|devtools|view-source|chrome-extension|moz-extension):/i;

async function activeTab() {
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs[0];
}

async function toggleInspect(tab) {
  tab = tab || (await activeTab());
  if (!tab || !tab.id) return;
  if (tab.url && (RESTRICTED.test(tab.url) || tab.url.includes('chrome.google.com/webstore') || tab.url.includes('chromewebstore.google.com'))) {
    return flashBadge('×', '#ef4444');
  }
  try {
    // allFrames so elements inside (cross-origin) iframes are reachable; each
    // frame runs its own self-contained controller (only the top frame shows
    // the hint chip).
    await chrome.scripting.executeScript({ target: { tabId: tab.id, allFrames: true }, files: CONTENT_FILES });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: function () {
        if (window.__pluck && window.__pluck.controller) window.__pluck.controller.toggle();
      },
    });
  } catch (e) {
    flashBadge('×', '#ef4444');
  }
}

function flashBadge(text, color) {
  try {
    chrome.action.setBadgeBackgroundColor({ color: color || '#6366f1' });
    chrome.action.setBadgeText({ text: text });
    setTimeout(function () { chrome.action.setBadgeText({ text: '' }); }, 1200);
  } catch (e) { /* ignore */ }
}

chrome.commands.onCommand.addListener(function (command) {
  if (command === 'toggle-inspect') toggleInspect();
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (!msg || !msg.type) return;

  if (msg.type === 'pluck:start') {
    toggleInspect().then(function () { sendResponse({ ok: true }); });
    return true; // async response
  }

  if (msg.type === 'pluck:captured') {
    saveHistory(msg.payload).then(function () { sendResponse({ ok: true }); });
    return true;
  }
});

async function saveHistory(entry) {
  if (!entry) return;
  try {
    var store = await chrome.storage.local.get({ history: [] });
    var history = Array.isArray(store.history) ? store.history : [];
    history.unshift({
      headline: entry.headline || '',
      selector: entry.selector || '',
      full: entry.full || '',
      url: entry.url || '',
      ts: Date.now(),
    });
    if (history.length > HISTORY_LIMIT) history = history.slice(0, HISTORY_LIMIT);
    await chrome.storage.local.set({ history: history });
    flashBadge('✓', '#6366f1');
  } catch (e) { /* ignore */ }
}

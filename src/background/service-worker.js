/**
 * Pluck background service worker (MV3).
 *
 * The shortcut itself is handled in-page by src/content/shortcut.js (no command
 * API — see that file for why). This worker only handles the toolbar "Start
 * inspecting" request and stores capture history.
 *
 * For the toolbar path it first messages the already-present content script;
 * if the tab has no content script yet (opened before the extension loaded), it
 * injects on demand as a fallback.
 */

var CONTENT_FILES = [
  'src/content/styles.js',
  'src/content/selector.js',
  'src/content/format.js',
  'src/content/inspector.js',
  'src/content/shortcut.js',
];

var HISTORY_LIMIT = 10;
var RESTRICTED = /^(chrome|edge|brave|arc|about|devtools|view-source|chrome-extension|moz-extension|data):/i;

async function activeTab() {
  var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs && tabs[0];
}

function isRestricted(url) {
  if (!url) return false;
  return RESTRICTED.test(url) ||
    url.includes('chromewebstore.google.com') ||
    url.includes('chrome.google.com/webstore');
}

async function toggleInspect(tab) {
  tab = tab || (await activeTab());
  if (!tab || !tab.id) return;

  // Preferred path: the declared content script is already on the page.
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'pluck:toggle' });
    return;
  } catch (e) {
    // No receiver — tab predates the install, or is a restricted page.
  }

  if (isRestricted(tab.url)) return flashBadge('×', '#ef4444');

  // Fallback: inject on demand into a tab that doesn't have the content script.
  try {
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
      isUnique: entry.isUnique !== false,
      ts: Date.now(),
    });
    if (history.length > HISTORY_LIMIT) history = history.slice(0, HISTORY_LIMIT);
    await chrome.storage.local.set({ history: history });
    flashBadge('✓', '#6366f1');
  } catch (e) { /* ignore */ }
}

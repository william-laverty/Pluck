'use strict';

var test = require('node:test');
var assert = require('node:assert');
var fs = require('node:fs');
var path = require('node:path');
var vm = require('node:vm');

var SW_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'background', 'service-worker.js'), 'utf8');

// Build a fresh mocked `chrome` + a loaded service worker for each test.
function loadSW(opts) {
  opts = opts || {};
  var mem = {};
  var listeners = { message: [] };
  var calls = { executeScript: [], badge: [], sendMessage: [] };
  var tabUrl = opts.url || 'https://example.com/';
  // Default: a content script IS present (sendMessage resolves).
  var sendMessageBehavior = opts.sendMessageRejects
    ? function () { return Promise.reject(new Error('Could not establish connection')); }
    : function () { return Promise.resolve(undefined); };

  var chrome = {
    runtime: { onMessage: { addListener: function (fn) { listeners.message.push(fn); } } },
    tabs: {
      query: function () { return Promise.resolve([{ id: 7, url: tabUrl }]); },
      create: function () {},
      sendMessage: function (id, msg) { calls.sendMessage.push({ id: id, msg: msg }); return sendMessageBehavior(); },
    },
    scripting: {
      executeScript: function (o) { calls.executeScript.push(o); return Promise.resolve([]); },
    },
    action: {
      setBadgeBackgroundColor: function () {},
      setBadgeText: function (o) { calls.badge.push(o.text); },
    },
    storage: {
      local: {
        get: function (defaults) {
          var out = {};
          Object.keys(defaults).forEach(function (k) { out[k] = k in mem ? mem[k] : defaults[k]; });
          return Promise.resolve(out);
        },
        set: function (obj) { Object.assign(mem, obj); return Promise.resolve(); },
      },
    },
  };

  var sandbox = { chrome: chrome, console: console, setTimeout: setTimeout, clearTimeout: clearTimeout, URL: URL };
  vm.createContext(sandbox);
  vm.runInContext(SW_SRC, sandbox);

  function send(msg) {
    return new Promise(function (resolve) {
      var sendResponse = function (r) { resolve({ response: r }); };
      var ret = listeners.message[0](msg, { tab: { id: 7 } }, sendResponse);
      if (ret !== true) setTimeout(function () { resolve({ response: undefined, sync: true }); }, 0);
    });
  }

  return { chrome: chrome, mem: function () { return mem; }, listeners: listeners, calls: calls, send: send };
}

test('registers a message listener on load (no commands API)', function () {
  var sw = loadSW();
  assert.strictEqual(sw.listeners.message.length, 1);
  assert.ok(!/chrome\.commands/.test(SW_SRC), 'service worker should not use chrome.commands');
});

test('pluck:captured persists a history entry (newest first)', async function () {
  var sw = loadSW();
  await sw.send({ type: 'pluck:captured', payload: { headline: 'a.x', selector: 'a.x', full: 'a.x', url: 'https://s/' } });
  await sw.send({ type: 'pluck:captured', payload: { headline: 'b.y', selector: 'b.y', full: 'b.y', url: 'https://s/' } });
  var h = sw.mem().history;
  assert.strictEqual(h.length, 2);
  assert.strictEqual(h[0].headline, 'b.y', 'newest should be first');
  assert.ok(typeof h[0].ts === 'number');
});

test('pluck:captured records the isUnique flag', async function () {
  var sw = loadSW();
  await sw.send({ type: 'pluck:captured', payload: { headline: 'a', selector: 'a', isUnique: false } });
  await sw.send({ type: 'pluck:captured', payload: { headline: 'b', selector: 'b' } }); // omitted → unique
  var h = sw.mem().history;
  assert.strictEqual(h[0].isUnique, true, 'omitted isUnique defaults to true');
  assert.strictEqual(h[1].isUnique, false, 'explicit false is preserved');
});

test('history is capped at 10 entries', async function () {
  var sw = loadSW();
  for (var i = 0; i < 14; i++) {
    await sw.send({ type: 'pluck:captured', payload: { headline: 'el' + i, selector: 'el' + i } });
  }
  var h = sw.mem().history;
  assert.strictEqual(h.length, 10);
  assert.strictEqual(h[0].headline, 'el13', 'most recent kept');
});

test('pluck:start toggles via the content script when present (no injection)', async function () {
  var sw = loadSW(); // sendMessage resolves → content script present
  await sw.send({ type: 'pluck:start' });
  await new Promise(function (r) { setTimeout(r, 10); });
  assert.strictEqual(sw.calls.sendMessage.length, 1, 'should message the content script');
  assert.strictEqual(sw.calls.sendMessage[0].msg.type, 'pluck:toggle');
  assert.strictEqual(sw.calls.executeScript.length, 0, 'must NOT inject when content script is present');
});

test('pluck:start falls back to injection when no content script', async function () {
  var sw = loadSW({ sendMessageRejects: true });
  await sw.send({ type: 'pluck:start' });
  await new Promise(function (r) { setTimeout(r, 10); });
  assert.ok(sw.calls.executeScript.length >= 2, 'should inject files then toggle');
  var filesCall = sw.calls.executeScript[0];
  assert.ok(filesCall.files.some(function (f) { return /inspector\.js$/.test(f); }));
  assert.ok(filesCall.files.some(function (f) { return /shortcut\.js$/.test(f); }));
  assert.ok(filesCall.target.allFrames === true);
});

test('does not inject into restricted pages when content script is absent', async function () {
  var sw = loadSW({ sendMessageRejects: true, url: 'chrome://settings' });
  await sw.send({ type: 'pluck:start' });
  await new Promise(function (r) { setTimeout(r, 10); });
  assert.strictEqual(sw.calls.executeScript.length, 0, 'restricted page must not be injected');
});

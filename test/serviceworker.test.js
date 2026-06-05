'use strict';

var test = require('node:test');
var assert = require('node:assert');
var fs = require('node:fs');
var path = require('node:path');
var vm = require('node:vm');

var SW_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'background', 'service-worker.js'), 'utf8');

// Build a fresh mocked `chrome` + a loaded service worker for each test.
function loadSW() {
  var mem = {};
  var listeners = { command: [], message: [] };
  var calls = { executeScript: [], badge: [] };

  var chrome = {
    commands: { onCommand: { addListener: function (fn) { listeners.command.push(fn); } } },
    runtime: { onMessage: { addListener: function (fn) { listeners.message.push(fn); } } },
    tabs: {
      query: function () { return Promise.resolve([{ id: 7, url: 'https://example.com/' }]); },
      create: function () {},
    },
    scripting: {
      executeScript: function (opts) { calls.executeScript.push(opts); return Promise.resolve([]); },
    },
    action: {
      setBadgeBackgroundColor: function () {},
      setBadgeText: function (o) { calls.badge.push(o.text); },
    },
    storage: {
      local: {
        get: function (defaults) {
          var out = {};
          Object.keys(defaults).forEach(function (k) {
            out[k] = k in mem ? mem[k] : defaults[k];
          });
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
      var responded = false;
      var sendResponse = function (r) { responded = true; resolve({ response: r }); };
      var ret = listeners.message[0](msg, { tab: { id: 7 } }, sendResponse);
      // If the handler isn't async, resolve on the next tick.
      if (ret !== true) setTimeout(function () { if (!responded) resolve({ response: undefined, sync: true }); }, 0);
    });
  }

  return { chrome: chrome, mem: function () { return mem; }, listeners: listeners, calls: calls, send: send };
}

test('registers command and message listeners on load', function () {
  var sw = loadSW();
  assert.strictEqual(sw.listeners.command.length, 1);
  assert.strictEqual(sw.listeners.message.length, 1);
});

test('pluck:captured persists a history entry (newest first)', async function () {
  var sw = loadSW();
  await sw.send({ type: 'pluck:captured', payload: { headline: 'a.x', selector: 'a.x', full: 'a.x', url: 'https://s/' } });
  await sw.send({ type: 'pluck:captured', payload: { headline: 'b.y', selector: 'b.y', full: 'b.y', url: 'https://s/' } });
  var h = sw.mem().history;
  assert.strictEqual(h.length, 2);
  assert.strictEqual(h[0].headline, 'b.y', 'newest should be first');
  assert.strictEqual(h[1].headline, 'a.x');
  assert.ok(typeof h[0].ts === 'number');
});

test('history is capped at 10 entries', async function () {
  var sw = loadSW();
  for (var i = 0; i < 14; i++) {
    await sw.send({ type: 'pluck:captured', payload: { headline: 'el' + i, selector: 'el' + i } });
  }
  var h = sw.mem().history;
  assert.strictEqual(h.length, 10);
  assert.strictEqual(h[0].headline, 'el13', 'most recent kept');
  assert.strictEqual(h[9].headline, 'el4', 'oldest of the kept window');
});

test('pluck:start injects content files then toggles', async function () {
  var sw = loadSW();
  await sw.send({ type: 'pluck:start' });
  // allow the async injection chain to settle
  await new Promise(function (r) { setTimeout(r, 10); });
  assert.ok(sw.calls.executeScript.length >= 2, 'should inject files then call toggle');
  var filesCall = sw.calls.executeScript[0];
  assert.ok(Array.isArray(filesCall.files) && filesCall.files.length === 4, 'injects the 4 content files');
  assert.ok(filesCall.files.some(function (f) { return /inspector\.js$/.test(f); }));
  var funcCall = sw.calls.executeScript[1];
  assert.ok(typeof funcCall.func === 'function', 'second call toggles via injected function');
});

test('does not inject into restricted pages', async function () {
  var sw = loadSW();
  sw.chrome.tabs.query = function () { return Promise.resolve([{ id: 9, url: 'chrome://settings' }]); };
  await sw.send({ type: 'pluck:start' });
  await new Promise(function (r) { setTimeout(r, 10); });
  assert.strictEqual(sw.calls.executeScript.length, 0, 'restricted page must not be injected');
});

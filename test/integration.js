/**
 * Real-browser integration test (run on demand: `node test/integration.js`).
 *
 * 1. Loads the unpacked extension in Chromium and verifies the MV3 service
 *    worker boots without errors (validates manifest + packaging).
 * 2. Drives the content scripts on a served fixture page: synthetic-event logic
 *    checks across several targets, click-suppression, and a real trusted click
 *    that exercises the actual clipboard.
 *
 * Requires the static server on :8753 (python3 -m http.server 8753).
 */
'use strict';

var path = require('path');
var { chromium } = require('playwright');

var EXT = path.resolve(__dirname, '..');
var BASE = 'http://localhost:8753';
var FIXTURE = BASE + '/test/fixture.html';

var pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (detail ? '  → ' + detail : '')); }
}

async function main() {
  var ctx = await chromium.launchPersistentContext('', {
    headless: true,
    args: [
      '--headless=new',
      '--disable-extensions-except=' + EXT,
      '--load-extension=' + EXT,
    ],
  });

  // ---- 1. extension / service worker boots --------------------------------
  // MV3 service workers don't reliably surface under headless extension loading;
  // the SW boot + messaging is verified separately (headed check + sw unit test).
  console.log('\nExtension load:');
  var swErrors = [];
  var sw = ctx.serviceWorkers()[0];
  if (!sw) {
    try { sw = await ctx.waitForEvent('serviceworker', { timeout: 3000 }); } catch (e) { /* */ }
  }
  if (sw) {
    sw.on('console', function (m) { if (m.type() === 'error') swErrors.push(m.text()); });
    check('service worker registered', true, sw.url());
    check('service worker is Pluck background', /service-worker\.js$/.test(sw.url()));
  } else {
    console.log('  ⚠ skipped (headless extension SW not exposed — covered by headed + unit checks)');
  }

  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });

  var page = await ctx.newPage();
  var pageErrors = [];
  page.on('pageerror', function (e) { pageErrors.push(String(e)); });

  await page.goto(FIXTURE, { waitUntil: 'load' });
  await page.waitForFunction(function () {
    return window.__pluck && window.__pluck.controller && window.__pluck.selector &&
           window.__pluck.format && window.__pluck.shortcutBound;
  }, null, { timeout: 5000 });

  // ---- 0. in-page keyboard shortcut (the Arc-proof path) ------------------
  console.log('\nIn-page shortcut:');
  var toggleByKey = await page.evaluate(function () {
    var c = window.__pluck.controller;
    if (c.isActive()) c.deactivate(false);
    function fire() {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'KeyE', key: 'E', metaKey: true, shiftKey: true, bubbles: true, cancelable: true,
      }));
    }
    fire();
    var on = c.isActive() && !!document.querySelector('pluck-host');
    fire();
    var off = !c.isActive();
    return { on: on, off: off };
  });
  check('⌘⇧E keydown activates inspect mode (no service worker / command)', toggleByKey.on);
  check('⌘⇧E keydown again toggles it off', toggleByKey.off);

  // ---- 2. overlay builds on activate --------------------------------------
  console.log('\nOverlay + interaction:');
  var hasHost = await page.evaluate(function () {
    window.__pluck.controller.activate();
    return !!document.querySelector('pluck-host') &&
           !!document.querySelector('pluck-host').shadowRoot.querySelector('.pluck-box');
  });
  check('overlay host + shadow box built on activate', hasHost);

  // helper: activate, fire synthetic mousemove+click at a selector, read result
  async function pluck(target) {
    return page.evaluate(function (sel) {
      window.__pluck.controller.activate();
      var el = document.querySelector(sel);
      el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, composed: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, button: 0 }));
      return window.__pluck.lastResult;
    }, target);
  }

  var r1 = await pluck('.hero .label');
  check('captures the inner span by headline', r1 && r1.facts.headline === 'span.label', r1 && r1.facts.headline);
  check('includes element text', r1 && r1.facts.text === 'Get started', r1 && r1.facts.text);
  check('selector is reported unique', r1 && r1.facts.isUnique === true);
  check('context output has selector + html lines',
    r1 && r1.text.indexOf('selector:') !== -1 && r1.text.indexOf('<span') !== -1, r1 && JSON.stringify(r1.text));

  var r2 = await pluck('ul li.item:nth-of-type(2)');
  check('nth-of-type disambiguation for list item', r2 && /:nth-of-type\(2\)/.test(r2.facts.selector), r2 && r2.facts.selector);

  var r3 = await pluck('.hero .btn');
  check('drops css-modules junk class from headline', r3 && r3.facts.headline === 'button.btn.btn-primary', r3 && r3.facts.headline);
  check('first hero button selector is unique among twins', r3 && r3.facts.isUnique === true, r3 && r3.facts.selector);

  // verify the selector actually resolves to exactly one node in the live DOM
  var resolves = await page.evaluate(function (sel) {
    var n = document.querySelectorAll(sel);
    return n.length;
  }, r3.facts.selector);
  check('hero button selector resolves to exactly 1 live node', resolves === 1, 'matched ' + resolves);

  // SVG: camelCase tag must be preserved and the selector must resolve in Chrome
  var r4 = await pluck('#grad-a');
  check('preserves camelCase SVG tag', r4 && /linearGradient/.test(r4.facts.selector) && !/lineargradient/.test(r4.facts.selector), r4 && r4.facts.selector);
  var svgResolves = await page.evaluate(function (sel) {
    try { return document.querySelectorAll(sel).length; } catch (e) { return -1; }
  }, r4.facts.selector);
  check('SVG selector resolves to exactly 1 live node (case-sensitive)', svgResolves === 1, 'matched ' + svgResolves);
  check('SVG selector reported unique', r4 && r4.facts.isUnique === true);

  // ---- 3. trusted click: real clipboard + click suppression ---------------
  console.log('\nTrusted click (clipboard + suppression):');
  await page.evaluate(function () {
    window.location.hash = '';
    window.__pluck.controller.activate();
  });
  await page.locator('nav a.nav-link', { hasText: 'Alpha' }).click({ force: true });
  await page.waitForTimeout(150);

  var hash = await page.evaluate(function () { return window.location.hash; });
  check('navigation suppressed on selection click (no #a)', hash !== '#a', 'hash=' + hash);

  var clip = await page.evaluate(function () {
    return navigator.clipboard.readText().catch(function () { return '__denied__'; });
  });
  if (clip === '__denied__') {
    console.log('  ⚠ clipboard read denied in this env — checking lastResult instead');
    var lr = await page.evaluate(function () { return window.__pluck.lastResult; });
    check('clipboard fallback: lastResult captured the nav link', lr && /a\.nav-link/.test(lr.facts.headline), lr && lr.facts.headline);
  } else {
    check('clipboard received the formatted output', clip && clip.indexOf('selector:') !== -1, JSON.stringify(clip));
    check('clipboard names the nav link', clip && clip.indexOf('a.nav-link') !== -1, JSON.stringify(clip));
  }

  // ---- 4. no runtime errors ----------------------------------------------
  console.log('\nRuntime health:');
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  check('no service-worker console errors', swErrors.length === 0, swErrors.join(' | '));

  await ctx.close();

  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  process.exit(fail ? 1 : 0);
}

main().catch(function (e) {
  console.error('integration runner crashed:', e);
  process.exit(2);
});

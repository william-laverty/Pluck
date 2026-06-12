#!/usr/bin/env node
/**
 * Generate Chrome Web Store + README marketing assets by driving the REAL
 * extension in headed Chromium with REAL trusted input (mouse + keyboard) —
 * no mockups: every overlay pixel is the product reacting to a user.
 *
 * Note on worlds: in headed Chromium the content scripts live in the isolated
 * world, so page.evaluate can't reach window.__pluck. Everything is driven
 * through real input events and service-worker messages instead; the pure
 * selector/format modules are injected into the MAIN world separately when
 * their output is needed for a composition.
 *
 * Outputs:
 *   store/assets/screenshot-1-inspect.png   1280×800  inspect mode on a page
 *   store/assets/screenshot-2-copied.png    1280×800  confirmation toast
 *   store/assets/screenshot-3-popup.png     1280×800  popup, light & dark
 *   store/assets/screenshot-4-formats.png   1280×800  the three copy formats
 *   store/assets/promo-small-440x280.png    store small promo tile
 *   store/assets/promo-marquee-1400x560.png store marquee
 *   docs/overlay.png                        README hero still
 *   docs/demo.gif                           README demo (requires ffmpeg)
 *
 * Run: python3 -m http.server 8753 &   (repo root)
 *      node scripts/store-assets.js
 */
'use strict';

var fs = require('fs');
var os = require('os');
var path = require('path');
var cp = require('child_process');
var { chromium } = require('playwright');

var ROOT = path.resolve(__dirname, '..');
var BASE = 'http://localhost:8753';
var DEMO = BASE + '/store/demo/demo.html';
var OUT = path.join(ROOT, 'store', 'assets');
var DOCS = path.join(ROOT, 'docs');

function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

// Park the physical macOS cursor far from the headed window. A real cursor
// resting over the page emits genuine mousemove events that fight the scripted
// ones and repaint the overlay onto the wrong element.
function parkCursor() {
  try {
    cp.execSync('python3 -c "import Quartz; Quartz.CGWarpMouseCursorPosition((3000, 2000))"', { stdio: 'pipe' });
  } catch (e) { /* best effort — verification below catches interference */ }
}
function dataUri(file) {
  return 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
}
function tmpProfile(tag) {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'pluck-' + tag + '-'));
}

async function launch(tag, options) {
  var ctx = await chromium.launchPersistentContext(tmpProfile(tag), Object.assign({
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: [
      '--disable-extensions-except=' + ROOT,
      '--load-extension=' + ROOT,
      '--hide-scrollbars',
    ],
  }, options || {}));
  var sw = ctx.serviceWorkers()[0];
  if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  return { ctx: ctx, sw: sw, extId: new URL(sw.url()).host };
}

// Toggle inspect mode in the active tab via the service worker (the same path
// the toolbar button uses), then wait for the overlay host to (dis)appear.
async function swToggle(sw, page, expectOn) {
  var result = await sw.evaluate(async function () {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs[0]) return 'no-active-tab';
    try {
      await chrome.tabs.sendMessage(tabs[0].id, { type: 'pluck:toggle' });
      return 'ok';
    } catch (e) {
      return 'no-receiver';
    }
  });
  if (result !== 'ok') throw new Error('toggle failed: ' + result);
  await page.waitForFunction(function (on) {
    var host = document.querySelector('pluck-host');
    return on ? !!(host && host.shadowRoot && host.shadowRoot.querySelector('.pluck-layer')) : !host;
  }, expectOn, { timeout: 4000 });
}

async function openDemo(ctx) {
  var page = await ctx.newPage();
  await page.goto(DEMO, { waitUntil: 'load' });
  await page.waitForTimeout(1200); // let document_idle content scripts settle
  return page;
}

async function hover(page, selector) {
  var box = await page.locator(selector).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
  await page.waitForTimeout(350);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

// ---------------------------------------------------------------------------
// Shots 1 & 2: inspect mode + toast, on the demo page
// ---------------------------------------------------------------------------
async function captureOverlayShots(ctx, sw) {
  var page = await openDemo(ctx);

  // verify-and-retry: stray real cursor events can repaint the overlay between
  // our scripted move and the click, so confirm via the clipboard each attempt
  var clip = null;
  for (var attempt = 1; attempt <= 3; attempt++) {
    parkCursor();
    var hostPresent = await page.evaluate(function () { return !!document.querySelector('pluck-host'); });
    if (!hostPresent) await swToggle(sw, page, true);
    var pt = await hover(page, '.cta .btn-primary');
    await page.mouse.move(pt.x, pt.y); // re-pin the highlight right before the shot
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(OUT, 'screenshot-1-inspect.png') });

    await page.mouse.move(pt.x, pt.y); // re-pin again right before the click
    await page.mouse.click(pt.x, pt.y);
    await page.waitForTimeout(500); // toast slide-in settles (auto-hide is 1600ms)
    await page.screenshot({ path: path.join(OUT, 'screenshot-2-copied.png') });

    clip = await page.evaluate(function () {
      return navigator.clipboard.readText().catch(function () { return null; });
    });
    if (clip && clip.indexOf('button.btn.btn-primary') !== -1) break;
    console.log('  ⚠ attempt ' + attempt + ' captured wrong element (' + JSON.stringify((clip || '').split('\n')[0]) + ') — retrying');
    await page.waitForTimeout(1900); // let the toast clear before re-activating
  }
  if (!clip || clip.indexOf('button.btn.btn-primary') === -1) {
    throw new Error('could not capture the hero button cleanly: ' + JSON.stringify(clip));
  }
  fs.copyFileSync(path.join(OUT, 'screenshot-1-inspect.png'), path.join(DOCS, 'overlay.png'));
  console.log('  ✓ screenshot-1-inspect.png (+ docs/overlay.png)');
  console.log('  ✓ screenshot-2-copied.png');
  console.log('  ✓ clipboard verified: ' + clip.split('\n')[1]);

  // real three-format outputs for shot 4: inject the pure modules into the
  // MAIN world and run them against the same element
  await page.addScriptTag({ path: path.join(ROOT, 'src/content/selector.js') });
  await page.addScriptTag({ path: path.join(ROOT, 'src/content/format.js') });
  var formats = await page.evaluate(function () {
    var ns = window.__pluck;
    var el = document.querySelector('.cta .btn-primary');
    var built = ns.selector.buildSelector(el, document);
    var text = (el.innerText || '').replace(/\s+/g, ' ').trim();
    var cs = getComputedStyle(el);
    var facts = {
      headline: built.headline,
      selector: built.unique,
      isUnique: built.isUnique,
      text: text,
      html: '<button class="btn btn-primary">' + text + '</button>',
      styles: 'color:#ffffff; background:#0d9488; font:' + cs.fontWeight + ' ' + cs.fontSize + '/1.6 -apple-system; padding:' + cs.padding + '; border-radius:' + cs.borderRadius,
    };
    return {
      selector: ns.format.formatElement(facts, 'selector'),
      context: ns.format.formatElement(facts, 'context'),
      full: ns.format.formatElement(facts, 'full'),
    };
  });
  await page.close();
  return formats;
}

// ---------------------------------------------------------------------------
// Popup captures (light + dark) at 2x for crispness
// ---------------------------------------------------------------------------
var HISTORY_SEED = [
  { headline: 'button.btn.btn-primary', selector: 'div.cta > button.btn.btn-primary', full: '', url: 'https://solstice.app/', isUnique: true, ts: Date.now() - 50 * 1000 },
  { headline: 'a.nav-link', selector: 'nav a.nav-link:nth-of-type(3)', full: '', url: 'https://solstice.app/docs', isUnique: true, ts: Date.now() - 9 * 60 * 1000 },
  { headline: 'div.card', selector: 'section.features div.card', full: '', url: 'https://dashboard.acme.dev/', isUnique: false, ts: Date.now() - 42 * 60 * 1000 },
  { headline: 'h1.hero-title', selector: 'header > h1.hero-title', full: '', url: 'https://linear.dev/changelog', isUnique: true, ts: Date.now() - 3 * 3600 * 1000 },
];

async function capturePopup(scheme, outFile) {
  var b = await launch('popup-' + scheme, { deviceScaleFactor: 2, viewport: { width: 460, height: 700 } });
  var page = await b.ctx.newPage();
  await page.emulateMedia({ colorScheme: scheme });
  await page.goto('chrome-extension://' + b.extId + '/src/popup/popup.html');
  await page.evaluate(function (hist) {
    return new Promise(function (res) {
      chrome.storage.local.set({ history: hist, mode: 'context', shortcut: null }, res);
    });
  }, HISTORY_SEED);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.locator('body').screenshot({ path: outFile });
  await b.ctx.close();
  console.log('  ✓ popup ' + scheme + ' captured');
}

// ---------------------------------------------------------------------------
// Branded composition pages (rendered → screenshot at exact store sizes)
// ---------------------------------------------------------------------------
var COMPO_BASE_CSS = [
  '*{box-sizing:border-box;margin:0}',
  'html,body{height:100%}',
  'body{font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;',
  '  background:#08080f;color:#f4f4f5;-webkit-font-smoothing:antialiased;overflow:hidden}',
  '.glow{position:fixed;inset:0;pointer-events:none;background:',
  '  radial-gradient(58% 48% at 50% -6%, rgba(99,102,241,0.32), transparent 70%),',
  '  radial-gradient(40% 34% at 88% 102%, rgba(79,70,229,0.20), transparent 70%)}',
  '.mark{border-radius:24%;display:inline-flex;align-items:center;justify-content:center;',
  '  color:#fff;background:linear-gradient(135deg,#6366f1,#4f46e5);',
  '  box-shadow:0 10px 34px -10px rgba(99,102,241,0.75), inset 0 1px 0 rgba(255,255,255,0.25)}',
  '.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}',
].join('\n');

function markSvg(size) {
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none">' +
    '<path d="M5 5h4M5 5v4M19 5h-4M19 5v4M5 19h4M5 19v-4M19 19h-4M19 19v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<circle cx="12" cy="12" r="2" fill="currentColor"/></svg>';
}

async function renderComposition(ctx, html, width, height, outFile) {
  var page = await ctx.newPage();
  await page.setViewportSize({ width: width, height: height });
  await page.setContent('<!DOCTYPE html><html><head><style>' + COMPO_BASE_CSS + '</style></head><body>' + html + '</body></html>', { waitUntil: 'load' });
  await page.waitForTimeout(150);
  await page.screenshot({ path: outFile });
  await page.close();
  console.log('  ✓ ' + path.basename(outFile));
}

function popupCompositionHtml(lightUri, darkUri) {
  return '<div class="glow"></div>' +
    '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px">' +
    '  <div style="display:flex;align-items:center;gap:12px">' +
    '    <span class="mark" style="width:40px;height:40px">' + markSvg(24) + '</span>' +
    '    <div><div style="font-size:21px;font-weight:700;letter-spacing:-0.4px">Format, shortcut & history</div>' +
    '    <div style="font-size:14px;color:#9ca3af">The whole popup. Light and dark, automatically.</div></div>' +
    '  </div>' +
    '  <div style="display:flex;gap:34px;align-items:flex-start">' +
    '    <img src="' + lightUri + '" style="width:320px;border-radius:14px;box-shadow:0 24px 70px -22px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.10)">' +
    '    <img src="' + darkUri + '" style="width:320px;border-radius:14px;box-shadow:0 24px 70px -22px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.10)">' +
    '  </div>' +
    '</div>';
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatsCompositionHtml(formats) {
  function panel(title, body, hint, featured) {
    return '<div style="flex:1;border-radius:14px;padding:18px 20px;background:rgba(255,255,255,0.04);' +
      'box-shadow:0 0 0 1px rgba(255,255,255,' + (featured ? '0.22' : '0.09') + ')' +
      (featured ? ',0 18px 60px -18px rgba(99,102,241,0.55)' : '') + '">' +
      '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:10px">' +
      '<span style="font-weight:650;font-size:16px;letter-spacing:-0.2px;color:' + (featured ? '#c7d2fe' : '#f4f4f5') + '">' + title + '</span>' +
      '<span style="font-size:12.5px;color:#9ca3af">' + hint + '</span></div>' +
      '<pre class="mono" style="font-size:13.5px;line-height:1.7;color:#d4d4d8;white-space:pre-wrap;word-break:break-word">' + esc(body) + '</pre></div>';
  }
  return '<div class="glow"></div>' +
    '<div style="height:100%;display:flex;flex-direction:column;justify-content:center;padding:54px 64px;gap:24px">' +
    '  <div style="display:flex;align-items:center;gap:12px">' +
    '    <span class="mark" style="width:40px;height:40px">' + markSvg(24) + '</span>' +
    '    <div><div style="font-size:21px;font-weight:700;letter-spacing:-0.4px">Three formats, one click</div>' +
    '    <div style="font-size:14px;color:#9ca3af">Real output from the page in the previous screenshot.</div></div>' +
    '  </div>' +
    '  <div style="display:flex;flex-direction:column;gap:14px">' +
    panel('Selector', formats.selector, 'just the verified-unique selector') +
    panel('+ Context', formats.context, 'default — selector, text & opening tag', true) +
    panel('Full', formats.full, 'adds key computed styles') +
    '  </div>' +
    '</div>';
}

function promoTileHtml() {
  return '<div class="glow"></div>' +
    '<div style="height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">' +
    '  <span class="mark" style="width:64px;height:64px">' + markSvg(38) + '</span>' +
    '  <div style="font-size:30px;font-weight:750;letter-spacing:-0.8px">Pluck</div>' +
    '  <div style="font-size:13.5px;color:#c7c9d4;text-align:center;max-width:330px;line-height:1.45">' +
    'Click any element → an agent-ready selector on your clipboard</div>' +
    '</div>';
}

function marqueeHtml(shotUri) {
  return '<div class="glow"></div>' +
    '<div style="height:100%;display:flex;align-items:center;gap:48px;padding:0 64px">' +
    '  <div style="flex:0 0 460px">' +
    '    <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px">' +
    '      <span class="mark" style="width:54px;height:54px">' + markSvg(32) + '</span>' +
    '      <span style="font-size:40px;font-weight:750;letter-spacing:-1px">Pluck</span>' +
    '    </div>' +
    '    <div style="font-size:23px;font-weight:650;letter-spacing:-0.5px;line-height:1.25;margin-bottom:12px">' +
    'Hit a hotkey, click any element —<br>paste it straight to your AI agent.</div>' +
    '    <div style="font-size:14.5px;color:#9ca3af;line-height:1.55">Verified-unique CSS selectors with just enough context for ' +
    'Claude Code, Cursor or Copilot. No DevTools digging. No network. Works in Chrome, Edge, Brave and Arc.</div>' +
    '  </div>' +
    '  <img src="' + shotUri + '" style="flex:1;min-width:0;border-radius:14px;' +
    'box-shadow:0 30px 90px -24px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.12)">' +
    '</div>';
}

// ---------------------------------------------------------------------------
// Demo GIF: real-input choreography (inspect → refine → capture), recorded
// ---------------------------------------------------------------------------
async function recordDemo() {
  parkCursor();
  var videoDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pluck-video-'));
  var b = await launch('gif', { recordVideo: { dir: videoDir, size: { width: 1280, height: 800 } } });
  var page = await openDemo(b.ctx);

  // main-world cursor visualizer that follows REAL mouse events
  await page.evaluate(function () {
    document.body.classList.add('demo-cursor-on');
    var cursor = document.getElementById('demo-cursor');
    window.addEventListener('mousemove', function (e) {
      cursor.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
    }, true);
  });

  async function glide(selector, ms) {
    var box = await page.locator(selector).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: Math.round(ms / 16) });
  }

  await page.mouse.move(640, 480, { steps: 4 });
  await page.waitForTimeout(500);
  await swToggle(b.sw, page, true);            // hint chip pops
  await page.waitForTimeout(650);
  await glide('nav .nav-link:nth-of-type(3)', 600);
  await page.waitForTimeout(550);
  await glide('.grid .card:nth-of-type(2) h3', 650);
  await page.waitForTimeout(600);
  await glide('.cta .btn-primary', 700);
  await page.waitForTimeout(550);
  await page.keyboard.press('ArrowUp');        // refine → parent .cta
  await page.waitForTimeout(650);
  await page.keyboard.press('ArrowDown');      // back to the button
  await page.waitForTimeout(500);
  await page.mouse.down();
  await page.mouse.up();                       // capture → toast
  await page.waitForTimeout(2100);

  var clip = await page.evaluate(function () {
    return navigator.clipboard.readText().catch(function () { return null; });
  });
  console.log('  ✓ demo capture clipboard: ' + (clip ? JSON.stringify(clip.split('\n')[0]) : 'n/a'));

  var video = page.video();
  await page.close();
  var videoPath = await video.path();
  await b.ctx.close();

  // webm → gif (two-pass palette for quality)
  var palette = path.join(videoDir, 'palette.png');
  var gif = path.join(DOCS, 'demo.gif');
  cp.execSync('ffmpeg -y -loglevel error -i ' + JSON.stringify(videoPath) +
    ' -vf "fps=12,scale=960:-1:flags=lanczos,palettegen" ' + JSON.stringify(palette));
  cp.execSync('ffmpeg -y -loglevel error -i ' + JSON.stringify(videoPath) + ' -i ' + JSON.stringify(palette) +
    ' -filter_complex "fps=12,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse" ' + JSON.stringify(gif));
  var mb = (fs.statSync(gif).size / 1024 / 1024).toFixed(2);
  console.log('  ✓ docs/demo.gif (' + mb + ' MB)');
}

// ---------------------------------------------------------------------------
async function main() {
  ensureDir(OUT);
  ensureDir(DOCS);

  console.log('\nOverlay shots:');
  var b = await launch('shots');
  var formats = await captureOverlayShots(b.ctx, b.sw);

  console.log('\nPopup:');
  var lightPng = path.join(OUT, '_popup-light.png');
  var darkPng = path.join(OUT, '_popup-dark.png');
  await capturePopup('light', lightPng);
  await capturePopup('dark', darkPng);

  console.log('\nCompositions:');
  await renderComposition(b.ctx, popupCompositionHtml(dataUri(lightPng), dataUri(darkPng)), 1280, 800, path.join(OUT, 'screenshot-3-popup.png'));
  await renderComposition(b.ctx, formatsCompositionHtml(formats), 1280, 800, path.join(OUT, 'screenshot-4-formats.png'));
  await renderComposition(b.ctx, promoTileHtml(), 440, 280, path.join(OUT, 'promo-small-440x280.png'));
  await renderComposition(b.ctx, marqueeHtml(dataUri(path.join(OUT, 'screenshot-1-inspect.png'))), 1400, 560, path.join(OUT, 'promo-marquee-1400x560.png'));
  fs.unlinkSync(lightPng);
  fs.unlinkSync(darkPng);
  await b.ctx.close();

  console.log('\nDemo GIF:');
  await recordDemo();

  console.log('\nAll assets generated into store/assets/ and docs/.');
}

main().catch(function (e) {
  console.error('asset generation failed:', e);
  process.exit(1);
});

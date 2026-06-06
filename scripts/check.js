#!/usr/bin/env node
/** Static checks: parse manifest, byte-validate icons, syntax-check every JS file. */
'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var root = path.join(__dirname, '..');
var fail = 0;

function ok(msg) { console.log('  ✓ ' + msg); }
function bad(msg) { console.log('  ✗ ' + msg); fail++; }

// 1. manifest.json parses and has the essentials
try {
  var m = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  if (m.manifest_version !== 3) bad('manifest_version must be 3'); else ok('manifest v3');
  ['name', 'version', 'action', 'background', 'permissions', 'host_permissions', 'content_scripts'].forEach(function (k) {
    if (!(k in m)) bad('manifest missing "' + k + '"'); else ok('manifest has ' + k);
  });
  m.permissions.forEach(function (p) {
    if (['scripting', 'storage'].indexOf(p) === -1) bad('unexpected permission: ' + p);
  });
  if (!(m.host_permissions || []).includes('<all_urls>')) bad('host_permissions must include <all_urls>');
  else ok('host_permissions grants <all_urls>');
  var cs = (m.content_scripts || [])[0] || {};
  if (!(cs.matches || []).includes('<all_urls>')) bad('content_scripts must match <all_urls>');
  else ok('content_scripts injected on <all_urls>');
  if (!(cs.js || []).some(function (f) { return /shortcut\.js$/.test(f); })) bad('content_scripts must include shortcut.js');
  // referenced files exist
  var refs = [m.background.service_worker, m.action.default_popup]
    .concat(Object.values(m.icons || {}))
    .concat(cs.js || []);
  refs.forEach(function (r) {
    if (!fs.existsSync(path.join(root, r))) bad('manifest references missing file: ' + r);
  });
  ok('all manifest-referenced files exist');
} catch (e) {
  bad('manifest.json: ' + e.message);
}

// 2. icons are valid PNGs
['16', '32', '48', '128'].forEach(function (s) {
  var p = path.join(root, 'icons', 'icon' + s + '.png');
  if (!fs.existsSync(p)) return bad('missing icon' + s + '.png');
  var b = fs.readFileSync(p);
  if (b.slice(0, 8).toString('hex') !== '89504e470d0a1a0a') bad('icon' + s + ' bad PNG signature');
  else ok('icon' + s + '.png valid');
});

// 3. syntax-check every JS file
function walk(dir, acc) {
  fs.readdirSync(dir).forEach(function (name) {
    if (name === 'node_modules' || name === '.git') return;
    var full = path.join(dir, name);
    var st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (name.endsWith('.js')) acc.push(full);
  });
  return acc;
}
walk(root, []).forEach(function (file) {
  try {
    cp.execSync('node --check ' + JSON.stringify(file), { stdio: 'pipe' });
    ok('syntax ' + path.relative(root, file));
  } catch (e) {
    bad('syntax ' + path.relative(root, file) + ': ' + String(e.stderr || e.message).trim());
  }
});

console.log('');
if (fail) { console.log(fail + ' check(s) failed'); process.exit(1); }
console.log('All static checks passed.');

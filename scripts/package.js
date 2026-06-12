#!/usr/bin/env node
/**
 * Build a Chrome-Web-Store-ready zip into dist/.
 *
 * Includes exactly what the extension needs at runtime: manifest.json, icons/,
 * and src/. Runs the static gate first, then verifies the produced archive
 * contains every manifest-referenced file.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var root = path.join(__dirname, '..');

function run(cmd, opts) {
  return cp.execSync(cmd, Object.assign({ cwd: root, stdio: 'pipe' }, opts)).toString();
}

// 0. gate first — never package a broken tree
cp.execSync('node ' + JSON.stringify(path.join(__dirname, 'check.js')), { cwd: root, stdio: 'inherit' });

var manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
var version = manifest.version;
var outDir = path.join(root, 'dist');
var outFile = path.join(outDir, 'pluck-v' + version + '.zip');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

// -X strips extra file attributes; exclude OS junk
run('zip -X -r ' + JSON.stringify(outFile) + ' manifest.json icons src -x "*.DS_Store"');

// verify: every manifest-referenced file made it into the archive
var listed = run('unzip -Z1 ' + JSON.stringify(outFile)).split('\n').filter(Boolean);
var cs = (manifest.content_scripts || [])[0] || {};
var refs = [manifest.background.service_worker, manifest.action.default_popup]
  .concat(Object.values(manifest.icons || {}))
  .concat(cs.js || []);
var missing = refs.filter(function (r) { return listed.indexOf(r) === -1; });
if (missing.length) {
  console.error('✗ zip is missing manifest-referenced files: ' + missing.join(', '));
  process.exit(1);
}

// the popup references siblings by relative path; make sure they shipped too
['src/popup/popup.css', 'src/popup/popup.js'].forEach(function (f) {
  if (listed.indexOf(f) === -1) {
    console.error('✗ zip is missing popup asset: ' + f);
    process.exit(1);
  }
});

var bytes = fs.statSync(outFile).size;
console.log('\n✓ ' + path.relative(root, outFile) + ' (' + (bytes / 1024).toFixed(1) + ' KB, ' + listed.length + ' files)');
console.log('  Upload at https://chrome.google.com/webstore/devconsole');

'use strict';

var test = require('node:test');
var assert = require('node:assert');
var fmt = require('../src/content/format.js');

var FACTS = {
  headline: 'button.btn.btn-primary',
  selector: 'main > section.hero > div.cta > button.btn.btn-primary',
  text: 'Get started',
  html: '<button class="btn btn-primary" type="button">Get started</button>',
  styles: 'color:#fff; background:#4f46e5; font:600 14px/1.5 Inter; padding:10px 20px; border-radius:8px',
};

test('selector mode returns only the unique selector', function () {
  assert.strictEqual(fmt.formatElement(FACTS, 'selector'), FACTS.selector);
});

test('context mode includes headline, text, selector line and html', function () {
  var out = fmt.formatElement(FACTS, 'context');
  var lines = out.split('\n');
  assert.strictEqual(lines.length, 3);
  assert.strictEqual(lines[0], 'button.btn.btn-primary  ·  "Get started"');
  assert.strictEqual(lines[1], 'selector: ' + FACTS.selector);
  assert.strictEqual(lines[2], FACTS.html);
  assert.ok(out.indexOf('styles:') === -1, 'context mode must not include styles');
});

test('full mode appends the styles line', function () {
  var out = fmt.formatElement(FACTS, 'full');
  var lines = out.split('\n');
  assert.strictEqual(lines.length, 4);
  assert.strictEqual(lines[3], 'styles: ' + FACTS.styles);
});

test('omits the text segment when there is no text', function () {
  var out = fmt.formatElement(Object.assign({}, FACTS, { text: '' }), 'context');
  assert.strictEqual(out.split('\n')[0], 'button.btn.btn-primary');
});

test('unknown mode defaults to context', function () {
  var out = fmt.formatElement(FACTS, 'banana');
  assert.strictEqual(out.split('\n').length, 3);
});

test('truncate collapses whitespace and ellipsizes', function () {
  assert.strictEqual(fmt.truncate('  hello   world  ', 60), 'hello world');
  var long = 'x'.repeat(80);
  var t = fmt.truncate(long, 60);
  assert.strictEqual(t.length, 60);
  assert.ok(t.endsWith('…'));
});

test('long text is truncated in the headline line', function () {
  var out = fmt.formatElement(Object.assign({}, FACTS, { text: 'A'.repeat(100) }), 'context');
  assert.ok(out.split('\n')[0].endsWith('…"'));
});

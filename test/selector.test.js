'use strict';

var test = require('node:test');
var assert = require('node:assert');
var { JSDOM } = require('jsdom');
var sel = require('../src/content/selector.js');

function docFrom(html) {
  return new JSDOM('<!DOCTYPE html><html><body>' + html + '</body></html>').window.document;
}

function assertUnique(doc, el, selector) {
  var nodes = doc.querySelectorAll(selector);
  assert.strictEqual(nodes.length, 1, 'selector "' + selector + '" should match exactly one node');
  assert.strictEqual(nodes[0], el, 'selector "' + selector + '" should match the target element');
}

test('uses a stable unique id', function () {
  var doc = docFrom('<div><button id="go" class="btn">x</button></div>');
  var el = doc.querySelector('#go');
  var r = sel.buildSelector(el, doc);
  assert.strictEqual(r.unique, 'button#go');
  assert.strictEqual(r.headline, 'button#go.btn');
  assert.ok(r.isUnique);
});

test('uses tag + meaningful classes when unique', function () {
  var doc = docFrom('<div><a class="nav-link home">h</a><span>y</span></div>');
  var el = doc.querySelector('a');
  var r = sel.buildSelector(el, doc);
  assert.strictEqual(r.unique, 'a.nav-link.home');
  assert.ok(r.isUnique);
});

test('falls back to :nth-of-type among identical siblings', function () {
  var doc = docFrom('<ul><li class="item">1</li><li class="item">2</li><li class="item">3</li></ul>');
  var el = doc.querySelectorAll('li')[1];
  var r = sel.buildSelector(el, doc);
  assert.ok(r.isUnique, 'should be unique: ' + r.unique);
  assert.match(r.unique, /:nth-of-type\(2\)/);
  assertUnique(doc, el, r.unique);
});

test('drops machine-generated junk classes from the headline', function () {
  var doc = docFrom('<div class="card css-1a2b3c sc-AbCdEf jsx-1234567890">x</div>');
  var el = doc.querySelector('div');
  var r = sel.buildSelector(el, doc);
  assert.strictEqual(r.headline, 'div.card');
});

test('isJunkClass classifies common framework hashes', function () {
  ['css-1a2b3c', 'sc-bdVaJa', 'jsx-1029384756', 'a1b2c3d4ef', '8675309'].forEach(function (c) {
    assert.ok(sel.isJunkClass(c), c + ' should be junk');
  });
  ['btn', 'btn-primary', 'nav-link', 'hero', 'card', 'is-active', 'col-6'].forEach(function (c) {
    assert.ok(!sel.isJunkClass(c), c + ' should be kept');
  });
});

test('climbs ancestors to disambiguate identical subtrees', function () {
  var doc = docFrom(
    '<section class="hero"><div class="cta"><button class="btn">a</button></div></section>' +
    '<div class="cta"><button class="btn">b</button></div>'
  );
  var el = doc.querySelector('section.hero button');
  var r = sel.buildSelector(el, doc);
  assert.ok(r.isUnique, 'should be unique: ' + r.unique);
  assert.ok(r.unique.indexOf('hero') !== -1, 'should anchor on the hero ancestor: ' + r.unique);
  assertUnique(doc, el, r.unique);
});

test('always yields a selector matching exactly the target (fuzz over a tree)', function () {
  var doc = docFrom(
    '<main><nav><a>1</a><a>2</a></nav>' +
    '<section class="a"><p>x</p><p>y</p><div><span class="t">z</span></div></section>' +
    '<section class="a"><p>x</p><p>y</p><div><span class="t">z</span></div></section></main>'
  );
  var all = doc.querySelectorAll('main *');
  all.forEach(function (el) {
    var r = sel.buildSelector(el, doc);
    assert.ok(r.isUnique, 'not unique for <' + el.tagName + '>: ' + r.unique);
    assertUnique(doc, el, r.unique);
  });
});

test('handles an element with no id/class among same-tag siblings', function () {
  var doc = docFrom('<div><p>one</p><p>two</p></div>');
  var el = doc.querySelectorAll('p')[1];
  var r = sel.buildSelector(el, doc);
  assert.ok(r.isUnique, r.unique);
  assertUnique(doc, el, r.unique);
});

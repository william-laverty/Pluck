/**
 * Pluck output formatter.
 *
 * Pure: takes a plain "facts" object (no DOM) and a mode, returns the string
 * that gets written to the clipboard. Testable in isolation.
 */
(function (root) {
  'use strict';

  var MODES = ['selector', 'context', 'full'];
  var TEXT_MAX = 60;

  function truncate(str, max) {
    if (!str) return '';
    str = String(str).replace(/\s+/g, ' ').trim();
    if (str.length <= max) return str;
    return str.slice(0, max - 1).trimEnd() + '…';
  }

  /**
   * @param {object} facts
   *   { headline, selector, text, html, styles }
   * @param {('selector'|'context'|'full')} mode
   * @returns {string}
   */
  function formatElement(facts, mode) {
    if (MODES.indexOf(mode) === -1) mode = 'context';
    var selector = facts.selector || facts.headline || '';

    if (mode === 'selector') return selector;

    var text = truncate(facts.text, TEXT_MAX);
    var headline = facts.headline || selector;
    var head = text ? headline + '  ·  "' + text + '"' : headline;

    var lines = [head, 'selector: ' + selector];
    if (facts.html) lines.push(facts.html);
    if (mode === 'full' && facts.styles) lines.push('styles: ' + facts.styles);

    return lines.join('\n');
  }

  var api = { formatElement: formatElement, truncate: truncate, MODES: MODES, TEXT_MAX: TEXT_MAX };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') {
    window.__pluck = window.__pluck || {};
    window.__pluck.format = api;
  }
})(typeof self !== 'undefined' ? self : this);

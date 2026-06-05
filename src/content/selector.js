/**
 * Pluck selector engine.
 *
 * Pure, dependency-free. Produces a verified-unique CSS selector for an element
 * plus a short, human-friendly "headline" for it. Loaded as a content script
 * (attaches to window.__pluck.selector) and also requirable in node for tests.
 */
(function (root) {
  'use strict';

  var MAX_DEPTH = 8; // how many ancestors we'll climb before giving up on uniqueness
  var MAX_CLASSES = 4; // classes kept per segment, for readability

  // Identifier escaping for ids/class names used in selectors. Prefer the
  // platform CSS.escape; otherwise use the canonical per-code-point polyfill
  // (matches the CSSOM spec; handles leading digit, "-"+digit, lone "-", etc).
  function cssEscapeIdent(value) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(value);
    }
    var string = String(value);
    var length = string.length;
    var index = -1;
    var result = '';
    var firstCodeUnit = string.charCodeAt(0);
    while (++index < length) {
      var codeUnit = string.charCodeAt(index);
      if (codeUnit === 0x0000) { result += '�'; continue; }
      if (
        (codeUnit >= 0x0001 && codeUnit <= 0x001f) || codeUnit === 0x007f ||
        (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (index === 1 && codeUnit >= 0x0030 && codeUnit <= 0x0039 && firstCodeUnit === 0x002d)
      ) {
        result += '\\' + codeUnit.toString(16) + ' ';
        continue;
      }
      if (index === 0 && length === 1 && codeUnit === 0x002d) {
        result += '\\' + string.charAt(index);
        continue;
      }
      if (
        codeUnit >= 0x0080 || codeUnit === 0x002d || codeUnit === 0x005f ||
        (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
        (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
        (codeUnit >= 0x0061 && codeUnit <= 0x007a)
      ) {
        result += string.charAt(index);
        continue;
      }
      result += '\\' + string.charAt(index);
    }
    return result;
  }

  // Heuristic: does this class name look machine-generated (and therefore
  // useless for a human-readable, stable selector)?
  function isJunkClass(cls) {
    if (!cls) return true;
    // CSS Modules: css-1a2b3c / css-a1b2c3d4
    if (/^css-[a-z0-9]{4,}$/i.test(cls)) return true;
    // styled-components runtime classes: sc-bdVaJa, sc-1x2y3z
    if (/^sc-[a-zA-Z0-9]{5,}$/.test(cls)) return true;
    // emotion: e1abc2de3 (require a digit so real words like "editorContent" survive)
    if (/^e[a-z0-9]{8,}$/i.test(cls) && /\d/.test(cls)) return true;
    // next/jsx scoped: jsx-1234567890
    if (/^jsx-\d+$/.test(cls)) return true;
    // generic hashy token: has letters AND a long hex-ish digit run, e.g. "x1a2b3c4"
    if (/^[a-z]{1,4}[-_]?[a-f0-9]{6,}$/i.test(cls) && /\d/.test(cls)) return true;
    // pure hex / pure digits
    if (/^[a-f0-9]{6,}$/i.test(cls)) return true;
    if (/^\d+$/.test(cls)) return true;
    return false;
  }

  function classesOf(el) {
    // classList may be absent on some exotic nodes; fall back to className string.
    if (el.classList && el.classList.length) return Array.prototype.slice.call(el.classList);
    var raw = typeof el.className === 'string' ? el.className : '';
    return raw.split(/\s+/).filter(Boolean);
  }

  function meaningfulClasses(el, cap) {
    var kept = [];
    var all = classesOf(el);
    for (var i = 0; i < all.length; i++) {
      if (!isJunkClass(all[i])) kept.push(all[i]);
    }
    if (typeof cap === 'number') kept = kept.slice(0, cap);
    return kept;
  }

  function tagOf(el) {
    var tag = el.tagName || '';
    // HTML type selectors are case-insensitive, but SVG/MathML are case-sensitive
    // in an HTML document — lowercasing "linearGradient" would match nothing.
    if (el.namespaceURI && el.namespaceURI !== 'http://www.w3.org/1999/xhtml') return tag;
    return tag.toLowerCase();
  }

  function isUsableId(el) {
    var id = el.id;
    if (!id || typeof id !== 'string') return false;
    if (/\s/.test(id)) return false; // ids with whitespace can't be used raw
    if (isJunkClass(id)) return false; // reuse the hash heuristic for ids too
    return true;
  }

  function idSelector(el) {
    if (!el.id || typeof el.id !== 'string' || /\s/.test(el.id)) return null;
    return tagOf(el) + '#' + cssEscapeIdent(el.id);
  }

  // tag + meaningful classes, e.g. "button.btn.btn-primary"
  function classSegment(el, cap) {
    var seg = tagOf(el);
    var classes = meaningfulClasses(el, cap);
    for (var i = 0; i < classes.length; i++) {
      seg += '.' + cssEscapeIdent(classes[i]);
    }
    return seg;
  }

  // 1-based index of `el` among siblings with the same tag, or null if it's the
  // only one of its tag (so :nth-of-type would be redundant).
  function nthOfType(el) {
    var parent = el.parentElement;
    if (!parent) return null;
    var tag = el.tagName;
    var index = 0;
    var count = 0;
    var kids = parent.children;
    for (var i = 0; i < kids.length; i++) {
      if (kids[i].tagName === tag) {
        count++;
        if (kids[i] === el) index = count;
      }
    }
    return count > 1 ? index : null;
  }

  function matchesOnly(selector, el, doc) {
    if (!selector) return false;
    var nodes;
    try {
      nodes = doc.querySelectorAll(selector);
    } catch (e) {
      return false;
    }
    return nodes.length === 1 && nodes[0] === el;
  }

  /**
   * The short "headline" for an element: tag, a usable #id if present, then up
   * to MAX_CLASSES meaningful classes. Not guaranteed unique — it's the visual
   * identity shown to the user (e.g. "button.btn.btn-primary").
   */
  function headlineFor(el) {
    var seg = tagOf(el);
    if (isUsableId(el)) seg += '#' + cssEscapeIdent(el.id);
    var classes = meaningfulClasses(el, MAX_CLASSES);
    for (var i = 0; i < classes.length; i++) seg += '.' + cssEscapeIdent(classes[i]);
    return seg;
  }

  /**
   * A CSS selector that matches exactly `el` within `doc`. Climbs ancestors and
   * adds :nth-of-type only as needed. Returns a best-effort path if perfect
   * uniqueness can't be reached within MAX_DEPTH.
   */
  function uniqueFor(el, doc) {
    if (!el || el.nodeType !== 1) return null;
    doc = doc || el.ownerDocument;

    // Fast path: a usable, unique id resolves everything.
    var idSel = idSelector(el);
    if (idSel && matchesOnly(idSel, el, doc)) return idSel;

    var segments = [];
    var node = el;
    var depth = 0;

    while (node && node.nodeType === 1 && depth < MAX_DEPTH) {
      // If this ancestor owns a unique id, anchor on it and stop climbing.
      var nodeIdSel = idSelector(node);
      if (nodeIdSel && matchesOnly(nodeIdSel, node, doc)) {
        segments.unshift(nodeIdSel);
        var anchored = segments.join(' > ');
        if (matchesOnly(anchored, el, doc)) return anchored;
        // The id didn't pin our target (descendant ambiguity) — fall through and
        // keep the id segment; the loop below will refine deeper segments.
      } else {
        segments.unshift(classSegment(node, MAX_CLASSES));
      }

      var candidate = segments.join(' > ');
      if (matchesOnly(candidate, el, doc)) return candidate;

      // Disambiguate this freshly added segment with :nth-of-type if it helps.
      var nth = nthOfType(node);
      if (nth) {
        segments[0] = segments[0] + ':nth-of-type(' + nth + ')';
        candidate = segments.join(' > ');
        if (matchesOnly(candidate, el, doc)) return candidate;
      }

      node = node.parentElement;
      depth++;
    }

    return segments.join(' > ');
  }

  /**
   * @param {Element} el
   * @param {Document} [doc]
   * @returns {{ headline: string, unique: string, isUnique: boolean }}
   */
  function buildSelector(el, doc) {
    doc = doc || (el && el.ownerDocument);
    var unique = uniqueFor(el, doc);
    return {
      headline: headlineFor(el),
      unique: unique,
      isUnique: matchesOnly(unique, el, doc),
    };
  }

  var api = {
    buildSelector: buildSelector,
    headlineFor: headlineFor,
    uniqueFor: uniqueFor,
    isJunkClass: isJunkClass,
    meaningfulClasses: meaningfulClasses,
    nthOfType: nthOfType,
    cssEscapeIdent: cssEscapeIdent,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') {
    window.__pluck = window.__pluck || {};
    window.__pluck.selector = api;
  }
})(typeof self !== 'undefined' ? self : this);

# Pluck UI/UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine Pluck's two UI surfaces (popup + in-page overlay) to a premium, Apple-esque feel — macOS structure carrying the existing indigo identity — with zero behavioural change.

**Architecture:** Pure CSS/visual refactor. The popup is restyled in `src/popup/popup.css` (with one tiny `popup.js` tweak to make the history warning accessibly amber). The in-page overlay is restyled by editing the CSS string in `src/content/styles.js`. **No class names, DOM structure, ids, data-attributes, or logic change** — those are the tested contract (e2e asserts `.pluck-box`/`pluck-host`; `popup.js` queries fixed ids).

**Tech Stack:** Vanilla JS/CSS/HTML. No build step, no framework, no bundler, no network. `'use strict'`, `var`, ES5 functions. Tests: `node --test` (unit) + `scripts/check.js` (static gate) + Playwright (e2e, on demand).

**Testing note (TDD adaptation):** There are no per-rule unit tests for CSS. The fast gate after every change is `npm run check && npm test` — it must stay green (it runs `node --check` on every `.js`, validates the manifest/icons, and runs the selector/format/service-worker unit tests, guarding against syntax errors and broken module exports in the files we edit). The behavioural contract (overlay still builds `.pluck-box`, copies, toasts) is guarded by `npm run test:e2e`, run once at the end. Visual verification is done by loading the unpacked extension.

**Reference:** Design spec at `docs/superpowers/specs/2026-06-06-pluck-ui-refinement-design.md`. Validated mockups (if server restarted) under `.superpowers/brainstorm/*/content/merged.html`.

---

## File Structure

- **Modify** `src/popup/popup.css` — full restyle to the macOS-structured, indigo-accented token system. (Task 1)
- **Modify** `src/popup/popup.js:188-189` — wrap the "may match multiple" warning in a `<span class="h-warn">` so it can be tinted amber. (Task 2)
- **Modify** `src/content/styles.js` — refine the overlay CSS string (box/label/hint/toast); keep all class names and the `:host { all: initial }` reset and export shape. (Task 3)
- **Verify** — full `check` + `test` + `test:e2e` + manual light/dark matrix. (Task 4)

No files are created. No files are deleted.

---

## Task 1: Restyle the popup

**Files:**
- Modify (full replace): `src/popup/popup.css`

This replaces the entire stylesheet. The HTML in `popup.html` already uses sentence-case label text (`Keyboard shortcut`, `Copy format`, `Recent`) — the old uppercase look came from CSS `text-transform`, which we drop. No HTML edit is needed in this task.

- [ ] **Step 1: Replace `src/popup/popup.css` with the new stylesheet**

Write `src/popup/popup.css` with exactly this content:

```css
:root {
  --accent: #6366f1;
  --accent-press: #4f46e5;
  --accent-link: #4f46e5; /* AA-compliant link color on light bg */
  --surface: #fbfbfd;
  --fill: rgba(118, 118, 128, 0.12);
  --fill-item: rgba(118, 118, 128, 0.08);
  --fill-item-hover: rgba(118, 118, 128, 0.14);
  --text: #1d1d1f;
  --text-soft: #86868b;
  --hairline: rgba(0, 0, 0, 0.1);
  --thumb: #ffffff;
  --thumb-text: var(--accent-press); /* active-segment label */
  --chip-bg: #ffffff;
  --chip-border: rgba(0, 0, 0, 0.14);
  --chip-text: var(--accent-press);
  --warn: #b25000; /* accessible amber on light */
  --radius: 11px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --accent-link: #aab0ff; /* lightened for contrast on dark bg */
    --surface: #1c1c1e;
    --fill: rgba(120, 120, 128, 0.24);
    --fill-item: rgba(120, 120, 128, 0.16);
    --fill-item-hover: rgba(120, 120, 128, 0.26);
    --text: #f5f5f7;
    --text-soft: #8e8e93;
    --hairline: rgba(255, 255, 255, 0.1);
    --thumb: #636366;
    --thumb-text: #ffffff; /* white reads better than indigo on the gray thumb */
    --chip-bg: rgba(255, 255, 255, 0.06);
    --chip-border: rgba(255, 255, 255, 0.14);
    --chip-text: #c7caff;
    --warn: #ffb340;
  }
}

* { box-sizing: border-box; }

body {
  margin: 0;
  width: 320px;
  background: var(--surface);
  color: var(--text);
  font: 13px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Segoe UI", Roboto, sans-serif;
  padding: 18px;
  -webkit-font-smoothing: antialiased;
}

/* brand */
.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 18px;
}
.mark {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border-radius: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, var(--accent), var(--accent-press));
  box-shadow: 0 3px 9px rgba(79, 70, 229, 0.4);
}
.brand-text h1 { margin: 0; font-size: 15px; font-weight: 620; letter-spacing: -0.2px; }
.brand-text p { margin: 1px 0 0; font-size: 11.5px; color: var(--text-soft); }

/* primary action */
.start {
  width: 100%;
  border: 0;
  border-radius: var(--radius);
  padding: 12px 14px;
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(180deg, var(--accent), var(--accent-press));
  color: #fff;
  font: inherit;
  font-weight: 590;
  font-size: 13.5px;
  cursor: pointer;
  box-shadow:
    0 1px 1px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 8px 20px -10px rgba(79, 70, 229, 0.6);
  transition: filter 120ms ease, transform 80ms ease;
}
.start:hover { filter: brightness(1.05); }
.start:active { transform: translateY(1px); }
.start kbd {
  font: inherit;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 6px;
  padding: 3px 7px;
}

/* shortcut row */
.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.shortcut-label { font-size: 12.5px; color: var(--text-soft); }
.shortcut-chip {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  min-width: 64px;
  text-align: center;
  border: 0.5px solid var(--chip-border);
  background: var(--chip-bg);
  color: var(--chip-text);
  border-radius: 8px;
  padding: 5px 11px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: background 110ms ease, border-color 110ms ease, color 110ms ease;
}
.shortcut-chip:hover { border-color: var(--text-soft); }
.shortcut-chip.recording {
  border-color: var(--accent);
  color: var(--accent);
  background: transparent;
  box-shadow: none;
}

/* format segmented control */
.modes { margin-bottom: 16px; }
.modes-label,
.history-head span:first-child {
  display: block;
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: -0.1px;
  color: var(--text-soft);
  margin-bottom: 8px;
}
.seg {
  display: flex;
  gap: 2px;
  background: var(--fill);
  border-radius: 9px;
  padding: 2px;
}
.seg-btn {
  flex: 1;
  border: 0;
  border-radius: 7px;
  padding: 7px 4px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, box-shadow 120ms ease;
}
.seg-btn:hover { background: rgba(118, 118, 128, 0.1); }
.seg-btn[aria-checked="true"] {
  background: var(--thumb);
  color: var(--thumb-text);
  font-weight: 590;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.04);
}
.seg-btn[aria-checked="true"]:hover { background: var(--thumb); }
@media (prefers-color-scheme: dark) {
  .seg-btn[aria-checked="true"] { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3); }
}
.modes-hint {
  margin: 8px 2px 0;
  font-size: 11.5px;
  color: var(--text-soft);
  min-height: 16px;
}

/* recent history */
.history-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.history-list { list-style: none; margin: 0; padding: 0; }
.history-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  width: 100%;
  text-align: left;
  border: 0;
  background: var(--fill-item);
  border-radius: 8px;
  padding: 8px 11px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: background 110ms ease;
}
.history-item:hover { background: var(--fill-item-hover); }
.history-item .h-sel {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-item .h-meta {
  font-size: 10.5px;
  color: var(--text-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.history-item .h-warn { color: var(--warn); }
.empty {
  margin: 4px 2px;
  font-size: 11.5px;
  color: var(--text-soft);
}

/* footer */
.foot {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 0.5px solid var(--hairline);
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  color: var(--text-soft);
}
.link {
  border: 0;
  background: none;
  color: var(--accent-link);
  font: inherit;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
}
.link:hover { text-decoration: underline; }
.dot { color: var(--text-soft); }
.muted { color: var(--text-soft); }

/* copied confirmation pill */
.copied {
  position: fixed;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%) translateY(6px);
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 14px;
  border-radius: 999px;
  box-shadow: 0 8px 22px -8px rgba(79, 70, 229, 0.7);
  opacity: 0;
  transition: opacity 140ms ease, transform 140ms ease;
  pointer-events: none;
}
.copied.is-on { opacity: 1; transform: translateX(-50%) translateY(0); }
.copied.is-error { background: #ef4444; box-shadow: 0 8px 22px -8px rgba(239, 68, 68, 0.7); }

/* visible keyboard focus for all interactive controls */
.start:focus-visible,
.seg-btn:focus-visible,
.shortcut-chip:focus-visible,
.history-item:focus-visible,
.link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}
```

- [ ] **Step 2: Run the fast gate to verify nothing is broken**

Run: `npm run check && npm test`
Expected: PASS (CSS isn't parsed by these, but this confirms we didn't accidentally touch a `.js` file and the manifest/tests are still green). All unit tests pass.

- [ ] **Step 3: Visually verify the popup in light and dark**

Load unpacked (`chrome://extensions` → Developer mode → Load unpacked → repo root), then open the popup. Verify against the spec:
- Light mode: near-white surface, indigo gradient mark + Start button with top highlight, hairline footer rule, segmented control with a raised white thumb whose active label is indigo, mono chip with indigo text, sentence-case "Keyboard shortcut"/"Copy format"/"Recent" labels (NOT uppercase).
- Toggle OS to dark mode (or use DevTools → Rendering → emulate `prefers-color-scheme: dark`): surface becomes macOS gray `#1c1c1e`, text light, active segment is a gray thumb with white label, links are light indigo.
- Click through the three format segments, click the shortcut chip (recording state shows indigo outline), confirm focus rings appear on Tab.

Expected: matches the validated `merged.html` mockup. No layout shift when switching segments or mode hint text.

- [ ] **Step 4: Commit**

```bash
git add src/popup/popup.css
git commit -m "Restyle popup: macOS structure with indigo identity"
```

---

## Task 2: Make the history warning accessibly amber

**Files:**
- Modify: `src/popup/popup.js` (the `renderHistory` function, currently lines 188-189)

The current code inlines the warning into `meta.textContent`, so it can't be colored separately. Wrap it in a `<span class="h-warn">` (the CSS rule `.history-item .h-warn` from Task 1 already targets it).

- [ ] **Step 1: Replace the meta-building lines in `renderHistory`**

Find this block in `src/popup/popup.js` (inside the `history.forEach` callback):

```javascript
    var meta = document.createElement('span');
    meta.className = 'h-meta';
    var warn = item.isUnique === false ? '⚠ may match multiple · ' : '';
    meta.textContent = warn + hostOf(item.url) + ' · ' + timeAgo(item.ts);
```

Replace it with:

```javascript
    var meta = document.createElement('span');
    meta.className = 'h-meta';
    if (item.isUnique === false) {
      var warnSpan = document.createElement('span');
      warnSpan.className = 'h-warn';
      warnSpan.textContent = '⚠ may match multiple';
      meta.appendChild(warnSpan);
      meta.appendChild(document.createTextNode(' · '));
    }
    meta.appendChild(document.createTextNode(hostOf(item.url) + ' · ' + timeAgo(item.ts)));
```

- [ ] **Step 2: Run the fast gate**

Run: `npm run check && npm test`
Expected: PASS. `npm run check` runs `node --check src/popup/popup.js`, confirming the edit is syntactically valid ES5.

- [ ] **Step 3: Visually verify the warning tint**

Reload the unpacked extension. To populate a warning entry, inspect an element on a page that yields a non-unique selector (or temporarily inspect any element — entries with `isUnique === false` render `⚠ may match multiple`). Confirm the warning text is amber (`#b25000` light / `#ffb340` dark) and the rest of the meta line stays soft gray.

Expected: only the warning fragment is amber; host + time stay `--text-soft`.

- [ ] **Step 4: Commit**

```bash
git add src/popup/popup.js
git commit -m "Tint history 'may match multiple' warning amber for legibility"
```

---

## Task 3: Refine the in-page overlay styles

**Files:**
- Modify: `src/content/styles.js`

Edit only the `css` array contents. Keep the IIFE wrapper, the `window.__pluck.css` + `module.exports` dual export, every class name (`.pluck-layer`, `.pluck-box`, `.pluck-label`, `.pluck-tag`/`.pluck-id`/`.pluck-cls`/`.pluck-dim`, `.pluck-toast`, `.pluck-check`, `.pluck-sel`, `.pluck-hint`, `is-on`/`is-error`/`is-warn`), and the `:host { all: initial }` reset. These are consumed by `inspector.js` and asserted by the e2e suite.

- [ ] **Step 1: Replace the `css` array in `src/content/styles.js`**

Replace the array literal assigned to `var css = [ ... ].join('\n');` with this content (the lines between `var css = [` and `].join('\n');`):

```javascript
  var css = [
    ':host {',
    '  all: initial;',
    '  --pluck-accent: #6366f1;',
    '  --pluck-accent-press: #4f46e5;',
    '  --pluck-accent-soft: rgba(99, 102, 241, 0.12);',
    '  --pluck-glass: rgba(20, 20, 30, 0.92);',
    '}',
    '',
    '.pluck-layer {',
    '  position: fixed;',
    '  inset: 0;',
    '  pointer-events: none;',
    '  z-index: 2147483647;',
    '  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;',
    '}',
    '',
    '/* the highlight box drawn over the targeted element */',
    '.pluck-box {',
    '  position: fixed;',
    '  pointer-events: none;',
    '  box-sizing: border-box;',
    '  border: 2px solid var(--pluck-accent);',
    '  border-radius: 6px;',
    '  background: var(--pluck-accent-soft);',
    '  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6), 0 10px 30px rgba(49, 46, 129, 0.25);',
    '  opacity: 0;',
    '  transition: opacity 90ms ease;',
    '  will-change: top, left, width, height;',
    '}',
    '.pluck-box.is-on { opacity: 1; }',
    '',
    '/* floating label pill: tag.class#id · W×H */',
    '.pluck-label {',
    '  position: fixed;',
    '  pointer-events: none;',
    '  max-width: min(70vw, 560px);',
    '  padding: 5px 9px;',
    '  border-radius: 8px;',
    '  background: var(--pluck-glass);',
    '  color: #f4f4f5;',
    '  font-size: 12px;',
    '  line-height: 1.4;',
    '  letter-spacing: 0.1px;',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '  backdrop-filter: blur(8px) saturate(140%);',
    '  -webkit-backdrop-filter: blur(8px) saturate(140%);',
    '  box-shadow: 0 6px 22px rgba(0, 0, 0, 0.32);',
    '  opacity: 0;',
    '  transform: translateY(2px);',
    '  transition: opacity 90ms ease, transform 90ms ease;',
    '}',
    '.pluck-label.is-on { opacity: 1; transform: translateY(0); }',
    '.pluck-label .pluck-tag { color: #a5b4fc; }',
    '.pluck-label .pluck-id { color: #fcd34d; }',
    '.pluck-label .pluck-cls { color: #f4f4f5; }',
    '.pluck-label .pluck-dim { color: #9ca3af; }',
    '',
    '/* confirmation toast */',
    '.pluck-toast {',
    '  position: fixed;',
    '  left: 50%;',
    '  bottom: 28px;',
    '  transform: translateX(-50%) translateY(8px);',
    '  display: flex;',
    '  align-items: center;',
    '  gap: 9px;',
    '  max-width: min(80vw, 620px);',
    '  padding: 10px 14px;',
    '  border-radius: 12px;',
    '  background: rgba(20, 20, 30, 0.94);',
    '  color: #f4f4f5;',
    '  font-size: 13px;',
    '  line-height: 1.4;',
    '  backdrop-filter: blur(10px) saturate(140%);',
    '  -webkit-backdrop-filter: blur(10px) saturate(140%);',
    '  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.42);',
    '  opacity: 0;',
    '  transition: opacity 180ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);',
    '}',
    '.pluck-toast.is-on { opacity: 1; transform: translateX(-50%) translateY(0); }',
    '.pluck-toast .pluck-check {',
    '  flex: 0 0 auto;',
    '  width: 18px;',
    '  height: 18px;',
    '  border-radius: 50%;',
    '  background: var(--pluck-accent);',
    '  display: inline-flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '}',
    '.pluck-toast.is-error .pluck-check { background: #ef4444; }',
    '.pluck-toast.is-warn .pluck-check { background: #f59e0b; }',
    '.pluck-toast .pluck-check svg { width: 11px; height: 11px; display: block; }',
    '.pluck-toast .pluck-sel {',
    '  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;',
    '  font-size: 12px;',
    '  color: #c7d2fe;',
    '  white-space: nowrap;',
    '  overflow: hidden;',
    '  text-overflow: ellipsis;',
    '}',
    '',
    '/* dim hint chip top-center while inspecting */',
    '.pluck-hint {',
    '  position: fixed;',
    '  left: 50%;',
    '  top: 16px;',
    '  transform: translateX(-50%) translateY(-6px);',
    '  padding: 6px 12px;',
    '  border-radius: 999px;',
    '  background: rgba(79, 70, 229, 0.92);',
    '  color: #fff;',
    '  font-size: 12px;',
    '  font-weight: 500;',
    '  letter-spacing: 0.2px;',
    '  backdrop-filter: blur(8px) saturate(140%);',
    '  -webkit-backdrop-filter: blur(8px) saturate(140%);',
    '  box-shadow: 0 6px 18px rgba(49, 46, 129, 0.35);',
    '  opacity: 0;',
    '  transition: opacity 120ms ease, transform 120ms ease;',
    '}',
    '.pluck-hint.is-on { opacity: 1; transform: translateX(-50%) translateY(0); }',
    '.pluck-hint kbd {',
    '  font-family: inherit;',
    '  background: rgba(255, 255, 255, 0.22);',
    '  border-radius: 4px;',
    '  padding: 1px 5px;',
    '  margin: 0 1px;',
    '}',
    '',
    '@media (prefers-reduced-motion: reduce) {',
    '  .pluck-box, .pluck-label, .pluck-toast, .pluck-hint { transition: none; }',
    '}',
  ].join('\n');
```

(Changes vs. current: box radius 3px→6px and a softer shadow; label radius 7px→8px via a shared `--pluck-glass` token; toast radius 11px→12px with a deeper shadow and a gentle spring entrance easing; hint gets `backdrop-filter` blur, a slightly de-saturated translucent indigo, and a softer shadow. All class names, the reduced-motion block, and the export are unchanged.)

- [ ] **Step 2: Run the fast gate**

Run: `npm run check && npm test`
Expected: PASS. `npm run check` runs `node --check src/content/styles.js`, confirming the array edit is valid JS and the module still loads (the service-worker/unit tests `require` sibling modules).

- [ ] **Step 3: Visually verify the overlay on a real page**

Reload the unpacked extension, open any content-rich page (e.g. a news site), trigger inspect mode with the shortcut. Verify:
- Highlight box: indigo border, soft translucent indigo fill, 6px rounded corners, gentle white ring + soft shadow.
- Label pill: dark glass with blur, indigo tag, amber id, gray dimensions.
- Hint chip top-center: translucent indigo with blur, readable `kbd` keys.
- Click an element → toast slides up bottom-center with a slight spring, indigo check badge, mono selector text. Confirm a non-unique element shows the amber (`is-warn`) badge and a copy failure (rare) shows red.
- Enable DevTools → Rendering → emulate `prefers-reduced-motion: reduce` and confirm the box/label/toast/hint appear without transitions.

Expected: matches the overlay preview in the `merged.html` mockup.

- [ ] **Step 4: Commit**

```bash
git add src/content/styles.js
git commit -m "Refine in-page overlay: softer depth, glass tokens, spring toast"
```

---

## Task 4: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full static + unit gate**

Run: `npm run check && npm test`
Expected: PASS — manifest valid, icon PNG signatures valid, `node --check` clean on every `.js`, all unit tests green.

- [ ] **Step 2: Run the e2e contract gate**

Run, in two steps (the suite needs a static server):
```bash
python3 -m http.server 8753 &
npm run test:e2e
```
Expected: PASS — the unpacked extension loads, inspect mode builds the overlay (`pluck-host` + `.pluck-box` assertions hold), selection copies a selector, and history is recorded. Kill the server afterward (`kill %1` or by PID).

- [ ] **Step 3: Manual cross-mode matrix**

Load unpacked and confirm, in BOTH `prefers-color-scheme: light` and `dark`:
- Popup: brand, Start button, shortcut chip + recording state, all three format segments (active thumb + indigo/white label), mode hint with no layout shift, a recent item + its hover + amber warning, footer hairline + indigo links, focus rings on Tab, the "Copied" pill on re-copy.
- Overlay on a live page: box, label, hint, toast (ok/warn/error states as reachable), ↑/↓ refine still re-paints, Esc cancels.
- Reduced motion: transitions suppressed in both surfaces.

Expected: everything matches the approved direction; no behavioural regression.

- [ ] **Step 4: Finalize**

If any visual tweak was needed during Steps 1-3, it should already be committed in the relevant task. No code change expected here. Optionally bump `manifest.json` `version` if shipping (not required by this plan).

The branch is ready for review / merge (see superpowers:finishing-a-development-branch).

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Design tokens (light/dark table) → Task 1 `:root` + dark `@media`. ✓
- Popup section-by-section (brand, start, shortcut, segmented control, hint, recent, footer, copied) → Task 1. ✓
- Sentence-case labels → Task 1 (drop `text-transform`; HTML already sentence-case). ✓
- Accessible amber warning → Task 2 (`.h-warn` span + token). ✓
- Overlay (box, label, hint, toast) → Task 3. ✓
- Preserve class names / DOM / exports / `:host` reset / reduced-motion / focus / aria → enforced in Tasks 1 & 3 constraints; guarded by Task 4 e2e + check. ✓
- Out-of-scope items (no icon redesign, no logic, no deps, no new perms) → respected; no task touches them. ✓
- Testing/verification (check, test, e2e, manual matrix) → Task 4. ✓

**Placeholder scan:** No TBD/TODO/"handle appropriately". Every code step shows complete content. ✓

**Type/name consistency:** Token names (`--accent`, `--accent-press`, `--surface`, `--fill`, `--fill-item`, `--fill-item-hover`, `--text`, `--text-soft`, `--hairline`, `--thumb`, `--thumb-text`, `--chip-bg`, `--chip-border`, `--chip-text`, `--warn`, `--radius`) are defined in `:root` and only referenced after definition. `.h-warn` CSS rule (Task 1) matches the `h-warn` class created in `popup.js` (Task 2). Overlay class names unchanged from current `inspector.js` consumers. ✓

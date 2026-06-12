# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Pluck is a Manifest V3 Chromium extension: press a hotkey, click any element, and a Claude-Code-ready CSS selector lands on the clipboard. **Vanilla JS/CSS/HTML — no build step, no framework, no bundler.** Load it unpacked from the repo root (`chrome://extensions` → Developer mode → Load unpacked).

## Commands

```bash
npm run check          # static gate: validates manifest, icon PNG signatures, node --check on every .js
npm test               # unit tests (node:test + jsdom): selector engine, formatter, service worker
node --test test/selector.test.js   # run a single unit test file
npm run icons          # regenerate icons/*.png from scripts/make-icons.js

# integration (real Chromium via Playwright) — needs a static server first:
python3 -m http.server 8753 &
npm run test:e2e       # loads unpacked extension, drives content scripts on test/fixture.html
```

Run `npm run check && npm test` before considering any change done. The e2e suite is run on demand.

## Architecture

Content scripts are **declared in the manifest** (injected on every page via `content_scripts` with `host_permissions: <all_urls>`), not injected on demand. This is the central design decision: the inspector and its shortcut listener are always already present, so the keyboard shortcut fires on the *first* press on any site — no service-worker wake, no `activeTab` timing race, works even in Arc where `chrome.commands` is unreliable. `scripting` permission is only a fallback to inject into tabs that were open before the extension loaded.

Load order matters and is fixed in `manifest.json`: `styles.js` → `selector.js` → `format.js` → `inspector.js` → `shortcut.js`. Earlier files publish their API before later files consume it.

### Module pattern (important)

Every content-script file is an IIFE with **dual export**: `module.exports` for node (so it's unit-testable without a browser) *and* `window.__pluck.<name>` for the page. `selector.js` and `format.js` are **pure and DOM-light** by design — the unit tests `require()` them directly and run against jsdom. Preserve this: keep selector/format logic free of live-DOM and chrome-API dependencies so it stays node-requirable.

### The pieces

| File | Role |
|---|---|
| `src/content/shortcut.js` | In-page `keydown` listener; detects the configured combo and toggles inspect mode directly. |
| `src/content/inspector.js` | Inspect-mode controller: Shadow-DOM overlay, **capture-phase** event handling (page never sees the selection click), clipboard write, toast, ↑/↓ parent/child navigation. |
| `src/content/selector.js` | Pure selector engine — see below. |
| `src/content/format.js` | Pure formatter: facts object + mode (`selector`/`context`/`full`) → clipboard string. |
| `src/content/styles.js` | Overlay CSS, adopted into the shadow root. |
| `src/background/service-worker.js` | Handles toolbar "Start inspecting" (messages content script, injects as fallback) and stores capture history. |
| `src/popup/*` | Format toggle, shortcut recorder, last-10 copy history. |

### Selector engine (`selector.js`)

The non-trivial core. `buildSelector(el, doc)` returns `{ headline, unique, isUnique }`:
- **Verified uniqueness**: every candidate is checked with `querySelectorAll(...).length === 1`. Climbs ancestors (up to `MAX_DEPTH = 8`), adding `:nth-of-type` only when it actually disambiguates. Anchors on a usable, unique `#id` when one exists and stops climbing.
- **Junk-class filtering** (`isJunkClass`): drops machine-generated classes (`css-1a2b3c`, `sc-…`, emotion, `jsx-…`, hashy/hex/numeric tokens) so selectors stay human-readable and stable. When editing these heuristics, the bar is *don't eat real words* (e.g. `editorContent` must survive) — the existing regexes require a digit for exactly this reason.
- **SVG/MathML tag case is preserved** (`tagOf`): lowercasing `linearGradient` would match nothing in an HTML document. HTML tags are lowercased.
- Identifiers are escaped via `CSS.escape` with a spec-accurate polyfill fallback.

## Conventions

- `'use strict'`, `var`, and ES5-style function syntax throughout — match it; this is deliberately dependency-free vanilla JS, not a transpiled codebase.
- Permissions are intentionally minimal (`scripting`, `storage`, `host_permissions: <all_urls>`). `scripts/check.js` *rejects* any unexpected permission and fails if `shortcut.js` or `<all_urls>` is missing. Don't add a permission without updating that gate and the rationale in the README.
- No network. Nothing leaves the machine — Pluck only reads the DOM on invocation. Keep it that way.
- `manifest.json` and `package.json` carry independent `version` fields (currently out of sync); manifest is the one that ships.

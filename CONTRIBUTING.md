# Contributing to Pluck

Thanks for wanting to make Pluck better. It's a small, deliberately dependency-free codebase — most fixes are an evening of work, and the test suite tells you quickly whether you broke something.

## Ground rules

- **Vanilla JS/CSS/HTML, no build step.** `'use strict'`, `var`, ES5-style functions. The repo loads unpacked as-is; keep it that way. No frameworks, no bundlers, no transpilers.
- **No network.** Pluck never talks to a server. PRs that add network calls, analytics, or telemetry will be declined.
- **Minimal permissions.** `scripting`, `storage`, and `host_permissions: <all_urls>` — nothing else. `scripts/check.js` rejects unexpected permissions by design. If a feature truly needs a new permission, open an issue first; it needs a rationale in the README and an update to the gate.
- **Keep `selector.js` and `format.js` pure.** They are `require()`d directly by the unit tests and must stay free of live-DOM and chrome-API dependencies.

## Dev setup

```bash
git clone https://github.com/william-laverty/pluck.git
cd pluck
npm install        # dev deps only: jsdom (unit tests), playwright (e2e)
```

Load it in a browser: `chrome://extensions` → Developer mode → **Load unpacked** → select the repo root.

## Before you open a PR

```bash
npm run check && npm test     # the fast gate — must be green
```

For changes that touch the overlay, selection, or clipboard behavior, also run the real-browser suite:

```bash
python3 -m http.server 8753 &
npm run test:e2e
kill %1
```

If you changed visual styling, load the extension unpacked and verify in **both** light and dark mode (`prefers-color-scheme`), plus reduced motion if you touched transitions.

## What makes a good PR

- One concern per PR, with a description of *why*, not just what.
- New behavior comes with a test. The selector engine especially — every heuristic in `isJunkClass` exists because of a real-world page, and every one is pinned by a test.
- When editing junk-class heuristics, the bar is **don't eat real words**: `editorContent` must survive, `css-1a2b3c` must not. Add both kinds of cases to `test/selector.test.js`.
- Match the existing style. The codebase reads consistently end-to-end; keep it boring.

## Reporting bugs

Use the bug report template. The single most useful thing you can include is a **URL + element** where Pluck produced a wrong, non-unique, or ugly selector — selector-engine bugs are usually one weird page away from reproducible.

## Architecture orientation

Read `CLAUDE.md` for the full map. The 30-second version: content scripts are *declared* in the manifest (always present, which is why the hotkey fires on first press), `selector.js`/`format.js` are pure logic, `inspector.js` owns the Shadow-DOM overlay and capture-phase events, and the service worker only handles the toolbar button and history storage.

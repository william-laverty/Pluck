# Pluck UI/UX Refinement — Design

**Date:** 2026-06-06
**Status:** Approved direction, pending spec review
**Scope:** Visual + interaction polish of both UI surfaces (popup + in-page overlay). No behavioural/functional changes.

## Goal

Make Pluck feel premium and production-ready: clean, modern, smooth, Apple-esque, minimal without overcomplication. The functionality is done and well-tested; this is purely the look, feel, motion, and visual hierarchy.

## Chosen direction

**"A's palette on B's design"** — validated against three rendered directions in the visual companion.

- **Structure & restraint = macOS native.** SF system type, sentence-case section labels (not uppercase tracking), hairline (`0.5px`) separators, iOS-style segmented control, system-gray fills, generous whitespace, subtle layered depth instead of heavy shadows.
- **Identity = the existing indigo** (`#6366f1` → `#4f46e5`), not system blue. Indigo appears only where it earns attention: the brand mark, the primary "Start inspecting" button, links, the active-segment label, and focus rings. Everything else stays quiet/neutral.
- **Dark mode = macOS-gray** (`#1c1c1e` surface) rather than the current cooler near-black — warmer, more "native panel."
- **Active segment = neutral.** The selected format segment is a plain white/gray raised pill (true macOS); indigo only tints its *label text*. No full indigo fill.

## Hard constraints (must preserve — these are load-bearing)

- **Vanilla JS/CSS/HTML. No build step, no framework, no bundler, no network.** (CLAUDE.md)
- **`'use strict'`, `var`, ES5-style functions** throughout — match existing style.
- **Dual-export IIFE module pattern** in content scripts (`module.exports` + `window.__pluck.*`). `selector.js`/`format.js` stay pure & node-requirable. This work touches `styles.js` (CSS string) but must keep its export shape intact.
- **Overlay CSS lives as a JS string in `styles.js`**, adopted into the Shadow DOM. `:host { all: initial }` reset stays.
- **Overlay host keeps its `!important` z-index/visibility armor** (`buildOverlay` in `inspector.js`) — hostile-page-CSS defense. Do not weaken it.
- **`@media (prefers-reduced-motion: reduce)`** must continue to neutralize transitions in both surfaces.
- **Accessible focus** (`:focus-visible` rings), `role`/`aria` on segmented control, `aria-live` on toast/copied status — all preserved or improved, never regressed.
- **`npm run check && npm test` must stay green.** Existing unit/e2e tests assert on class names and DOM structure the overlay produces (e.g. `.pluck-box`, `.pluck-toast`, `.pluck-sel`, `is-on`). **Class names and DOM structure are part of the contract — keep them.** This is a CSS/visual refactor, not a markup rewrite.

## Design system (shared language)

A small, explicit token set, defined per-surface (popup uses CSS `:root`; overlay uses `:host` custom properties — they cannot share a stylesheet).

| Token | Light | Dark |
|---|---|---|
| accent | `#6366f1` | `#6366f1` |
| accent-press | `#4f46e5` | `#4f46e5` |
| accent-on-dark (links) | `#4f46e5` | `#aab0ff` |
| surface | `#fbfbfd` | `#1c1c1e` |
| fill (subtle) | `rgba(118,118,128,.12)` | `rgba(120,120,128,.24)` |
| fill-item | `rgba(118,118,128,.08)` | `rgba(120,120,128,.16)` |
| text | `#1d1d1f` | `#f5f5f7` |
| text-soft | `#86868b` | `#8e8e93` |
| hairline | `rgba(0,0,0,.1)` (0.5px) | `rgba(255,255,255,.1)` (0.5px) |

- **Type:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, …`. Monospace (`ui-monospace, SFMono-Regular, Menlo`) only for selectors/shortcuts/code. Tighter optical sizing (~13px base, sentence-case labels at 12.5px/weight-500, headline weight ~620 with `-0.2px` tracking).
- **Radii:** mark 9px, buttons 11px, chips/items 8px, segmented track 9px / thumb 7px.
- **Depth:** primary button gets layered shadow + `inset 0 1px 0 rgba(255,255,255,.28)` top highlight; cards/chips use hairline border + at most a 1px ambient shadow. No heavy drop shadows.
- **Motion:** 120–180ms, `cubic-bezier(.4,0,.2,1)` (standard) for most, spring-ish ease only on the toast entrance. Press states use a 1px translate + brightness. All gated behind reduced-motion.

## Surface 1 — Popup (`src/popup/popup.css`, minor `popup.html`/`popup.js`)

Rework `popup.css` to the macOS-structured, indigo-accented system above. Section by section:

- **Brand header:** indigo gradient mark (unchanged glyph), title weight 620, soft subtitle.
- **Start button:** indigo vertical gradient (`180deg`), inset top highlight, layered indigo-tinted shadow; `kbd` pill at `rgba(255,255,255,.24)`. Press = `translateY(1px)` + slight brightness.
- **Shortcut row:** sentence-case label; chip becomes a white/hairline mono pill with indigo text (light) / translucent fill (dark). Recording state keeps indigo border treatment.
- **Format segmented control:** iOS track (`fill`), thumb = raised white/gray pill with hairline + soft shadow, active label tinted indigo. Hover lifts inactive label to full text color. Roving tabindex + `aria-checked` unchanged.
- **Mode hint:** soft text, reserved min-height (no layout shift on change) — keep current behavior.
- **Recent list:** sentence-case "Recent"; items become subtle `fill-item` cards with hairline-free flat fill, mono selector line + soft meta line; hover = slightly stronger fill. Warning (`⚠ may match multiple`) retains an accessible amber treatment.
- **Footer:** hairline top border, soft text, indigo links.
- **"Copied" toast (popup):** pill, indigo bg, refined entrance.
- Possible tiny HTML/JS touches: none required structurally; only if a label needs a wrapping element for alignment. Prefer CSS-only. **No id/data-attribute renames** (popup.js queries them).

## Surface 2 — In-page overlay (`src/content/styles.js`)

Refine the CSS string only; keep every class name and the layer DOM in `inspector.js` intact.

- **Highlight box (`.pluck-box`):** indigo 2px border, `rgba(99,102,241,.12)` fill, white 1px outer ring + softer indigo-tinted ambient shadow, 6px radius. Keep `opacity` transition + `will-change`.
- **Element label (`.pluck-label`):** dark translucent pill with `backdrop-filter` blur (already present) — refine padding/radius (8px) and the syntax colors (`.pluck-tag` indigo-200, `.pluck-cls` near-white, `.pluck-id` amber, `.pluck-dim` gray). Keep measurement-based positioning in `inspector.js`.
- **Hint chip (`.pluck-hint`):** quieter — indigo but slightly less saturated, refined `kbd` styling, same top-center placement.
- **Toast (`.pluck-toast`):** refined radius (12px), blur, layered shadow; indigo check badge; `is-warn` amber, `is-error` red preserved. Smooth entrance (translateY + opacity). Keeps `.pluck-sel` mono text.
- Reduced-motion block continues to cover all four.

## Out of scope (YAGNI)

- No new features, modes, settings, or copy formats.
- No icon redesign (`icons/*.png`, brand glyph) — the existing mark works in the new system.
- No changes to selector/format/shortcut/service-worker logic.
- No new permissions, no network, no dependencies.
- `manifest.json` version bump is optional and not part of this design.

## Testing / verification

- `npm run check` (manifest, icon signatures, `node --check`) — must pass.
- `npm test` (selector/format/service-worker unit tests) — must pass unchanged; this work doesn't touch their logic, but the overlay class-name contract protects e2e.
- `npm run test:e2e` (Playwright, on demand) — overlay still highlights, labels, copies, toasts. Run once at the end since CSS class names/structure are preserved.
- Manual: load unpacked, check popup in light + dark (`prefers-color-scheme`), exercise segmented control / shortcut recorder / history, then inspect a real page for box/label/hint/toast and reduced-motion behavior.

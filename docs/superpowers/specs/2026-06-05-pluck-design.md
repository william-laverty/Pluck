# Pluck — Design Spec

**Date:** 2026-06-05
**Status:** Approved (design), building v1

## Problem

When designing web pages with the help of an AI coding agent (Claude Code), you constantly need to tell the agent *which* element you mean. Today that means opening Chrome DevTools, using "Inspect element" (⌘⇧C), reading the element's class/selector, and manually copying it into the chat. It's a multi-step, friction-heavy loop repeated dozens of times a session.

## Solution

**Pluck** — a Chromium browser extension. Press a hotkey, click any element on the page, and a clean, Claude-Code-ready description of that element is copied to your clipboard. One gesture instead of five.

## Goals

- Sub-second, low-friction capture of an element's identity.
- Output that lets an AI agent *unambiguously* locate the element in source.
- Clean, modern, quiet aesthetic. Simple to use; nothing to configure to get started.
- Zero network, minimal permissions, nothing leaves the machine.
- Works in Chrome, Edge, Brave, Arc (any Chromium ≥ MV3).

## Non-Goals (v1)

- Firefox / Safari support.
- A standalone macOS app or global (cross-app) system hotkey.
- Editing the page or persisting changes.
- Cloud sync of history.

## User Flow

1. **Activate.** `⌘⇧E` (configurable via `chrome://extensions/shortcuts`) or click the toolbar icon. The active tab enters *inspect mode*.
2. **Aim.** Moving the mouse highlights the element under the cursor: a crisp accent outline plus a floating monospace pill showing `tag.class#id · W×H`.
3. **Refine (optional).** `↑` selects the parent element, `↓` selects the first element child — lets you grab the right container vs. the leaf without precise mousing.
4. **Capture.** Click (or `Enter`) on the highlighted element → Pluck computes the output, writes it to the clipboard, shows a frosted confirmation toast with a checkmark, and exits inspect mode.
5. **Cancel.** `Esc` (or clicking the toolbar icon again) exits inspect mode without copying.

## What Gets Copied

Three modes, selectable in the popup; default is **Selector + context**.

**Selector only**
```
main > section.hero > div.cta > button.btn.btn-primary
```

**Selector + context** (default)
```
button.btn.btn-primary  ·  "Get started"
selector: main > section.hero > div.cta > button.btn.btn-primary
<button class="btn btn-primary" type="button">Get started…</button>
```

**Full** (adds key computed styles for "make this match" prompts)
```
button.btn.btn-primary  ·  "Get started"
selector: main > section.hero > div.cta > button.btn.btn-primary
<button class="btn btn-primary" type="button">Get started…</button>
styles: color:#fff; background:#4f46e5; font:600 14px/1.5 Inter; padding:10px 20px; border-radius:8px
```

### Selector engine

Produces a **verified-unique** CSS selector — uniqueness confirmed against `document.querySelectorAll` (must match exactly one node).

Priority:
1. If the element has a stable, unique `id` → `tag#id` (a single global query).
2. Otherwise build from `tag` + meaningful class names; if that already matches exactly one node in the document, use it.
3. Otherwise prepend ancestor segments (each ancestor reduced to its own best short selector) until the compound selector is unique, capped at a sane depth.
4. As a last resort at any segment, disambiguate siblings with `:nth-of-type(n)`.

**Junk-class filtering.** Classes that look machine-generated are dropped from the *display/short* form (but uniqueness is always re-verified, so correctness is never sacrificed):
- CSS-Modules / styled-components hashes: `css-1a2b3c`, `sc-bdVaJa`, `jsx-1234567890`.
- Long base-confusing hashes: tokens matching `^[a-z]+-?[a-f0-9]{5,}$` or containing 4+ digits with no semantic stem.
- State/utility noise is *kept* (it's often semantic), but a hard cap of N classes per segment keeps output readable.

**Text context.** `innerText` of the element, trimmed and truncated to ~60 chars, included when present — gives the agent a string to grep for.

## Architecture

Manifest V3, **no build step** — vanilla JS/CSS/HTML, loadable unpacked immediately.

```
pluck/
  manifest.json
  src/
    background/service-worker.js   # command + action click → inject content script
    content/selector.js            # pure selector engine (also node-testable)
    content/format.js              # pure: element facts → clipboard string (per mode)
    content/inspector.js           # overlay, hover/keyboard/click handling, clipboard, toast
    content/inspector.css          # overlay + toast styles (injected as a <style>/adoptedStyleSheets)
  popup/
    popup.html / popup.css / popup.js   # mode toggles, hotkey hint, copy history
  icons/  (16/32/48/128 png)
```

### Components & responsibilities

- **service-worker.js** — Listens for the `commands` hotkey and `action.onClicked`. On trigger, injects `selector.js`, `format.js`, `inspector.js`, and the CSS into the active tab via `chrome.scripting`. Sends a "toggle" message so a second activation cancels. Relays captured results into history (`chrome.storage.local`). No persistent state beyond storage.
- **selector.js** — `buildSelector(el, doc)` → `{ short, unique }`. Pure, deterministic, dependency-free. Unit-tested in node against a minimal DOM stub.
- **format.js** — `formatElement(facts, mode)` → string. Pure. `facts` is a plain object (tag, id, classes, text, openingTag, styles, selector) so it's testable without a DOM.
- **inspector.js** — Owns inspect-mode lifecycle: a full-viewport capture-phase overlay that highlights `document.elementFromPoint`, handles `mousemove`/`keydown`/`click` on the capture phase so the page never sees them, computes facts, calls `format`, writes clipboard (`navigator.clipboard.writeText`, falling back to `execCommand` if blocked), shows the toast, then tears everything down. Uses a Shadow DOM host so page CSS can't bleed into the overlay and vice-versa.
- **popup** — Reads/writes `mode` and reads `history` from `chrome.storage.local`. Clicking a history row re-copies it. Light/dark via `prefers-color-scheme`.

### Permissions

`activeTab`, `scripting`, `commands`, `storage`. No host permissions, no network. `activeTab` is granted by the user gesture (hotkey/icon click), scoping injection to the current tab only.

### Event isolation (correctness-critical)

- Overlay host is `position:fixed; inset:0; z-index:2147483647; pointer-events:none` so it never eats the click; element detection uses `elementFromPoint` on `mousemove`.
- A separate transparent capture layer with `pointer-events:auto` intercepts the selection `click` (capture phase, `preventDefault`+`stopPropagation`) so the page's own handlers don't fire when you pluck.
- All listeners are attached in the capture phase and removed on teardown. `Esc`/`scroll`/`resize` handled. Re-entrancy guarded by a single global flag on `window`.

## Aesthetic

- One accent: indigo `#6366f1`.
- Overlay: 2px accent outline, faint accent fill, rounded; floating label is a frosted dark pill, monospace, with tag in accent and dims/`W×H` muted.
- Toast: bottom-center frosted pill, checkmark + the short selector, slide-up + fade. Auto-dismiss ~1.6s.
- Motion respects `prefers-reduced-motion`.
- Popup: system font, generous spacing, light/dark aware, no chrome-clutter.

## Error Handling

- Clipboard blocked → `execCommand('copy')` fallback; if that also fails, toast shows an error state with the text selectable.
- Restricted pages (`chrome://`, Web Store, PDF viewer) can't be injected → service worker catches the inject error and badges the icon briefly (no crash).
- No element under cursor / detached node → no-op, stay in inspect mode.

## Testing & Verification

- `node --check` on every JS file; `manifest.json` parsed/validated.
- Node unit tests for `selector.js` (uniqueness, id/class/nth fallbacks, junk filtering) and `format.js` (all three modes) using a tiny DOM stub.
- Playwright integration smoke: load a fixture page, inject the content scripts, simulate hover → keyboard refine → click, assert the produced clipboard string.
- Adversarial multi-dimension code review (MV3 compliance, event isolation, selector edge cases, clipboard, a11y, aesthetics) with verification before fixes.

## Future (not v1)

- Companion menu-bar app for a true global hotkey + richer history.
- Custom format templates.
- "Copy as screenshot + selector" for visual prompts.
- Multi-select (pluck several elements into one block).

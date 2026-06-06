# Pluck

**Hit a hotkey, click any element, and a Claude-Code-ready description of it lands on your clipboard.**

Pluck is a tiny Chromium extension for the AI-assisted design loop. Instead of opening DevTools → Inspect → reading the class → copying it into your agent, you press one shortcut, click the element, and paste. The clipboard gets a verified-unique CSS selector plus just enough context for Claude Code to pinpoint the element in source.

![Pluck overlay](docs/overlay.png)

## Install (load unpacked)

1. Open `chrome://extensions` (works in Chrome, Edge, Brave, Arc).
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked** and select this folder (the one containing `manifest.json`).
4. (Optional) Pin Pluck to the toolbar.

The default shortcut is **⌘⇧E** (macOS) / **Ctrl+Shift+E** (Windows/Linux). **Change it in Pluck's popup** (click the toolbar icon → the shortcut chip → press your keys). Pluck handles the shortcut in-page rather than through `chrome://extensions/shortcuts`, so it fires on the first press on any site — including browsers like **Arc** where extension command shortcuts are unreliable.

> After installing or reloading the extension, **already-open tabs need a refresh** to pick up the in-page shortcut (newly opened tabs work immediately). The toolbar **Start inspecting** button works on open tabs without a refresh.

## Use

1. On any page, press **⌘⇧E** (or click the toolbar icon → **Start inspecting**).
2. Move the mouse — the element under the cursor is highlighted with its `tag.class#id · W×H`.
3. Refine if needed: **↑** selects the parent, **↓** the first child.
4. **Click** (or **Enter**) to copy. A toast confirms. **Esc** cancels.
5. Paste into Claude Code.

### What gets copied

Pick a format in the popup (default is **+ Context**):

**Selector only**
```
main > section.hero > div.cta > button.btn.btn-primary
```

**+ Context** (recommended)
```
button.btn.btn-primary  ·  "Get started"
selector: main > section.hero > div.cta > button.btn.btn-primary
<button class="btn btn-primary" type="button">Get started</button>
```

**Full** — adds key computed styles (`color`, `background`, `font`, `padding`, `border-radius`) for "make this match" prompts.

The popup also keeps your **last 10 plucks** — click any to copy it again.

## How it works

Pluck's content scripts are **declared** (injected on every page via `content_scripts`), so the inspector and its shortcut listener are always present — no on-demand injection, no service-worker wake, no `activeTab` timing. That's what makes the shortcut reliable.

| Piece | Role |
|---|---|
| `src/content/shortcut.js` | In-page `keydown` listener. Detects the configured combo and toggles inspect mode directly — the reason the shortcut works on the first press, even where `chrome.commands` doesn't. |
| `src/content/inspector.js` | The inspect-mode controller: a Shadow-DOM overlay, capture-phase event handling (so the page never reacts to the selection click), clipboard write, toast. |
| `src/content/selector.js` | Pure selector engine. Builds a `querySelectorAll`-verified unique selector; climbs ancestors and adds `:nth-of-type` only as needed; drops machine-generated junk classes (`css-1a2b3c`, `sc-…`, `jsx-…`); keeps SVG tag case. |
| `src/content/format.js` | Pure formatter: element facts → clipboard string, per mode. |
| `src/content/styles.js` | Overlay styles (adopted into the shadow root). |
| `src/background/service-worker.js` | Handles the toolbar **Start inspecting** request (messages the content script, or injects as a fallback on tabs opened before install) and stores capture history. |
| `src/popup/*` | Format toggle, shortcut recorder, copy history. |

**Permissions:** `scripting`, `storage`, and `host_permissions: <all_urls>`. The broad host access is what lets the declared content script (and its shortcut listener) run on every site so the shortcut fires on the first press — `scripting` is only used as a fallback to inject into tabs that were open before the extension loaded. No network is used; nothing leaves your machine — Pluck only reads the DOM when you invoke it.

## Develop

```bash
npm install            # dev deps: jsdom (unit), playwright (integration)
npm run icons          # regenerate PNG icons from scripts/make-icons.js
npm run check          # manifest + icon + JS syntax validation
npm test               # unit tests: selector engine, formatter, service worker

# real-browser integration (needs a static server):
python3 -m http.server 8753 &
npm run test:e2e       # overlay, selection, nth-of-type, SVG, clipboard, click-suppression
```

No build step — it's vanilla JS/CSS/HTML, loadable unpacked as-is.

## Roadmap

- Companion menu-bar app for a true global (cross-app) hotkey.
- Custom format templates.
- "Copy as screenshot + selector" for visual prompts.
- Multi-select (pluck several elements into one block).

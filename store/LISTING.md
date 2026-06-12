# Chrome Web Store — submission runbook

Everything needed to publish Pluck, field by field. Build the upload with `npm run package` → `dist/pluck-v1.2.0.zip`, then fill the dashboard at <https://chrome.google.com/webstore/devconsole> as below.

---

## Store listing

| Field | Value |
|---|---|
| **Title** | `Pluck — copy any element for your AI agent` *(from the manifest — automatic)* |
| **Summary** | `Hit a hotkey, click any element, and an agent-ready CSS selector lands on your clipboard. Built for the AI-assisted dev loop.` *(from the manifest — automatic)* |
| **Category** | Developer Tools |
| **Language** | English |
| **Homepage URL** | https://getpluck.vercel.app |
| **Support URL** | https://github.com/william-laverty/pluck/issues |

### Detailed description (paste verbatim)

```
Pluck removes the slowest step of AI-assisted web development: telling your coding agent WHICH element you mean.

Instead of opening DevTools, inspecting, reading the class soup and copying it into chat, you press one shortcut, click the element, and paste. Pluck puts a verified-unique CSS selector — plus just enough context for your agent to pinpoint the element in your source — straight on your clipboard. Works with whatever you pair with: Claude Code, Cursor, Copilot, Codex, Windsurf, or a plain chat window.

HOW IT WORKS

1. Press ⌘⇧E (Mac) / Ctrl+Shift+E — or click the toolbar button.
2. Move your mouse: the element under the cursor is highlighted, with a live tag.class#id · W×H label.
3. Need the container instead of the leaf? Press ↑ for the parent, ↓ for the first child.
4. Click (or press Enter). Done — it's on your clipboard. Esc cancels.

WHAT GETS COPIED

Three formats, switchable in the popup:

• Selector — just the unique CSS selector.
• + Context (default) — selector plus the element's text and opening tag, so your agent can grep for it.
• Full — adds key computed styles (color, background, font, padding, radius) for "make this match" prompts.

Paste any of them into your coding agent and it knows exactly what you're pointing at.

A SELECTOR ENGINE THAT EARNS THE PASTE

• Verified uniqueness: every selector is checked against the live DOM (querySelectorAll must match exactly one node) before it's offered.
• Human-readable: machine-generated classes (css-1a2b3c, sc-…, jsx-…, hashy tokens) are filtered out; real class names survive.
• Minimal: ancestors and :nth-of-type() are added only when actually needed to disambiguate.
• Correct in the weird cases: SVG tag casing (linearGradient) is preserved, identifiers are CSS-escaped.

BUILT FOR RELIABILITY

The keyboard shortcut is handled by a listener that's already on the page — no service-worker wake-up, no timing races. It fires on the FIRST press, on any site, in Chrome, Edge, Brave and Arc. The selection click never reaches the page (capture-phase handling), so you can pluck buttons and links without triggering them.

PRIVATE BY ARCHITECTURE

No network. No analytics. No accounts. Pluck only reads the DOM at the moment you invoke it, and stores your format preference, custom shortcut and last 10 captures locally in your browser. Nothing ever leaves your machine. Open source: https://github.com/william-laverty/pluck

The popup also keeps your last 10 plucks — click any to copy it again — and lets you record any keyboard shortcut you like.
```

### Graphic assets (all in `store/assets/`)

| Asset | File | Size |
|---|---|---|
| Icon | `icons/icon128.png` (from the package) | 128×128 |
| Screenshot 1 | `screenshot-1-inspect.png` | 1280×800 |
| Screenshot 2 | `screenshot-2-copied.png` | 1280×800 |
| Screenshot 3 | `screenshot-3-popup.png` | 1280×800 |
| Screenshot 4 | `screenshot-4-formats.png` | 1280×800 |
| Small promo tile | `promo-small-440x280.png` | 440×280 |
| Marquee promo tile | `promo-marquee-1400x560.png` | 1400×560 |

Regenerate any time with `python3 -m http.server 8753 &` then `node scripts/store-assets.js` — they're real captures of the extension running, not mockups.

---

## Privacy tab

**Single purpose description (paste verbatim):**

```
Pluck does one thing: when the user presses the keyboard shortcut or toolbar button and clicks an element on the page, it copies a CSS selector (optionally with a short text/HTML/style context) for that element to the clipboard, for pasting into an AI coding assistant.
```

**Permission justifications (paste verbatim):**

- `host_permissions: <all_urls>`:
  ```
  The content script containing the keyboard-shortcut listener and element picker must already be present on whatever page the user invokes it on — that is what makes the shortcut fire reliably on the first press on any site. The script is inert until the user explicitly activates inspect mode; it never reads or transmits page content on its own.
  ```
- `scripting`:
  ```
  Used only as a fallback to inject the same content scripts into tabs that were already open before the extension was installed (they have no content script yet), when the user clicks "Start inspecting". Never used to inject remote or dynamic code.
  ```
- `storage`:
  ```
  Stores the user's copy-format preference, their custom keyboard shortcut, and their last 10 captures (for the popup's "Recent" re-copy list) in chrome.storage.local. Data never leaves the device.
  ```

**Remote code:** No, I am not using remote code. *(Everything ships in the package; there is no network access at all.)*

**Data usage:** check **nothing** (Pluck collects no data of any kind), then certify the disclosures.

**Privacy policy URL:** `https://getpluck.vercel.app/privacy`

---

## Distribution

- **Visibility:** Public
- **Regions:** All regions
- **Pricing:** Free

## Pre-submit checklist

- [ ] `npm run check && npm test` green
- [ ] `npm run test:e2e` green
- [ ] `npm run package` → upload `dist/pluck-v1.2.0.zip`
- [ ] Version in `manifest.json` is higher than the last published version
- [ ] Privacy policy live at https://getpluck.vercel.app/privacy
- [ ] All 4 screenshots + 2 promo tiles uploaded

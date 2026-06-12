# Changelog

All notable changes to Pluck are documented here. Versions follow [semver](https://semver.org); the `manifest.json` version is the one that ships.

## 1.2.0 — 2026-06-11

First public release. 🎉

### Changed
- **Popup restyled** — macOS-structured layout with Pluck's indigo identity: segmented format control, recording shortcut chip, hairline dividers, full light/dark support, visible keyboard-focus rings.
- **In-page overlay refined** — softer depth and shared glass tokens for the highlight box and label pill, spring-eased confirmation toast, blurred hint chip. All behavior unchanged.
- History entries whose selector may match multiple nodes now show an accessible amber warning.
- `package.json` and `manifest.json` versions are now in sync.

### Added
- `npm run package` — builds a Chrome-Web-Store-ready zip into `dist/`.
- CI (GitHub Actions): static gate + unit tests + real-browser e2e on every push/PR.
- Store listing copy, promotional assets, privacy policy, contributor docs.

## 1.1.0 — 2026-06

### Fixed
- **Shortcut reliability** — the hotkey is now detected by an in-page capture-phase `keydown` listener instead of `chrome.commands`, so it fires on the first press on any site, including browsers where extension commands are unreliable (e.g. Arc). Content scripts are declared in the manifest rather than injected on demand.
- Cold keyboard shortcut now works on every site (`host_permissions: <all_urls>` + declared content scripts).
- Overlay was invisible on sites with positive-`z-index` content — the max z-index now lives on the shadow host itself, defended with `!important` against hostile page CSS.

### Added
- Custom shortcut recorder in the popup (any modifier combo; live-updates every open tab via `storage.onChanged`).

## 1.0.0 — 2026-06

Initial version.

- Press a hotkey, click any element, get an agent-ready CSS selector on the clipboard.
- Verified-unique selector engine: `querySelectorAll`-checked uniqueness, ancestor climbing, `:nth-of-type` only when needed, junk-class filtering (`css-…`, `sc-…`, `jsx-…`, hashy tokens), SVG/MathML tag-case preservation, `CSS.escape` with spec-accurate fallback.
- Three copy formats: **Selector**, **+ Context** (default), **Full** (adds key computed styles).
- ↑/↓ parent/child refinement, Enter to capture, Esc to cancel.
- Shadow-DOM overlay with capture-phase event handling — the page never sees the selection click.
- Last-10 copy history in the popup with re-copy.
- Hardened against adversarial review: 13 verified findings fixed.

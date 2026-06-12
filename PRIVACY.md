# Pluck Privacy Policy

**Effective date:** June 11, 2026

Pluck is a browser extension that copies a CSS selector (and optional context) for an element you click. This policy explains, completely, what Pluck does with data — which is easy, because the answer is: **nothing leaves your machine.**

## What Pluck collects

Nothing. Pluck has **no servers, makes no network requests, and contains no analytics, telemetry, error reporting, or tracking of any kind**. There is no account, no sign-in, and no identifier.

## What Pluck stores — locally, on your device

Pluck uses the browser's `chrome.storage.local` API (data that stays inside your browser profile) for exactly three things:

1. **Your copy-format preference** — `selector`, `context`, or `full`.
2. **Your custom keyboard shortcut**, if you changed it from the default.
3. **Your last 10 captures** — the selector, a short text/HTML snippet of the element you clicked, and the page URL it came from — so the popup can show "Recent" and let you re-copy. You can clear this at any time with the **Clear** button in the popup, and it is deleted automatically when you uninstall the extension.

This data is never transmitted anywhere. It is readable only by Pluck inside your browser.

## What Pluck reads

When — and only when — you activate inspect mode (keyboard shortcut or toolbar button) and click an element, Pluck reads that element's tag, attributes, classes, a truncated snippet of its text, and (in *Full* mode) a few of its computed styles, in order to build the string it puts on your clipboard. Pluck does not read pages in the background, does not scan page content on load, and does not observe your browsing.

## Why Pluck asks for broad host access

The extension requests `host_permissions: <all_urls>` so its content script (which contains the keyboard-shortcut listener) can be present on every page. That is what makes the hotkey fire reliably on the first press on any site. The `scripting` permission is used only as a fallback to inject into tabs that were already open before you installed Pluck. The `storage` permission stores the three items listed above. None of these are used to collect or transmit data.

## Clipboard

Pluck *writes* to your clipboard when you capture an element, and when you click an entry in the popup history. It never reads your clipboard.

## Children's privacy, data sales, third parties

Pluck collects no data from anyone, sells no data, and shares no data — there is nothing to sell or share.

## Changes to this policy

If Pluck's behavior ever changes in a way that affects this policy, the new policy ships with the extension update, with the change noted in the [changelog](CHANGELOG.md). Given the project's design rule — *no network, nothing leaves the machine* — substantive change is not expected.

## Contact

Questions: **developer@william-laverty.com**, or open an issue at [github.com/william-laverty/pluck](https://github.com/william-laverty/pluck).

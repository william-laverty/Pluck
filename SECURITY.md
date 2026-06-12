# Security Policy

Pluck's security posture is simple by design: **no network, no remote code, no data collection.** The extension only reads the DOM of the page you invoke it on, writes the result to your clipboard, and stores your preferences and last 10 captures locally via `chrome.storage.local`.

## Reporting a vulnerability

If you find a vulnerability — especially anything that lets a hostile page break out of the overlay's isolation, capture input it shouldn't, or tamper with what lands on the clipboard — please email **developer@william-laverty.com** rather than opening a public issue. Include the page or a minimal repro.

You can expect an acknowledgement within 72 hours. Fixes for confirmed issues ship as a priority release.

## Scope notes for researchers

Things we consider security-relevant:

- A page influencing the *content* that Pluck copies in a way the user can't see (clipboard injection).
- Escaping the Shadow-DOM/event isolation so the page observes or interferes with inspect mode.
- The selection click leaking to the page (it is suppressed by capture-phase handlers by design).

Things that are out of scope:

- Pluck not working on restricted pages (`chrome://`, the Web Store) — that's a platform restriction, handled gracefully.
- Issues requiring another compromised extension or a compromised browser.

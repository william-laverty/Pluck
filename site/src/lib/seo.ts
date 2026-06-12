export const SITE_URL = "https://getpluck.vercel.app";
export const SITE_NAME = "Pluck";
export const GITHUB_URL = "https://github.com/william-laverty/pluck";
export const AUTHOR = "William Laverty";
export const CONTACT_EMAIL = "developer@william-laverty.com";
export const VERSION = "1.2.0";

export const TITLE = "Pluck — copy any element for your AI agent";
export const DESCRIPTION =
  "Hit a hotkey, click any element, and an agent-ready CSS selector lands on your clipboard. A free, open-source Chrome extension for telling Claude Code, Cursor, Copilot — any AI coding agent — exactly which element you mean. No network, no tracking.";

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Which AI agents does Pluck work with?",
    a: "All of them — Pluck puts plain text on your clipboard. Paste it into Claude Code, Cursor, Copilot, Codex, Windsurf, Aider, or a plain chat window. The default format includes the selector plus the element's text and opening tag, which is exactly the context a coding agent needs to find the element in your source.",
  },
  {
    q: "Which browsers are supported?",
    a: "Any Chromium browser with Manifest V3: Chrome, Edge, Brave and Arc. Pluck handles its keyboard shortcut in-page rather than through the browser's command API, so it fires reliably on the first press — including in Arc, where extension shortcuts are notoriously flaky.",
  },
  {
    q: "Why does Pluck ask for access to all sites?",
    a: "The content script containing the shortcut listener must already be on whatever page you're looking at — that's what makes the hotkey work instantly on any site, with no service-worker wake-up or injection race. The script is inert until you activate inspect mode, and it never reads a page on its own. The code is open source, so you can verify exactly what it does.",
  },
  {
    q: "Does Pluck send my data anywhere?",
    a: "No. Pluck makes zero network requests — there's no server, no analytics, no telemetry, no accounts. Your format preference, custom shortcut and last 10 captures are stored locally in your browser and deleted when you uninstall. The architecture makes collection impossible, not just disallowed.",
  },
  {
    q: "Can I change the keyboard shortcut?",
    a: "Yes — open the popup, click the shortcut chip, and press any combination (it needs at least one of Ctrl, Alt or Cmd). It updates live in every open tab. The default is ⌘⇧E on macOS and Ctrl+Shift+E on Windows and Linux.",
  },
  {
    q: "What if a selector matches more than one element?",
    a: "Pluck verifies every selector against the live DOM — it must match exactly one node before it's offered. The engine climbs ancestors and adds :nth-of-type() only when needed. In the rare case perfect uniqueness can't be reached, the toast and your history flag it with an amber \"may match multiple\" warning, so you're never surprised.",
  },
];

export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: "Pluck",
    headline: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Browser extension",
    operatingSystem: "Chrome, Edge, Brave, Arc (Chromium)",
    browserRequirements: "Requires a Chromium-based browser with Manifest V3",
    softwareVersion: VERSION,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    license: `${GITHUB_URL}/blob/main/LICENSE`,
    downloadUrl: GITHUB_URL,
    softwareHelp: { "@type": "CreativeWork", url: `${GITHUB_URL}/issues` },
    author: { "@type": "Person", name: AUTHOR, email: CONTACT_EMAIL },
    image: `${SITE_URL}/og.png`,
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: DESCRIPTION,
    publisher: { "@type": "Person", name: AUTHOR },
  };
}

export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

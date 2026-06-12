import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { PluckMark } from "@/components/Logo";
import { CONTACT_EMAIL, GITHUB_URL, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Support",
  description:
    "Get help with Pluck: troubleshooting the keyboard shortcut, clipboard issues, selector questions, and how to reach a human. Most issues have a 30-second fix.",
  alternates: { canonical: "/support" },
};

const TROUBLESHOOTING: { q: string; a: React.ReactNode }[] = [
  {
    q: "The keyboard shortcut does nothing",
    a: (
      <>
        Ninety percent of the time: the tab was <strong>already open before you installed (or
        updated) Pluck</strong>. Those tabs need one refresh to pick up the in-page listener —
        newly opened tabs work immediately. Alternatively, click the toolbar button → it works on
        open tabs without a refresh. Also note that browsers block all extensions on{" "}
        <code className="font-mono text-[13.5px]">chrome://</code> pages and the Chrome Web Store
        itself (Pluck flashes a red × on its icon there), and check the popup in case you
        previously recorded a different combo.
      </>
    ),
  },
  {
    q: "The toast says “Copy blocked — try again”",
    a: (
      <>
        Some pages restrict programmatic clipboard access; Pluck automatically falls back to a
        second copy method, so this is rare. If it happens: click the capture's entry in the
        popup's <strong>Recent</strong> list to re-copy it from there. If a particular site blocks
        copies consistently, please{" "}
        <a className="text-accent-soft underline decoration-accent/40 underline-offset-4 hover:text-ink" href={`${GITHUB_URL}/issues/new?template=bug_report.yml`} target="_blank" rel="noopener noreferrer">
          file a bug with the URL
        </a>
        .
      </>
    ),
  },
  {
    q: "Why does my selector have :nth-of-type() in it?",
    a: (
      <>
        Because nothing shorter was unique. Pluck verifies every selector against the live DOM —
        it must match <em>exactly one</em> node — and only adds{" "}
        <code className="font-mono text-[13.5px]">:nth-of-type()</code> or ancestor segments when
        the element has no unique identity of its own. Tip: press <kbd className="key">↑</kbd>{" "}
        before clicking to grab a parent container that has an id or distinctive class — those
        anchor much shorter selectors.
      </>
    ),
  },
  {
    q: "I got an amber “may match multiple” warning",
    a: (
      <>
        On rare, highly repetitive pages there's no uniquely addressable path within a sane depth.
        Pluck tells you instead of pretending: the toast and the history entry carry an amber
        warning. The copied text still includes the element's text and opening tag, which is
        usually enough for an AI agent to locate it in source. If you hit this on a normal-looking
        page, send the URL — the engine's heuristics evolve from exactly these reports.
      </>
    ),
  },
  {
    q: "How do I change or reset the shortcut?",
    a: (
      <>
        Open the popup → click the shortcut chip → press your combination (it needs Ctrl, Alt or ⌘
        — plain letters won't record, so typing can never trigger it). It updates live in every
        open tab. <strong>Reset shortcut</strong> in the popup footer restores the default (⌘⇧E on
        macOS, Ctrl+Shift+E elsewhere).
      </>
    ),
  },
  {
    q: "Does Pluck work in Arc, Brave and Edge?",
    a: (
      <>
        Yes — any Chromium browser with Manifest V3. Arc is specifically why Pluck handles its
        shortcut in-page instead of through the browser's command API: extension commands are
        unreliable there, an in-page listener isn't. Install the same way:{" "}
        <code className="font-mono text-[13.5px]">chrome://extensions</code> (or the browser's
        equivalent) → Developer mode → Load unpacked.
      </>
    ),
  },
];

function contactPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${SITE_URL}/support#contactpage`,
    name: "Pluck Support",
    url: `${SITE_URL}/support`,
    description: "Support and troubleshooting for the Pluck browser extension.",
    about: { "@id": `${SITE_URL}/#software` },
  };
}

export default function SupportPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema()) }}
      />
      <Header />
      <main className="glow-soft min-h-screen px-5 pt-36 pb-24">
        <div className="mx-auto max-w-2xl">
          <header className="mb-12">
            <PluckMark size={40} radius={11} />
            <h1 className="mt-6 text-[clamp(30px,4vw,44px)] leading-[1.1] font-semibold">Support</h1>
            <p className="mt-4 max-w-lg text-[16px] text-ink-soft">
              Most Pluck issues have a 30-second fix — start with the checklist below. If you're
              still stuck, a human reads every report.
            </p>
          </header>

          {/* contact channels */}
          <div className="mb-14 grid gap-4 sm:grid-cols-3">
            <a
              href={`${GITHUB_URL}/issues/new?template=bug_report.yml`}
              target="_blank"
              rel="noopener noreferrer"
              className="card block p-5"
            >
              <p className="text-[15px] font-semibold">Report a bug</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                Broken behavior or a wrong selector — the page URL is the most useful detail.
              </p>
            </a>
            <a
              href={`${GITHUB_URL}/issues/new?template=feature_request.yml`}
              target="_blank"
              rel="noopener noreferrer"
              className="card block p-5"
            >
              <p className="text-[15px] font-semibold">Request a feature</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                Tell us the friction first — what's slower than it should be?
              </p>
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`} className="card block p-5">
              <p className="text-[15px] font-semibold">Email</p>
              <p className="mt-1.5 text-[13px] leading-relaxed break-all text-ink-soft">
                {CONTACT_EMAIL}
                <br />
                Security reports especially.
              </p>
            </a>
          </div>

          {/* troubleshooting */}
          <h2 className="mb-2 text-[22px] font-semibold">Troubleshooting</h2>
          <div className="border-t border-white/10">
            {TROUBLESHOOTING.map(({ q, a }) => (
              <details key={q} className="faq">
                <summary>{q}</summary>
                <div className="faq-body">{a}</div>
              </details>
            ))}
          </div>

          {/* before you file */}
          <div className="card mt-14 p-7" style={{ background: "rgba(99,102,241,0.06)" }}>
            <h2 className="mb-3 text-[17px] font-semibold">Filing a great bug report</h2>
            <ul className="list-disc space-y-2 pl-5 text-[14.5px] leading-relaxed text-ink-soft">
              <li>
                Include the <strong>page URL</strong> and which element you clicked — selector-engine
                bugs are usually one weird page away from reproducible.
              </li>
              <li>
                Paste the <strong>output you got</strong> and what you expected instead.
              </li>
              <li>
                Mention your browser and Pluck version (shown at{" "}
                <code className="font-mono text-[13px]">chrome://extensions</code>).
              </li>
            </ul>
            <p className="mt-4 text-[13.5px] text-ink-dim">
              Vulnerabilities: please email rather than opening a public issue — see the{" "}
              <a
                className="text-accent-soft underline decoration-accent/40 underline-offset-4 hover:text-ink"
                href={`${GITHUB_URL}/blob/main/SECURITY.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                security policy
              </a>
              .
            </p>
          </div>

          <div className="mt-14 flex flex-wrap gap-3 border-t border-white/10 pt-8">
            <Link href="/" className="btn-line">
              ← Back to Pluck
            </Link>
            <Link href="/privacy" className="btn-line">
              Privacy policy
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
